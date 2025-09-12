import React from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent } from '@ionic/react';


export const Training: React.FC = () => {
    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Training</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <p>Week view & workouts coming soon. Use Strava activities as read-only workouts or allow create custom workouts.</p>
            </IonContent>
        </IonPage>
    );
};
