import React, { useState } from 'react';
import { Activity } from '../types';

export const PerformanceCard: React.FC<{activities: Activity[]}> = ({ activities }) => {
    const [isInverted, setIsInverted] = useState(false);

    // simple status calculation
    const totalKm = activities.reduce((s,a)=>s+(a.distanceM/1000),0);
    const recent = activities.slice(0,7);
    const avgDistance = recent.length? recent.reduce((s,a)=>s+(a.distanceM/1000),0)/recent.length:0;
    const status = totalKm > 200 ? 'High volume' : totalKm > 50 ? 'Moderate' : 'Low';

    const cardStyle = {
        padding: 12,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        background: isInverted ? 'var(--ion-color-light)' : 'var(--ion-color-dark)',
        color: isInverted ? 'var(--ion-color-light-contrast)' : 'var(--ion-color-dark-contrast)',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    };

    return (
        <div style={cardStyle} onClick={() => setIsInverted(!isInverted)}>
            <h3>Performance Status {isInverted && '(Inverted)'}</h3>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Last 30 activities (km):</strong> {totalKm.toFixed(1)}</p>
            <p><strong>Avg last 7 (km):</strong> {avgDistance.toFixed(1)}</p>
        </div>
    );
};
