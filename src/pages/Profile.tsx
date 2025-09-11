import React from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent } from '@ionic/react';
import { useAuth } from '../context/AuthContext';


export const Profile: React.FC = () => {
    const { user } = useAuth();
    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Profile</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </IonContent>
        </IonPage>
    );
};
