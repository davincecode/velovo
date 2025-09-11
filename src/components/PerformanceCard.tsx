import React from 'react';
import { Activity } from '../types';

export const PerformanceCard: React.FC<{activities: Activity[]}> = ({ activities }) => {
// simple status calculation
    const totalKm = activities.reduce((s,a)=>s+(a.distanceM/1000),0);
    const recent = activities.slice(0,7);
    const avgDistance = recent.length? recent.reduce((s,a)=>s+(a.distanceM/1000),0)/recent.length:0;
    const status = totalKm > 200 ? 'High volume' : totalKm > 50 ? 'Moderate' : 'Low';


    return (
        <div style={{padding:12, borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', background:'white'}}>
            <h3>Performance Status</h3>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Last 30 activities (km):</strong> {totalKm.toFixed(1)}</p>
            <p><strong>Avg last 7 (km):</strong> {avgDistance.toFixed(1)}</p>
        </div>
    );
};
