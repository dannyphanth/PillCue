import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import Layout from '../components/Layout';

const Dashboard = () => {
    return (
        <Layout>
            <Container maxWidth="lg">
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Dashboard
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Today's Medications
                                </Typography>
                                {/* TODO: Add medication list */}
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Upcoming Reminders
                                </Typography>
                                {/* TODO: Add reminders list */}
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Medication History
                                </Typography>
                                {/* TODO: Add history chart */}
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </Layout>
    );
};

export default Dashboard; 