import { UserProfile } from '../userProfile';
import { auth } from './firebase';

export const updateUserProfile = async (userId: string, profileData: UserProfile) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const token = await user.getIdToken();

  const response = await fetch(`http://localhost:3000/api/profile/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update profile');
  }

  return response.json();
};

export const clearChatHistory = async (userId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const token = await user.getIdToken();

  const response = await fetch(`http://localhost:3000/api/profile/${userId}/chat`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to clear chat history');
  }

  return response.json();
};
