import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonHeader, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonList, IonText } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const history = useHistory();

    const handleLogin = async () => {
        setError('');
        try {
            await login(email, password);
        } catch (err: any) {
            setError('Invalid login credentials. Please try again.');
            console.error('Login failed:', err);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Login</IonTitle>
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
                </IonList>
                {error && (
                    <IonText color="danger">
                        <p style={{ paddingLeft: '16px', paddingTop: '8px' }}>{error}</p>
                    </IonText>
                )}
                <IonButton expand="block" color="primary" onClick={handleLogin} style={{ marginTop: '20px' }}>
                    Login
                </IonButton>
                <IonButton expand="block" fill="clear" onClick={() => history.push('/register')}>
                    Don't have an account? Register
                </IonButton>
                <IonButton expand="block" fill="clear" onClick={() => history.push('/forgot-password')}>
                    Forgot Password?
                </IonButton>
            </IonContent>
        </IonPage>
    );
};

export default Login;
