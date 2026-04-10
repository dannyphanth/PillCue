import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useNavigate } from 'react-router-dom';

const ScanMedicine = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleScan = async () => {
        console.log('🔄 Starting webcam scan...');
        setIsLoading(true);
        setError(null);
        try {
            console.log('📡 Sending request to backend...');
            const response = await fetch('http://localhost:5050/start-webcam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            console.log('📥 Received response:', response.status);
            const data = await response.json();
            console.log('📦 Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to start webcam');
            }

            console.log('✅ Webcam started successfully');
        } catch (err) {
            console.error('❌ Error starting webcam:', err);
            setError(err.message || 'Failed to start webcam. Please check if the backend server is running.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', 
            bgcolor: '#f5f5f5',
            p: 3,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
        }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Scan Medicine
            </Typography>

            {error && (
                <Alert severity="error" sx={{ width: '100%', maxWidth: '400px' }}>
                    {error}
                </Alert>
            )}

            <Button
                variant="contained"
                color="primary"
                onClick={handleScan}
                startIcon={<CameraAltIcon />}
                disabled={isLoading}
                sx={{
                    borderRadius: '28px',
                    textTransform: 'none',
                    px: 4,
                    py: 2,
                    fontSize: '1.2rem',
                    minWidth: '200px'
                }}
            >
                {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    'Open Webcam'
                )}
            </Button>

            <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{
                    borderRadius: '28px',
                    textTransform: 'none',
                    px: 3,
                    py: 1.5
                }}
            >
                Back to Home
            </Button>
        </Box>
    );
};

export default ScanMedicine; 