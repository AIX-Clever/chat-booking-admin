
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Divider } from '@mui/material';
import { Node } from '@xyflow/react';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    onUpdateNode: (nodeId: string, data: Record<string, unknown>) => void;
}

export default function PropertiesPanel({ selectedNode, onUpdateNode }: PropertiesPanelProps) {
    const [label, setLabel] = useState('');
    const [message, setMessage] = useState('');
    const [question, setQuestion] = useState('');
    const [toolName, setToolName] = useState('');

    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data.label as string || '');
            setMessage(selectedNode.data.message as string || '');
            setQuestion(selectedNode.data.question as string || '');
            setToolName(selectedNode.data.toolName as string || '');
        } else {
            setLabel('');
            setMessage('');
            setQuestion('');
            setToolName('');
        }
    }, [selectedNode]);

    const handleApply = () => {
        if (!selectedNode) return;

        const newData: Record<string, unknown> = { label };

        if (selectedNode.type === 'message') {
            newData.message = message;
        } else if (selectedNode.type === 'decision') {
            newData.question = question;
        } else if (selectedNode.type === 'tool') {
            newData.toolName = toolName;
        }

        onUpdateNode(selectedNode.id, newData);
    };

    if (!selectedNode) {
        return (
            <Paper sx={{ width: 300, p: 2, ml: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Properties
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Select a node to edit its properties.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ width: 300, p: 2, ml: 2 }}>
            <Typography variant="h6" gutterBottom>
                Edit {selectedNode.type?.charAt(0).toUpperCase() + selectedNode.type?.slice(1)} Node
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
                ID: {selectedNode.id}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Box component="form" noValidate autoComplete="off">
                <TextField
                    label="Label"
                    fullWidth
                    margin="normal"
                    size="small"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                />

                {selectedNode.type === 'message' && (
                    <TextField
                        label="Message Content"
                        fullWidth
                        margin="normal"
                        multiline
                        rows={4}
                        size="small"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                )}

                {selectedNode.type === 'decision' && (
                    <TextField
                        label="Question"
                        fullWidth
                        margin="normal"
                        size="small"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        helperText="e.g. Is user authenticated?"
                    />
                )}

                {selectedNode.type === 'tool' && (
                    <TextField
                        label="Tool Name"
                        fullWidth
                        margin="normal"
                        size="small"
                        value={toolName}
                        onChange={(e) => setToolName(e.target.value)}
                        helperText="Function name in backend"
                    />
                )}

                <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleApply}
                >
                    Apply Changes
                </Button>
            </Box>
        </Paper>
    );
}
