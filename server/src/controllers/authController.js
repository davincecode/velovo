import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import config from '../config/config.js';
import { admin, auth as firebaseAdminAuth } from '../config/firebase.js'; // Import firebase-admin auth

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

export const startStravaAuth = (req, res) => {
    const state = Math.random().toString(36).slice(2);
    const scope = 'activity:read_all,profile:read_all';
    const params = new URLSearchParams({
        client_id: config.STRAVA_CLIENT_ID,
        response_type: 'code',
        redirect_uri: config.STRAVA_REDIRECT_URI,
        approval_prompt: 'auto',
        scope,
        state
    });
    const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;
    res.cookie('strava_oauth_state', state, { httpOnly: true, sameSite: 'lax' });
    return res.redirect(url);
};

export const handleStravaCallback = async (req, res) => {
    const { code, state } = req.query;
    try {
        const cookieState = req.cookies['strava_oauth_state'];
        if (!code) return res.status(400).json({ error: 'Missing code' });

        const tokenRes = await axios.post('https://www.strava.com/oauth/token', null, {
            params: {
                client_id: config.STRAVA_CLIENT_ID,
                client_secret: config.STRAVA_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code'
            }
        });

        const tokenData = tokenRes.data;
        const athleteId = tokenData.athlete?.id ?? `ath_${Date.now()}`;
        // Removed tokenStore.save(athleteId, tokenData); as it's no longer needed with Firebase Auth

        return res.json({ tokens: tokenData, athleteId });
    } catch (err) {
        console.error('Strava callback error', err?.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to exchange code' });
    }
};

export const refreshStravaToken = async (req, res) => {
    const { refresh_token } = req.body;
    try {
        const tokenRes = await axios.post('https://www.strava.com/oauth/token', null, {
            params: {
                client_id: config.STRAVA_CLIENT_ID,
                client_secret: config.STRAVA_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token
            }
        });
        return res.json(tokenRes.data);
    } catch (err) {
        console.error('Failed to refresh token', err?.response?.data || err.message);
        return res.status(500).json({ error: 'Refresh failed' });
    }
};

export const handleGoogleAuth = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: config.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(401).json({ error: 'Invalid Google token payload' });
        }

        const userId = payload['sub'];
        const name = payload['name'];
        const email = payload['email'];
        const picture = payload['picture'];

        const userProfile = {
            id: userId,
            name: name || 'Google User',
            email: email,
            picture: picture,
            discipline: 'unknown',
        };

        res.json(userProfile);

    } catch (error) {
        console.error('Error verifying Google ID token:', error);
        res.status(401).json({ error: 'Invalid Google token' });
    }
};

export const handleGoogleFirebaseAuth = async (req, res) => {
    const { googleIdToken } = req.body;

    try {
        // 1. Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: googleIdToken,
            audience: config.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(401).json({ error: 'Invalid Google token payload' });
        }

        const googleUserId = payload.sub;
        const name = payload.name || 'Google User';
        const email = payload.email || '';
        const picture = payload.picture || '';

        // 2. Create or get a Firebase user
        let firebaseUid;
        try {
            const userRecord = await firebaseAdminAuth.getUserByEmail(email);
            firebaseUid = userRecord.uid;
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create a new Firebase user if one doesn't exist
                const userRecord = await firebaseAdminAuth.createUser({
                    uid: googleUserId, // Use Google's sub as Firebase UID
                    email: email,
                    displayName: name,
                    photoURL: picture,
                });
                firebaseUid = userRecord.uid;
            } else {
                throw error; // Re-throw other errors
            }
        }

        // 3. Generate a Firebase custom token
        const firebaseCustomToken = await firebaseAdminAuth.createCustomToken(firebaseUid);

        // 4. Construct UserProfile to send back to client
        const userProfile = {
            id: firebaseUid,
            name: name,
            email: email,
            picture: picture,
            discipline: 'unknown', // Default or fetch from database
        };

        res.json({ firebaseCustomToken, userProfile });

    } catch (error) {
        console.error('Error in handleGoogleFirebaseAuth:', error);
        res.status(401).json({ error: 'Authentication failed', details: error.message });
    }
};
