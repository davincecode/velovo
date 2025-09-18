import { Router } from 'express';
import { startStravaAuth, handleStravaCallback, refreshStravaToken, handleGoogleAuth, handleGoogleFirebaseAuth } from '../controllers/authController.js';
import { validateRefreshToken } from '../middleware/validation.js';

const router = Router();

router.get('/strava/start', startStravaAuth);
router.get('/strava/callback', handleStravaCallback);
router.post('/strava/refresh', validateRefreshToken, refreshStravaToken);
router.post('/google', handleGoogleAuth);
router.post('/google-firebase', handleGoogleFirebaseAuth);

export default router;
