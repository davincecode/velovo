import { Activity, StravaService } from './StravaService';

export interface FitnessData {
    ctl: number; // Chronic Training Load (Fitness)
    atl: number; // Acute Training Load (Fatigue)
    tsb: number; // Training Stress Balance (Form)
}

// A simplified interface for daily training load
interface DailyLoad {
    date: Date;
    tss: number;
}

// Formulas and constants
const CTL_DAYS = 42;
const ATL_DAYS = 7;
const CTL_ALPHA = 1 / CTL_DAYS;
const ATL_ALPHA = 1 / ATL_DAYS;

// Calculates Training Stress Score (TSS) for a single activity.
const calculateTss = (activity: Activity, ftp: number): number => {
    // Prioritize Normalized Power (weightedAverageWatts) for a more accurate TSS.
    // This explicit check satisfies the linter and prevents runtime errors.
    const power = ('weightedAverageWatts' in activity && typeof activity.weightedAverageWatts === 'number')
        ? activity.weightedAverageWatts
        : activity.averageWatts;

    if (!power || !activity.movingTimeS || ftp <= 0) {
        return 0;
    }

    const intensityFactor = power / ftp;
    // TSS = (duration_in_seconds * normalized_power * intensity_factor) / (FTP * 3600) * 100
    const tss = (activity.movingTimeS * power * intensityFactor) / (ftp * 3600) * 100;
    return Math.round(tss);
};

// A more accurate day-by-day calculation of CTL (Fitness) and ATL (Fatigue).
const calculateFitnessAndFatigue = (dailyLoads: DailyLoad[]): { ctl: number, atl: number } => {
    if (dailyLoads.length === 0) {
        return { ctl: 0, atl: 0 };
    }

    // 1. Group total TSS by day to handle multiple activities on the same day.
    const tssByDate = new Map<string, number>();
    dailyLoads.forEach(load => {
        const date = new Date(load.date);
        const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
        tssByDate.set(dateKey, (tssByDate.get(dateKey) || 0) + load.tss);
    });

    // 2. Determine the date range for the calculation.
    const sortedDates = dailyLoads.map(l => l.date.getTime()).sort((a, b) => a - b);
    const firstDay = new Date(sortedDates[0]);
    firstDay.setUTCHours(0, 0, 0, 0);
    const lastDay = new Date(sortedDates[sortedDates.length - 1]);
    lastDay.setUTCHours(0, 0, 0, 0);

    let ctl = 0;
    let atl = 0;

    // 3. Iterate day-by-day from the first activity to the last, applying decay and TSS.
    for (let day = firstDay.getTime(); day <= lastDay.getTime(); day += 24 * 60 * 60 * 1000) {
        const currentDate = new Date(day);
        const dateKey = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}-${String(currentDate.getUTCDate()).padStart(2, '0')}`;
        const tssToday = tssByDate.get(dateKey) || 0;

        // Apply the formula: ctl_today = (ctl_yesterday * decay) + (tss_today * alpha)
        ctl = (ctl * (1 - CTL_ALPHA)) + (tssToday * CTL_ALPHA);
        atl = (atl * (1 - ATL_ALPHA)) + (tssToday * ATL_ALPHA);
    }

    return { ctl: Math.round(ctl), atl: Math.round(atl) };
};


// Generates an AI message based on the latest ride and fitness data.
const generateAiMessage = (activity: Activity, ctl: number, atl: number, tsb: number, tss: number): string => {
    let message = `This ${activity.type} of ${Math.round(activity.distanceM / 1000)} km earned you ${tss} TSS. `;
    let recoveryRecommendation = '';

    if (tsb > 5) {
        message += "You should be feeling fresh and recovered. It's a great time for a key workout or to push your limits.";
    } else if (tsb > -10) {
        message += "You're in a productive training state. You're building fitness, but make sure to keep an eye on recovery.";
    } else if (tsb > -25) {
        message += "You're carrying significant fatigue. This is expected during a hard block, but ensure you have recovery planned soon.";
        recoveryRecommendation = "1-2 recovery days are recommended.";
    } else { // tsb <= -25
        message += "You are very fatigued and likely need rest. Pushing too hard now could lead to overtraining.";
        recoveryRecommendation = "2-3 recovery days or 48-72 hours of rest are highly recommended.";
    }

    if (recoveryRecommendation) {
        message += ` ${recoveryRecommendation}`;
    }

    message += ` Your current fitness (CTL) is ${ctl} and your fatigue (ATL) is ${atl}.`;

    return message;
};

const estimateFtpFromActivities = async (activities: Activity[], accessToken: string): Promise<number | null> => {
    let maxEstimatedFtp: number | null = null;

    for (const activity of activities) {
        // Only consider rides with power data
        if (activity.type === 'Ride' && (activity.averageWatts || activity.weightedAverageWatts)) {
            try {
                const powerStream = await StravaService.getActivityStream(accessToken, activity.id, 'watts');

                if (powerStream.length === 0) {
                    continue; // No power data stream available for this activity
                }

                let max20MinPower = 0;
                const windowSize = 20 * 60; // 20 minutes in seconds

                // Calculate rolling average for 20 minutes
                for (let i = 0; i <= powerStream.length - windowSize; i++) {
                    const currentWindow = powerStream.slice(i, i + windowSize);
                    const sum = currentWindow.reduce((acc, val) => acc + val, 0);
                    const average = sum / windowSize;
                    if (average > max20MinPower) {
                        max20MinPower = average;
                    }
                }

                if (max20MinPower > 0) {
                    const estimatedFtp = max20MinPower * 0.95;
                    if (maxEstimatedFtp === null || estimatedFtp > maxEstimatedFtp) {
                        maxEstimatedFtp = estimatedFtp;
                    }
                }
            } catch (error) {
                console.error(`Error fetching power stream for activity ${activity.id}:`, error);
            }
        }
    }

    return maxEstimatedFtp ? Math.round(maxEstimatedFtp) : null;
};

export const TrainingAnalyticsService = {
    calculateTss,
    calculateFitnessAndFatigue,
    generateAiMessage,
    estimateFtpFromActivities,
};
