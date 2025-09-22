import { UserProfile } from '../userProfile';

export const updateUserProfile = async (userId: string, profileData: UserProfile) => {
  console.log('Updating profile for userId:', userId);
  const response = await fetch(`http://localhost:3000/api/profile/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update profile');
  }

  return response.json();
};
