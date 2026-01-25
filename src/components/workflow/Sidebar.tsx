import React, { useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Chip, Box } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MessageIcon from '@mui/icons-material/Message';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BuildIcon from '@mui/icons-material/Build';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LockIcon from '@mui/icons-material/Lock';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import UpgradeModal from '../common/UpgradeModal';

export default function Sidebar() {
    const { canUseAI, plan } = usePlanFeatures();
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        if (!canUseAI && nodeType === 'ai_knowledge') {
            event.preventDefault();
            return;
        }
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleLockedClick = () => {
        setUpgradeModalOpen(true);
    };

    return (
        <Paper sx={{ width: 250, p: 2, mr: 2 }}>
            <Typography variant="h6" gutterBottom>
                Nodes
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Drag and drop nodes to the editor.
            </Typography>

            <List>
                <ListItem disablePadding sx={{ mb: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                    <ListItemButton
                        onDragStart={(event) => onDragStart(event, 'start')}
                        draggable
                        sx={{ cursor: 'grab' }}
                    >
                        <ListItemIcon>
                            <PlayArrowIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary="Start" secondary="Entry Point" />
                    </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                    <ListItemButton
                        onDragStart={(event) => onDragStart(event, 'message')}
                        draggable
                        sx={{ cursor: 'grab' }}
                    >
                        <ListItemIcon>
                            <MessageIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Message" secondary="Send text" />
                    </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                    <ListItemButton
                        onDragStart={(event) => onDragStart(event, 'decision')}
                        draggable
                        sx={{ cursor: 'grab' }}
                    >
                        <ListItemIcon>
                            <HelpOutlineIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText primary="Decision" secondary="Yes/No Branch" />
                    </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                    <ListItemButton
                        onDragStart={(event) => onDragStart(event, 'tool')}
                        draggable
                        sx={{ cursor: 'grab' }}
                    >
                        <ListItemIcon>
                            <BuildIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText primary="Tool Call" secondary="Execute Action" />
                    </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 1, border: '1px solid #9c27b0', borderRadius: 1 }}>
                    <ListItemButton
                        onDragStart={(event) => onDragStart(event, 'dynamic_options')}
                        draggable
                        sx={{ cursor: 'grab' }}
                    >
                        <ListItemIcon>
                            <DashboardCustomizeIcon color="secondary" sx={{ color: '#9c27b0' }} />
                        </ListItemIcon>
                        <ListItemText primary="Dynamic Options" secondary="Interactive Menu" />
                    </ListItemButton>
                </ListItem>

                {/* AI Knowledge Node (Awareness Upgrade) */}
                <ListItem
                    disablePadding
                    sx={{
                        mb: 1,
                        border: '1px solid',
                        borderColor: canUseAI ? '#8B5CF6' : '#e0e0e0',
                        borderRadius: 1,
                        bgcolor: canUseAI ? 'rgba(139, 92, 246, 0.04)' : 'transparent',
                        opacity: canUseAI ? 1 : 0.7
                    }}
                >
                    <ListItemButton
                        onDragStart={(event) => onDragStart(event, 'ai_knowledge')}
                        onClick={!canUseAI ? handleLockedClick : undefined}
                        draggable={canUseAI}
                        sx={{ cursor: canUseAI ? 'grab' : 'not-allowed' }}
                    >
                        <ListItemIcon>
                            {canUseAI ? (
                                <AutoAwesomeIcon sx={{ color: '#8B5CF6' }} />
                            ) : (
                                <LockIcon color="disabled" />
                            )}
                        </ListItemIcon>
                        <Box>
                            <ListItemText primary="AI Answer" secondary="RAG / Knowledge" />
                            {!canUseAI && <Chip label="PRO" size="small" color="default" sx={{ height: 20, fontSize: '0.625rem' }} />}
                        </Box>
                    </ListItemButton>
                </ListItem>
            </List>

            <UpgradeModal
                open={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                feature="WORKFLOW"
                currentPlan={plan}
            />
        </Paper>
    );
}
