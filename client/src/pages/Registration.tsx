import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonHeader, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonList, IonText, IonButtons, IonBackButton } from '@ionic/react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useHistory } from 'react-router-dom';
import app from '../services/firebase';

const Registration: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();
    const auth = getAuth(app);

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            history.push('/login'); // Redirect to login after successful registration
        } catch (err: any) {
            setError(err.message);
            console.error('Registration failed:', err);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/login" />
                    </IonButtons>
                    <IonTitle>Register</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonList>
                    <IonItem>
                        <IonLabel position="floating">Email</IonLabel>
                        <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">Password</IonLabel>
                        <IonInput type="password" value={password} onIonChange={e => setPassword(e.detail.value!)} />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">Confirm Password</IonLabel>
                        <IonInput type="password" value={confirmPassword} onIonChange={e => setConfirmPassword(e.detail.value!)} />
                    </IonItem>
                </IonList>
                {error && (
                    <IonText color="danger">
                        <p style={{ paddingLeft: '16px', paddingTop: '8px' }}>{error}</p>
                    </IonText>
                )}
                <IonButton expand="block" color="primary" onClick={handleRegister} style={{ marginTop: '20px' }}>
                    Register
                </IonButton>
            </IonContent>
        </IonPage>
    );
};

export default Registration;
