import { admin } from '../config/firebase.js';

export const updateProfile = async (req, res) => {
  const { userId } = req.params;
  const profileData = req.body;

  console.log(`[API] Received request to update profile for userId: ${userId}`);
  console.log(`[API] Incoming profile data:`, JSON.stringify(profileData, null, 2));

  if (!userId || !profileData || Object.keys(profileData).length === 0) {
    console.error('[API] Validation failed: Missing userId or profileData.');
    return res.status(400).json({ message: 'Missing userId or profileData' });
  }

  try {
    console.log(`[Firebase] Getting reference to users/${userId}...`);
    const userDocRef = admin.firestore().collection('users').doc(userId);

    console.log(`[Firebase] Setting document for users/${userId}...`);
    await userDocRef.set(profileData, { merge: true });

    console.log(`[Firebase] Profile for users/${userId} updated successfully.`);
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(`[Firebase] Error updating profile for users/${userId}:`, error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};
