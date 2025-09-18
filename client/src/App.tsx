import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
    IonApp,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, chatbubbleEllipses, barbell, personCircle } from 'ionicons/icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Chat } from './pages/Chat';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Training } from './pages/Training';
import Login from './pages/Login';
import { Settings } from './pages/Settings';
import Registration from './pages/Registration';
import ForgotPassword from './pages/ForgotPassword';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* import '@ionic/react/css/palettes/dark.always.css'; */
import '@ionic/react/css/palettes/dark.class.css';
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AppContent: React.FC = () => {
    const { user } = useAuth(); // Use the auth context

    if (!user) {
        return (
            <IonRouterOutlet>
                <Route path="/login" component={Login} exact={true} />
                <Route path="/register" component={Registration} exact={true} />
                <Route path="/forgot-password" component={ForgotPassword} exact={true} />
                <Redirect to="/login" />
            </IonRouterOutlet>
        );
    }

    return (
        <IonTabs>
            <IonRouterOutlet>
                <Route exact path="/home" component={Home} />
                <Route path="/chat" component={Chat} />
                <Route path="/profile" component={Profile} />
                <Route path="/training" component={Training} />
                <Route path="/settings" component={Settings} />
                <Route exact path="/">
                    <Redirect to="/home" />
                </Route>
            </IonRouterOutlet>
            <IonTabBar slot="bottom" className="tab-bar-safe-area">
                <IonTabButton tab="home" href="/home">
                    <IonIcon icon={home} />
                    <IonLabel>Home</IonLabel>
                </IonTabButton>
                <IonTabButton tab="chat" href="/chat">
                    <IonIcon icon={chatbubbleEllipses} />
                    <IonLabel>AI Coach</IonLabel>
                </IonTabButton>
                <IonTabButton tab="training" href="/training">
                    <IonIcon icon={barbell} />
                    <IonLabel>Training</IonLabel>
                </IonTabButton>
                <IonTabButton tab="profile" href="/profile">
                    <IonIcon icon={personCircle} />
                    <IonLabel>Profile</IonLabel>
                </IonTabButton>
            </IonTabBar>
        </IonTabs>
    );
};

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </IonReactRouter>
    </IonApp>
);

export default App;
