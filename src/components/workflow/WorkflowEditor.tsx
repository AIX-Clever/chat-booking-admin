'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    NodeTypes,
    Node,
    Edge,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box } from '@mui/material';

import { StartNode } from './nodes/StartNode';
import { MessageNode } from './nodes/MessageNode';
import { DecisionNode } from './nodes/DecisionNode';
import { ToolNode } from './nodes/ToolNode';
import { DynamicOptionsNode } from './nodes/DynamicOptionsNode';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes: NodeTypes = {
    start: StartNode,
    message: MessageNode,
    decision: DecisionNode,
    tool: ToolNode,
    dynamic_options: DynamicOptionsNode,
};



let id = 0;
const getId = () => `dndnode_${id++}`;


interface WorkflowEditorProps {
    initialNodes?: Node[];
    initialEdges?: Edge[];
}

export interface WorkflowEditorRef {
    getFlow: () => { nodes: Node[]; edges: Edge[] };
}

const WorkflowEditor = React.forwardRef<WorkflowEditorRef, WorkflowEditorProps>(({ initialNodes = [], initialEdges = [] }, ref) => {
    return (
        <ReactFlowProvider>
            <WorkflowEditorContent initialNodes={initialNodes} initialEdges={initialEdges} editorRef={ref} />
        </ReactFlowProvider>
    );
});

WorkflowEditor.displayName = 'WorkflowEditor';
export default WorkflowEditor;

interface ContentProps {
    initialNodes: Node[];
    initialEdges: Edge[];
    editorRef: React.ForwardedRef<WorkflowEditorRef>;
}

function WorkflowEditorContent({ initialNodes, initialEdges, editorRef }: ContentProps) {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Update internal state when props change (loading from backend)
    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    // Expose methods to parent
    React.useImperativeHandle(editorRef, () => ({
        getFlow: () => ({ nodes, edges })
    }));

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            // simple approximation
            const position = {
                x: event.clientX - 200,
                y: event.clientY - 100,
            };

            const newNode: Node = {
                id: getId(),
                type,
                position,
                data: { label: `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [setNodes],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const onUpdateNode = (nodeId: string, data: Record<string, unknown>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: { ...node.data, ...data },
                    };
                }
                return node;
            })
        );
        setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...data } } : null);
    };

    return (
        <Box sx={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)' }}>
            <Sidebar />
            <Box
                className="reactflow-wrapper"
                ref={reactFlowWrapper}
                sx={{ flexGrow: 1, height: '100%', border: '1px solid #ddd', borderRadius: 2, position: 'relative' }}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    fitView
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </Box>
            <PropertiesPanel selectedNode={selectedNode} onUpdateNode={onUpdateNode} />
        </Box>
    );
}
