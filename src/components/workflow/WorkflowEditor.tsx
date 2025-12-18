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
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box } from '@mui/material';

import { StartNode } from './nodes/StartNode';
import { MessageNode } from './nodes/MessageNode';
import { DecisionNode } from './nodes/DecisionNode';
import { ToolNode } from './nodes/ToolNode';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes: NodeTypes = {
    start: StartNode,
    message: MessageNode,
    decision: DecisionNode,
    tool: ToolNode,
};

const initialNodes: Node[] = [
    {
        id: 'start-1',
        type: 'start',
        position: { x: 250, y: 5 },
        data: { label: 'Start' },
    },
    {
        id: 'msg-1',
        type: 'message',
        position: { x: 250, y: 150 },
        data: { label: 'Welcome', message: 'Hello! How can I help you today?' },
    },
    {
        id: 'dec-1',
        type: 'decision',
        position: { x: 250, y: 300 },
        data: { label: 'Is Member?', question: 'User is registered?' },
    },
];

const initialEdges = [
    { id: 'e1-2', source: 'start-1', target: 'msg-1' },
    { id: 'e2-3', source: 'msg-1', target: 'dec-1' }
];

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function WorkflowEditor() {
    return (
        <ReactFlowProvider>
            <WorkflowEditorContent />
        </ReactFlowProvider>
    );
}

function WorkflowEditorContent() {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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

            // projected position not working precisely without instance, simple approximation
            const position = {
                x: event.clientX - 200, // adjust for sidebar width approximation
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
        // Update selected node reference to reflect changes immediately in panel if needed
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
