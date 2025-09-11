import React from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonButton } from '@ionic/react';
import { useAuth } from '../context/AuthContext';


export const Settings: React.FC = () => {
    const { logout } = useAuth() as any;
    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Settings</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <IonButton color="danger" onClick={logout}>Logout</IonButton>
            </IonContent>
        </IonPage>
    );
};
