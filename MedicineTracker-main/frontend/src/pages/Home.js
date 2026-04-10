import React, { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import mockData from '../data/mockData.json';
import MedicationModal from '../components/MedicationModal';
import MedicationSchedule from '../components/MedicationSchedule';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { medications } = mockData;
    const [selectedMed, setSelectedMed] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [sortedSchedule, setSortedSchedule] = useState([]);
    const [parsedData, setParsedData] = useState(null);
    const navigate = useNavigate();

    // Fetch parsed data when component mounts
    useEffect(() => {
        const fetchParsedData = async () => {
            try {
                const response = await fetch('http://localhost:5050/get-parsed-data');
                const data = await response.json();
                if (data.status === 'success') {
                    setParsedData(data.data);
                }
            } catch (error) {
                console.error('Error fetching parsed data:', error);
            }
        };

        fetchParsedData();
    }, []);

    const handleMedClick = (medication) => {
        // Find the next earliest instance in schedule for the same medication
        const nextInstance = sortedSchedule.find(
            (instance) =>
                instance.pillName === medication.pillName &&
                instance.scheduledTime >= new Date()
        )
        setSelectedMed(nextInstance || medication); // Fallback to clicked instance
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedMed(null);
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f5f5' }}>
            {/* Left Sidebar - Medications List */}
            <Paper
                elevation={3}
                sx={{
                    width: 240,
                    p: 2,
                    borderRadius: 0,
                    borderRight: '1px solid #e0e0e0',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Medications</Typography>
                </Box>
                <List sx={{ px: 1 }}>
                    {medications.map((med, index) => (
                        <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => handleMedClick(med)}
                                sx={{
                                    borderRadius: '28px',
                                    border: '1px solid #e0e0e0',
                                    bgcolor: '#e3f2fd',
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                        borderColor: 'primary.light',
                                        boxShadow: '0 2px 4px rgba(33, 150, 243, 0.15)',
                                        '& .MuiListItemText-secondary': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    py: 1.5,
                                    px: 2,
                                }}
                            >
                                <ListItemText
                                    primary={med.pillName}
                                    secondary={
                                        <>
                                            Quantity: {med.quantity}
                                            <br />
                                            Take {med.frequency}x daily
                                        </>
                                    }
                                    primaryTypographyProps={{
                                        fontWeight: 500,
                                    }}
                                />
                                <ChevronRightIcon sx={{
                                    ml: 1,
                                    opacity: 0.5,
                                    transition: 'opacity 0.2s',
                                    '.MuiListItemButton-root:hover &': {
                                        opacity: 1,
                                    }
                                }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                {/* Display parsed data if available */}
                {parsedData && (
                    <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Latest Scanned Medicine:
                        </Typography>
                        <Typography><strong>Name:</strong> {parsedData.pillName || 'Not specified'}</Typography>
                        <Typography><strong>Dosage:</strong> {parsedData.dosage}</Typography>
                        <Typography><strong>Frequency:</strong> {parsedData.frequency}x per day</Typography>
                        <Typography><strong>Swallowed:</strong> {parsedData.swallowed ? 'Yes' : 'No'}</Typography>
                        <Typography><strong>Time 1:</strong> {parsedData.time1 || '—'}</Typography>
                        <Typography><strong>Time 2:</strong> {parsedData.time2 || '—'}</Typography>
                        <Typography><strong>Quantity:</strong> {parsedData.quantity}</Typography>
                    </Paper>
                )}
            </Paper>

            {/* Main Content Area */}
            <Box sx={{
                flex: 1,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Typography variant="h4">Today's Schedule</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/add-medicine')}
                        sx={{
                            borderRadius: '28px',
                            textTransform: 'none',
                            px: 3,
                            py: 1,
                        }}
                    >
                        Add Medicine
                    </Button>
                </Box>

                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        <MedicationSchedule
                            handleMedClick={handleMedClick} 
                            onScheduleReady={setSortedSchedule}
                        />
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/scan-medicine')}
                        sx={{
                            borderRadius: '28px',
                            px: 4,
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            width: '100%',
                            mb: 2
                        }}
                    >
                        Scan Medicine
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/take-medicine')}
                        sx={{
                            borderRadius: '28px',
                            px: 4,
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            width: '100%'
                        }}
                    >
                        Take Medicine
                    </Button>
                </Box>
            </Box>

            <MedicationModal
                open={modalOpen}
                onClose={handleCloseModal}
                medication={selectedMed}
            />
        </Box>
    );
};

export default Home; 