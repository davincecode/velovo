import React from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonButton } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Settings: React.FC = () => {
    const { logout } = useAuth() as any;
    const { toggleTheme } = useTheme();

    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Settings</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <IonButton onClick={toggleTheme}>Toggle Theme</IonButton>
                <IonButton color="danger" onClick={logout}>Logout</IonButton>
            </IonContent>
        </IonPage>
    );
};
