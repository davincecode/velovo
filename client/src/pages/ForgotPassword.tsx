import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonHeader, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonList, IonText, IonButtons, IonBackButton } from '@ionic/react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import app from '../services/firebase';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const auth = getAuth(app);

    const handleResetPassword = async () => {
        setError('');
        setMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent. Please check your inbox.');
        } catch (err: any) {
            setError(err.message);
            console.error('Password reset failed:', err);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/login" />
                    </IonButtons>
                    <IonTitle>Forgot Password</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonList>
                    <IonItem>
                        <IonLabel position="floating">Email</IonLabel>
                        <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} />
                    </IonItem>
                </IonList>
                {message && (
                    <IonText color="success">
                        <p style={{ paddingLeft: '16px', paddingTop: '8px' }}>{message}</p>
                    </IonText>
                )}
                {error && (
                    <IonText color="danger">
                        <p style={{ paddingLeft: '16px', paddingTop: '8px' }}>{error}</p>
                    </IonText>
                )}
                <IonButton expand="block" color="primary" onClick={handleResetPassword} style={{ marginTop: '20px' }}>
                    Send Password Reset Email
                </IonButton>
            </IonContent>
        </IonPage>
    );
};

export default ForgotPassword;
