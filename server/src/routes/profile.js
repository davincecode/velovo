import express from 'express';
import { updateProfile, clearChatHistory } from '../controllers/profileController.js';
import { firebaseAuth } from '../middleware/auth.js';

const router = express.Router();

// This route is now protected by firebaseAuth middleware
router.post('/:userId', firebaseAuth, updateProfile);

// Add a new route to delete chat history, also protected
router.delete('/:userId/chat', firebaseAuth, clearChatHistory);

export default router;
