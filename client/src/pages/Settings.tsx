import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonButton } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';
import { StravaService } from '../services/StravaService';

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
const REDIRECT_URI = window.location.origin + '/settings';
const STRAVA_TOKEN_KEY = 'strava_access_token';
const STRAVA_ACTIVITIES_KEY = 'strava_activities_cache';

export const Settings: React.FC = () => {
    const { logout } = useAuth() as any;
    const { toggleTheme } = useTheme();
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem(STRAVA_TOKEN_KEY));
    const location = useLocation();

    useEffect(() => {
        const handleStravaRedirect = async () => {
            const params = new URLSearchParams(location.search);
            const code = params.get('code');

            if (code && !accessToken) {
                if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
                    console.error("Strava credentials are not configured in .env.local");
                    return;
                }
                try {
                    const tokenData = await StravaService.exchangeToken(STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, code);
                    localStorage.setItem(STRAVA_TOKEN_KEY, tokenData.access_token);
                    setAccessToken(tokenData.access_token);
                    localStorage.removeItem(STRAVA_ACTIVITIES_KEY); // Force refetch on training page
                    window.history.replaceState({}, document.title, "/settings");
                } catch (error) {
                    console.error("Error exchanging Strava token:", error);
                }
            }
        };

        handleStravaRedirect();
    }, [location, accessToken]);

    const handleLogin = () => {
        if (!STRAVA_CLIENT_ID) {
            console.error("Strava Client ID is not configured.");
            return;
        }
        const scope = 'read,activity:read_all';
        const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${scope}`;
        window.location.href = url;
    };

    const handleDisconnect = () => {
        localStorage.removeItem(STRAVA_TOKEN_KEY);
        localStorage.removeItem(STRAVA_ACTIVITIES_KEY);
        setAccessToken(null);
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
