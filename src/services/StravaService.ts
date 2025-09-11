import { Activity, UserProfile } from '../types';


const API_BASE = 'https://www.strava.com/api/v3';


export const StravaService = {
    async fetchActivities(accessToken: string): Promise<Activity[]> {
        const res = await fetch(`${API_BASE}/athlete/activities?per_page=30`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch Strava activities');
        const data = await res.json();
        return data.map((a: any) => ({
            id: String(a.id),
            name: a.name,
            type: a.type,
            distanceM: a.distance,
            movingTimeS: a.moving_time,
            startDate: a.start_date,
            elevationGainM: a.total_elevation_gain,
            averageWatts: a.average_watts,
            averageHeartrate: a.average_heartrate
        }));
    }
};
