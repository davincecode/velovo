import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonButton, useIonAlert } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';
import { StravaService } from '../services/StravaService';
import { db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Import getDoc
import { useStravaData } from '../context/StravaContext';

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
const REDIRECT_URI = window.location.origin + '/settings';
const STRAVA_TOKEN_KEY = 'strava_access_token'; // Still used for local caching, but Firestore will be source of truth

export const Settings: React.FC = () => {
    const { logout, user } = useAuth() as any;
    const { toggleTheme } = useTheme();
    const { refreshStravaData } = useStravaData();
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem(STRAVA_TOKEN_KEY));
    const location = useLocation();
    const [presentAlert] = useIonAlert();

    const userId = user?.id;

    useEffect(() => {
        const handleStravaRedirect = async () => {
            const params = new URLSearchParams(location.search);
            const code = params.get('code');

            if (code && !accessToken && userId) {
                console.log("Settings.tsx: Processing Strava redirect with userId:", userId);
                if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
                    console.error("Strava credentials are not configured in .env.local");
                    presentAlert({ header: 'Error', message: 'Strava credentials not configured.', buttons: ['OK'] });
                    return;
                }
                try {
                    const tokenData = await StravaService.exchangeToken(STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, code);
                    localStorage.setItem(STRAVA_TOKEN_KEY, tokenData.access_token); // Keep local cache for immediate use
                    setAccessToken(tokenData.access_token);

                    // *** Save access token to Firestore ***
                    const userDocRef = doc(db, 'users', userId);
                    await updateDoc(userDocRef, {
                        stravaAccessToken: tokenData.access_token,
                        stravaRefreshToken: tokenData.refresh_token,
                        stravaExpiresAt: tokenData.expires_at,
                    });
                    console.log("Settings.tsx: Strava token data updated in Firestore for userId:", userId);

                    // Verify the update by re-fetching the profile immediately
                    const updatedUserDocSnap = await getDoc(userDocRef);
                    if (updatedUserDocSnap.exists()) {
                        console.log("Settings.tsx: User profile after update:", updatedUserDocSnap.data());
                    } else {
                        console.warn("Settings.tsx: User profile not found after update.");
                    }

                    // Clear the code from the URL
                    window.history.replaceState({}, document.title, "/settings");

                    refreshStravaData(); // Refresh StravaContext after saving token

                    presentAlert({ header: 'Success', message: 'Strava connected successfully!', buttons: ['OK'] });
                } catch (error) {
                    console.error("Error exchanging Strava token:", error);
                    presentAlert({ header: 'Error', message: 'Failed to connect Strava. Please try again.', buttons: ['OK'] });
                }
            }
        };

        handleStravaRedirect();
    }, [location, accessToken, userId, presentAlert, refreshStravaData]);

    const handleLogin = () => {
        if (!STRAVA_CLIENT_ID) {
            console.error("Strava Client ID is not configured.");
            presentAlert({ header: 'Error', message: 'Strava Client ID not configured.', buttons: ['OK'] });
            return;
        }
        const scope = 'read,activity:read_all';
        const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${scope}`;
        window.location.href = url;
    };

    const handleDisconnect = async () => {
        if (!userId) return;

        localStorage.removeItem(STRAVA_TOKEN_KEY);
        setAccessToken(null);

        // *** Remove access token from Firestore ***
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            stravaAccessToken: null,
            stravaRefreshToken: null,
            stravaExpiresAt: null,
        });
        console.log("Settings.tsx: Strava token data removed from Firestore for userId:", userId);

        refreshStravaData(); // Refresh StravaContext after disconnecting

        presentAlert({ header: 'Success', message: 'Strava disconnected.', buttons: ['OK'] });
    };

    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Settings</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                {!accessToken ? (
                    <IonButton expand="block" onClick={handleLogin}>Connect with Strava</IonButton>
                ) : (
                    <IonButton expand="block" color="light" onClick={handleDisconnect}>Disconnect Strava</IonButton>
                )}
                <IonButton expand="block" onClick={toggleTheme} className="ion-margin-top">Toggle Theme</IonButton>
                <IonButton expand="block" color="danger" onClick={logout} className="ion-margin-top">Logout</IonButton>
            </IonContent>
        </IonPage>
    );
};
