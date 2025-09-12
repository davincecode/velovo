import { Router } from 'express';
import { startStravaAuth, handleStravaCallback, refreshStravaToken } from '../controllers/authController.js';
import { validateRefreshToken } from '../middleware/validation.js';

const router = Router();

router.get('/strava/start', startStravaAuth);
router.get('/strava/callback', handleStravaCallback);
router.post('/strava/refresh', validateRefreshToken, refreshStravaToken);

export default router;
