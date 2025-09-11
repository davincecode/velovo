export interface UserProfile {
    id: string;
    name: string;
    email?: string;
    weightKg?: number;
    heightCm?: number;
    discipline: 'cycling' | 'running' | 'swimming' | 'multisport';
    goals?: string[];
}


export interface Activity {
    id: string;
    name: string;
    type: string; // Ride, Run, Swim
    distanceM: number;
    movingTimeS: number;
    elapsedTimeS?: number;
    startDate: string; // ISO
    elevationGainM?: number;
    averageWatts?: number;
    averageHeartrate?: number;
}
