import React, { useState, useEffect } from 'react';

export const FindCurrentTime = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer); // Cleanup on unmount
    }, []);

    return currentTime;
};

export const formatTime = (time) => {
    if (time instanceof Date) {
        return time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } else {
        // Handle time string (e.g., "08:00")
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    }
};

export const formatDayAndTime = (time) => {
    if (!time || !(time instanceof Date)) {
        return 'Invalid time';
    }

    const now = new Date();
    const isToday = time.toDateString() === now.toDateString();
    const isTomorrow = time.toDateString() === new Date(now.setDate(now.getDate() + 1)).toDateString();

    if (isToday) {
        return `Today at ${formatTime(time)}`;
    } else if (isTomorrow) {
        return `Tomorrow at ${formatTime(time)}`;
    } else {
        return `${time.toLocaleDateString('en-US', { weekday: 'long' })} at ${formatTime(time)}`;
    }
};

export const formatCountdown = (time) => {
    if (!time || !(time instanceof Date)) {
        return 'Invalid time';
    }

    const ms = time - FindCurrentTime();
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