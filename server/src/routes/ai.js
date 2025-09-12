import { Router } from 'express';
import { handleChatRequest } from '../controllers/aiController.js';
import { validateChatMessages } from '../middleware/validation.js';

const router = Router();

router.post('/chat', validateChatMessages, handleChatRequest);

export default router;
