import axios from 'axios';
import { UserProfile } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// This function is no longer used for the new flow, but keeping it for now
export const verifyGoogleToken = async (token: string): Promise<UserProfile> => {
    try {
        const response = await axios.post(`${API_URL}/auth/google`, { token });
        return response.data;
    } catch (error) {
        console.error('Error verifying Google token:', error);
        throw error;
    }
};

export const exchangeGoogleTokenForFirebaseCustomToken = async (googleIdToken: string): Promise<{ firebaseCustomToken: string, userProfile: UserProfile }> => {
    try {
        const response = await axios.post(`${API_URL}/auth/google-firebase`, { googleIdToken });
        return response.data;
    } catch (error) {
        console.error('Error exchanging Google token for Firebase custom token:', error);
        throw error;
    }
};
