import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
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
import { useAuth } from './context/AuthContext';
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

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const Tabs: React.FC = () => (
    <IonTabs>
        <IonRouterOutlet>
            <Switch>
                <Route path="/home" component={Home} exact={true} />
                <Route path="/chat" component={Chat} />
                <Route path="/profile" component={Profile} />
                <Route path="/training" component={Training} />
                <Route path="/settings" component={Settings} />
                <Redirect from="/" to="/home" exact />
            </Switch>
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

const AppContent: React.FC = () => {
    const { user } = useAuth();

    return (
        <IonRouterOutlet>
            <Switch>
                {/* Public routes that redirect if user is logged in */}
                <Route path="/login" exact={true} render={() => user ? <Redirect to="/home" /> : <Login />} />
                <Route path="/register" exact={true} render={() => user ? <Redirect to="/home" /> : <Registration />} />
                <Route path="/forgot-password" exact={true} render={() => user ? <Redirect to="/home" /> : <ForgotPassword />} />

                {/* Private route catch-all */}
                <Route path="/" render={() => user ? <Tabs /> : <Redirect to="/login" />} />
            </Switch>
        </IonRouterOutlet>
    );
};

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <AppContent />
        </IonReactRouter>
    </IonApp>
);

export default App;
