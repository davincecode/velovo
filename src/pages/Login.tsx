import React from 'react';
import { IonPage, IonContent, IonButton, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { useAuth } from '../context/AuthContext';


export const Login: React.FC = () => {
    const { login, setStravaToken } = useAuth() as any;
    const demoLogin = () => {
        login({ id: 'demo', name: 'Demo Athlete', discipline: 'cycling' });
    };
    const connectStrava = () => {
// In production: redirect to your server which starts the OAuth flow.
        alert('Redirect to Strava OAuth (implement server-side)');
    };
    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Login</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <IonButton expand="block" color="primary" onClick={demoLogin}>Continue as Demo</IonButton>
                <IonButton expand="block" color="tertiary" onClick={connectStrava}>Connect Strava</IonButton>
            </IonContent>
        </IonPage>
    );
};
