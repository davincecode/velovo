import { config as dotenvConfig } from '@dotenvx/dotenvx';

dotenvConfig();

export const config = {
    PORT: process.env.PORT || 4000,
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    APP_CLIENT_ORIGIN: process.env.APP_CLIENT_ORIGIN || 'http://localhost:8100'
};

// Validate required environment variables
const requiredVars = ['STRAVA_CLIENT_ID', 'STRAVA_CLIENT_SECRET', 'STRAVA_REDIRECT_URI', 'OPENAI_API_KEY'];
const missing = requiredVars.filter(key => !config[key]);

if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}. See .env.example`);
    process.exit(1);
}
