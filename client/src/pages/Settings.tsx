import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonButton, useIonAlert, IonSpinner } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';
import { StravaService } from '../services/StravaService';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useStravaData } from '../context/StravaContext';

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
const REDIRECT_URI = window.location.origin + '/settings';

export const Settings: React.FC = () => {
    const { logout, user } = useAuth();
    const { toggleTheme } = useTheme();
    const { refreshStravaData, isConnected, loading: stravaLoading } = useStravaData();
    const location = useLocation();
    const [presentAlert] = useIonAlert();
    const [isProcessing, setIsProcessing] = useState(false);

    const userId = user?.id;

    useEffect(() => {
        const handleStravaRedirect = async () => {
            const params = new URLSearchParams(location.search);
            const code = params.get('code');

            // Only proceed if we have a code, a user, and we are not already processing.
            if (code && userId && !isProcessing) {
                setIsProcessing(true);

                if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
                    console.error("Strava credentials are not configured in .env");
                    await presentAlert({ header: 'Error', message: 'Strava credentials not configured.', buttons: ['OK'] });
                    setIsProcessing(false);
                    return;
                }

                try {
                    const tokenData = await StravaService.exchangeToken(STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, code);

                    const userDocRef = doc(db, 'users', userId);
                    await updateDoc(userDocRef, {
                        stravaAccessToken: tokenData.access_token,
                        stravaRefreshToken: tokenData.refresh_token,
                        stravaExpiresAt: tokenData.expires_at,
                    });

                    // Clear the code from the URL for a cleaner state
                    window.history.replaceState({}, document.title, "/settings");

                    await refreshStravaData();

                    await presentAlert({ header: 'Success', message: 'Strava connected successfully!', buttons: ['OK'] });

                } catch (error) {
                    console.error("Error exchanging Strava token:", error);
                    await presentAlert({ header: 'Error', message: 'Failed to connect Strava. Please try again.', buttons: ['OK'] });
                } finally {
                    setIsProcessing(false);
                }
            }
        };

        void handleStravaRedirect();
    }, [location.search, userId, isProcessing, presentAlert, refreshStravaData]);

    const handleLogin = () => {
        if (!STRAVA_CLIENT_ID) {
            console.error("Strava Client ID is not configured.");
            void presentAlert({ header: 'Error', message: 'Strava Client ID not configured.', buttons: ['OK'] });
            return;
        }
        const scope = 'read,activity:read_all';
        const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${scope}`;
        window.location.href = url;
    };

    const handleDisconnect = async () => {
        if (!userId) return;

        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            stravaAccessToken: null,
            stravaRefreshToken: null,
            stravaExpiresAt: null,
        });

        await refreshStravaData();

        await presentAlert({ header: 'Success', message: 'Strava disconnected.', buttons: ['OK'] });
    };

    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Settings</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                {(stravaLoading || isProcessing) ? (
                    <div className="ion-text-center">
                        <IonSpinner />
                        <p>{isProcessing ? 'Connecting Strava...' : 'Loading Strava data...'}</p>
                    </div>
                ) : !isConnected ? (
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
