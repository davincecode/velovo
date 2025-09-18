import dotenv from 'dotenv';
dotenv.config();

const config = {
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    APP_CLIENT_ORIGIN: process.env.APP_CLIENT_ORIGIN || 'http://localhost:8100', // Assuming default for client
    PORT: process.env.PORT || 3000, // Assuming default port
    // Add other configurations as needed
};

export default config;
