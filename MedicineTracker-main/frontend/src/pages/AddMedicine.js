import React, { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const AddMedicine = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // Raw script output
    const [parsedData, setParsedData] = useState(null); // Clean JSON from /get-parsed-data
    const [error, setError] = useState(null);

    const handleRunScript = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setParsedData(null);

        try {
            const runRes = await fetch('http://localhost:5050/run-script');
            const runData = await runRes.json();
            console.log('📡 Backend responded:', runData);
            setResult(runData.output);

            // ✅ Now fetch the parsed JSON result
            const parsedRes = await fetch('http://localhost:5050/get-parsed-data');
            const parsed = await parsedRes.json();
            if (parsed.status === 'success') {
                setParsedData(parsed.data);
            } else {
                setError('Parsed JSON not found or error occurred.');
            }

        } catch (err) {
            console.error('❌ Backend error:', err);
            setError('Something went wrong while calling the backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/')}
                sx={{ mb: 3 }}
            >
                Back to Home
            </Button>

            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Add New Medicine
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    This page will contain the form for adding new medications.
                </Typography>
            </Paper>

            <Button
                variant="contained"
                onClick={handleRunScript}
                disabled={loading}
                sx={{ mb: 2 }}
            >
                {loading ? <CircularProgress size={24} /> : 'Run OCR and Analyze'}
            </Button>

            {error && (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}

            {parsedData && (
                <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>📦 Extracted Medicine Info:</Typography>
                    <Typography><strong>Pill Name:</strong> {parsedData.pillName}</Typography>
                    <Typography><strong>Dosage:</strong> {parsedData.dosage}</Typography>
                    <Typography><strong>Frequency:</strong> {parsedData.frequency}x per day</Typography>
                    <Typography><strong>Swallowed:</strong> {parsedData.swallowed ? 'Yes' : 'No'}</Typography>
                    <Typography><strong>Time 1:</strong> {parsedData.time1 || '—'}</Typography>
                    <Typography><strong>Time 2:</strong> {parsedData.time2 || '—'}</Typography>
                    <Typography><strong>Quantity:</strong> {parsedData.quantity}</Typography>
                </Paper>
            )}

            {result && (
                <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Raw Backend Output (stdout):
                    </Typography>
                    <Typography
                        variant="body2"
                        component="pre"
                        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                        {result}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default AddMedicine;
