// Fetches and processes Strava activity data.
export interface Activity {
    id: string;
    name: string;
    type: string;
    distanceM: number;
    movingTimeS: number;
    elapsedTimeS: number;
    startDate: string;
    elevationGainM: number;
    averageWatts?: number;
    maxWatts?: number;
    averageHeartrate?: number;
    kilojoules?: number;
    averageSpeed?: number;
    maxSpeed?: number;
    averageCadence?: number;
    maxCadence?: number;
    calories?: number;
    description?: string;
    privateNote?: string;
}

interface StravaServiceType {
    exchangeToken(clientId: string, clientSecret: string, code: string): Promise<any>;
    getActivities(accessToken: string): Promise<Activity[]>;
    getActivityDetails(accessToken: string, activityId: string): Promise<Activity>;
}

const API_BASE = 'https://www.strava.com/api/v3';
const TOKEN_ENDPOINT = 'https://www.strava.com/oauth/token';

export const StravaService: StravaServiceType = {
    async exchangeToken(clientId: string, clientSecret: string, code: string): Promise<any> {
        const res = await fetch(TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code'
            })
        });
        if (!res.ok) {
            const errorData = await res.json();
            console.error('Strava token exchange failed:', errorData);
            throw new Error('Failed to exchange Strava token');
        }
        return res.json();
    },

    async getActivityDetails(accessToken: string, activityId: string): Promise<Activity> {
        const res = await fetch(`${API_BASE}/activities/${activityId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) {
            if (res.status === 401) throw new Error('Unauthorized: 401');
            throw new Error('Failed to fetch Strava activity details');
        }
        const a = await res.json();
        return {
            id: String(a.id),
            name: a.name,
            type: a.type,
            distanceM: a.distance,
            movingTimeS: a.moving_time,
            elapsedTimeS: a.elapsed_time,
            startDate: a.start_date,
            elevationGainM: a.total_elevation_gain,
            averageWatts: a.average_watts,
            maxWatts: a.max_watts,
            averageHeartrate: a.average_heartrate,
            kilojoules: a.kilojoules,
            averageSpeed: a.average_speed,
            maxSpeed: a.max_speed,
            averageCadence: a.average_cadence,
            maxCadence: a.max_cadence,
            calories: a.calories,
            description: a.description,
            privateNote: a.private_note
        };
    },

    async getActivities(accessToken: string): Promise<Activity[]> {
        const res = await fetch(`${API_BASE}/athlete/activities?per_page=30`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) {
            if (res.status === 401) throw new Error('Unauthorized: 401');
            throw new Error('Failed to fetch Strava activities');
        }
        const data = await res.json();

        return data.map((a: any): Activity => {
            return {
                id: String(a.id),
                name: a.name,
                type: a.type,
                distanceM: a.distance,
                movingTimeS: a.moving_time,
                elapsedTimeS: a.elapsed_time,
                startDate: a.start_date,
                elevationGainM: a.total_elevation_gain,
                averageWatts: a.average_watts,
                maxWatts: a.max_watts,
                averageHeartrate: a.average_heartrate,
                kilojoules: a.kilojoules,
                averageSpeed: a.average_speed,
                maxSpeed: a.max_speed,
                averageCadence: a.average_cadence,
                maxCadence: a.max_cadence,
                calories: a.calories
            };
        });
    }
};
