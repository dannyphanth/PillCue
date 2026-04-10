import React from 'react';
import {
    Modal,
    Box,
    Typography,
    Button,
} from '@mui/material';
import { formatDayAndTime, formatCountdown } from './TimeUtils';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
};

const MedicationModal = ({ open, onClose, medication }) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="medication-modal-title"
        >
            <Box sx={style}>
                <Typography id="medication-modal-title" variant="h6" component="h2" gutterBottom>
                    {medication?.pillName}
                </Typography>

                {/* Placeholder for medication details */}
                <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="body1">
                        Medication details will go here...
                    </Typography>
                    <Typography>
                        Dosage: {medication?.dosage}
                    </Typography>
                    <Typography>
                        Next Dosage: {medication?.scheduledTime
                            ? formatDayAndTime(new Date(medication.scheduledTime))
                            : 'N/A'}
                    </Typography>
                    <Typography>
                        Time until next dose: {medication?.scheduledTime
                            ? formatCountdown(new Date(medication.scheduledTime))
                            : 'N/A'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={onClose} variant="outlined">
                        Close
                    </Button>
                    <Button variant="contained" color="primary">
                        Take Medicine
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default MedicationModal; 