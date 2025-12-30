'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Breadcrumbs, Link, CircularProgress, Alert, Snackbar } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import WorkflowEditor, { WorkflowEditorRef } from '../../../components/workflow/WorkflowEditor';
import { generateClient } from 'aws-amplify/api';
import { GET_WORKFLOW, UPDATE_WORKFLOW } from '../../../graphql/queries';
import { Node, Edge } from '@xyflow/react';

const client = generateClient();

interface WorkflowData {
    workflowId: string;
    name: string;
    steps: any; // AWSJSON
    metadata: any; // AWSJSON
}

export default function WorkflowPageClient({ id }: { id: string }) {
    const editorRef = useRef<WorkflowEditorRef>(null);
    const [loading, setLoading] = useState(true);
    const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
    const [initialNodes, setInitialNodes] = useState<Node[]>([]);
    const [initialEdges, setInitialEdges] = useState<Edge[]>([]);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    const parseWorkflowData = React.useCallback((data: WorkflowData) => {
        let steps = data.steps;
        if (typeof steps === 'string') {
            try {
                steps = JSON.parse(steps);
            } catch (e) {
                console.error("Error parsing steps JSON", e);
                steps = {};
            }
        }

        let metadata = data.metadata;
        if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch { metadata = {}; }
        }
        const positions = metadata?.positions || {};

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Simple layout counter if no positions
        let yCounter = 0;

        Object.keys(steps).forEach((stepId) => {
            const step = steps[stepId];

            // Map backend type to frontend node type
            let type = 'message';
            if (step.type === 'DYNAMIC_OPTIONS') type = 'dynamic_options';
            else if (step.type === 'QUESTION') type = 'decision'; // Roughly maps
            else if (step.type === 'TOOL') type = 'tool';
            else if (step.stepId === 'start') type = 'start'; // explicit start

            // Override for Start
            if (stepId === 'start' && step.type === 'DYNAMIC_OPTIONS') {
                // Keep dynamic_options but maybe style/label?
                // The Node Types handle rendering.
            }

            if (step.type === 'DYNAMIC_OPTIONS') type = 'dynamic_options';
            else if (stepId === 'start' && !step.type) type = 'start'; // Legacy start

            const pos = positions[stepId] || { x: 250, y: yCounter * 150 + 50 };
            yCounter++;

            nodes.push({
                id: stepId,
                type: type.toLowerCase(),
                position: pos,
                data: {
                    label: step.stepId,
                    message: step.content && (typeof step.content === 'object') && ('text' in step.content) ? step.content.text : undefined,
                    text: step.content?.text,
                    sources: step.content?.sources,
                    // ... other fields
                }
            });

            // Edges
            if (step.next) {
                edges.push({
                    id: `e-${stepId}-${step.next}`,
                    source: stepId,
                    target: step.next
                });
            }

            // Dynamic Mapping Edges
            if (step.content?.options_mapping) {
                Object.keys(step.content.options_mapping).forEach(sourceKey => {
                    const _config = step.content.options_mapping[sourceKey];
                    if (_config.next) {
                        edges.push({
                            id: `e-${stepId}-${sourceKey}-${_config.next}`,
                            source: stepId,
                            sourceHandle: `source-${sourceKey}`,
                            target: _config.next
                        });
                    }
                });
            }
        });

        setInitialNodes(nodes);
        setInitialEdges(edges);
    }, []);

    const fetchWorkflow = React.useCallback(async () => {
        setLoading(true);
        try {
            const response: any = await client.graphql({
                query: GET_WORKFLOW,
                variables: { workflowId: id }
            });
            const data = response.data.getWorkflow;
            if (data) {
                setWorkflow(data);
                parseWorkflowData(data);
            }
        } catch (error) {
            console.error('Error fetching workflow:', error);
            setToast({ open: true, message: 'Error loading workflow', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [id, parseWorkflowData]);

    useEffect(() => {
        fetchWorkflow();
    }, [fetchWorkflow]);

    const handleSave = async () => {
        if (!editorRef.current || !workflow) return;
        setSaving(true);
        try {
            const { nodes, edges } = editorRef.current.getFlow();

            // Serealize Nodes -> Backend Steps
            // Note: Currently we only update CONTENT and POSITION (metadata).
            // Structural changes (adding/removing nodes) need to update 'steps' map.

            const stepsMap: Record<string, any> = {};
            const positionsMap: Record<string, any> = {};

            nodes.forEach(node => {
                positionsMap[node.id] = node.position;

                // Reconstruct step object
                let backendType = 'MESSAGE';
                if (node.type === 'dynamic_options') backendType = 'DYNAMIC_OPTIONS';
                else if (node.type === 'decision') backendType = 'QUESTION';
                else if (node.type === 'tool') backendType = 'TOOL';
                else if (node.type === 'start') backendType = 'MESSAGE'; // Start node treated as message/trigger

                const content: Record<string, any> = {};
                if (node.data.message) content.text = node.data.message;
                if (node.data.text) content.text = node.data.text;
                if (node.data.sources) content.sources = node.data.sources;

                let originalStep: any = {};
                if (workflow.steps && typeof workflow.steps === 'string') {
                    try { originalStep = JSON.parse(workflow.steps)[node.id] || {}; } catch { }
                } else if (workflow.steps) {
                    originalStep = workflow.steps[node.id] || {};
                }

                // Map Edges to 'next' or 'options_mapping'
                let nextStepId = originalStep.next;
                const optionsMapping = originalStep.content?.options_mapping || {};

                const nodeEdges = edges.filter(e => e.source === node.id);

                if (nodeEdges.length > 0) {
                    if (backendType === 'DYNAMIC_OPTIONS') {
                        // Update mappings based on edges
                        nodeEdges.forEach(edge => {
                            if (edge.sourceHandle && edge.sourceHandle.startsWith('source-')) {
                                const key = edge.sourceHandle.replace('source-', '');
                                // Ensure structure exists
                                if (!optionsMapping[key]) optionsMapping[key] = { label: key, value: `flow_${key}` };
                                optionsMapping[key].next = edge.target;
                            } else if (!edge.sourceHandle) {
                                // default next?
                                nextStepId = edge.target;
                            }
                        });
                        content.options_mapping = optionsMapping;
                    } else {
                        // Simple next
                        // Take the first edge without a source handle (or just first one)
                        const directEdge = nodeEdges.find(e => !e.sourceHandle) || nodeEdges[0];
                        if (directEdge) {
                            nextStepId = directEdge.target;
                        }
                    }
                }

                stepsMap[node.id] = {
                    stepId: node.id,
                    type: backendType,
                    content: { ...originalStep.content, ...content },
                    next: nextStepId
                };
            });

            await client.graphql({
                query: UPDATE_WORKFLOW,
                variables: {
                    input: {
                        workflowId: workflow.workflowId,
                        steps: JSON.stringify(stepsMap),
                        metadata: JSON.stringify({ positions: positionsMap })
                    }
                }
            });

            setToast({ open: true, message: 'Workflow saved successfully', severity: 'success' });
        } catch (error) {
            console.error("Error saving workflow", error);
            setToast({ open: true, message: 'Error saving workflow', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                        <Link underline="hover" color="inherit" href="/workflows">
                            Workflows
                        </Link>
                        <Typography color="text.primary">Edit Workflow</Typography>
                    </Breadcrumbs>
                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                        {workflow ? workflow.name : 'Loading...'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={loading || saving}
                >
                    Save Workflow
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, position: 'relative' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <WorkflowEditor
                        ref={editorRef}
                        initialNodes={initialNodes}
                        initialEdges={initialEdges}
                    />
                )}
            </Box>
            <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
                <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
