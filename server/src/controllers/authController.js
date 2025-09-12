import axios from 'axios';
import { config } from '../config/env.js';
import { tokenStore } from '../utils/tokenStore.js';

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
        tokenStore.save(athleteId, tokenData);

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
