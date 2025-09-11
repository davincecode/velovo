import React from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { cog } from 'ionicons/icons';

export const Profile: React.FC = () => {
    const { user } = useAuth();
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Profile</IonTitle>
                    <IonButtons slot="end">
                        <IonButton routerLink="/settings">
                            <IonIcon slot="icon-only" icon={cog} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </IonContent>
        </IonPage>
    );
};
