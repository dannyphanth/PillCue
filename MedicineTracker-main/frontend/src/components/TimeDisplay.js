import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import mockData from '../data/mockData.json';

const TimeDisplay = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [nextMedication, setNextMedication] = useState(null);
    const [timeUntilNext, setTimeUntilNext] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const { medications } = mockData;

        // Find the next medication time
        const now = currentTime;
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let nextTime = null;
        let nextMed = null;

        medications.forEach(med => {
            for (let i = 1; i <= med.frequency; i++) {
                const [hours, minutes] = med[`time${i}`].split(':');
                const medTime = new Date(today);
                medTime.setHours(parseInt(hours), parseInt(minutes), 0);

                if (medTime > now && (!nextTime || medTime < nextTime)) {
                    nextTime = medTime;
                    nextMed = med;
                }
            }
        });

        setNextMedication(nextMed);
        if (nextTime) {
            const diff = nextTime - now;
            setTimeUntilNext(diff);
        }
    }, [currentTime]);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatCountdown = (ms) => {
        if (ms <= 0) return 'Now';

        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                mb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'background.paper'
            }}
        >
            <Box>
                <Typography variant="h6" color="text.secondary">
                    Current Time
                </Typography>
                <Typography variant="h4">
                    {formatTime(currentTime)}
                </Typography>
            </Box>

            {nextMedication && timeUntilNext && (
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="text.secondary">
                        Next: {nextMedication.pillName}
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{
                            color: timeUntilNext <= 30 * 60 * 1000 ? 'warning.main' : 'text.primary'
                        }}
                    >
                        {formatCountdown(timeUntilNext)}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default TimeDisplay; 