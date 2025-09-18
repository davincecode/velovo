import { Router } from 'express';
import { handleChatRequest } from '../controllers/aiController.js';
import { firebaseAuth } from '../middleware/auth.js'; // Ensure this is a named import
import { validateChatMessages } from '../middleware/validation.js';

const router = Router();

router.post('/chat', firebaseAuth, validateChatMessages, handleChatRequest);

export default router;
