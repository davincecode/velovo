import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { StravaService } from '../services/StravaService';
import { PerformanceCard } from '../components/PerformanceCard';
import '../theme/global.css';


export const Home: React.FC = () => {
    const { user, stravaAccessToken } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    useEffect(() => {
        if (!stravaAccessToken) return;
        StravaService.fetchActivities(stravaAccessToken).then(setActivities).catch(err=>console.error(err));
    }, [stravaAccessToken]);


    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Home</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <h2>Welcome{user?.name ? `, ${user.name}` : ''}</h2>
                <PerformanceCard activities={activities} />
                <section style={{marginTop:16}}>
                    <h3>Recent Activities</h3>
                    <ul>
                        {activities.slice(0,8).map((a:any)=> <li key={a.id}>{a.name} — {(a.distanceM/1000).toFixed(1)} km</li>)}
                    </ul>
                </section>
            </IonContent>
        </IonPage>
    );
};
