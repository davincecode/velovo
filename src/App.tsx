import React, { useState, useEffect } from 'react';
import { Route } from 'react-router-dom';
import {
  IonApp,
  IonButton,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider } from './context/AuthContext';
import { Chat } from './pages/Chat';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Training } from './pages/Training';
import { Login } from './pages/Login';

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

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
// import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (prefersDark) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    return (
        <IonApp>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
                <IonButton onClick={toggleTheme}>
                    Toggle Theme
                </IonButton>
            </div>
            <AuthProvider>
                <IonReactRouter>
                    <IonTabs>
                        <IonRouterOutlet>
                            <Route path="/login" component={Login} />
                            <Route exact path="/" component={Home} />
                            <Route path="/chat" component={Chat} />
                            <Route path="/profile" component={Profile} />
                            <Route path="/training" component={Training} />
                        </IonRouterOutlet>
                        <IonTabBar slot="bottom">
                            <IonTabButton tab="home" href="/">
                                <IonLabel>Home</IonLabel>
                            </IonTabButton>
                            <IonTabButton tab="chat" href="/chat">
                                <IonLabel>AI Coach</IonLabel>
                            </IonTabButton>
                            <IonTabButton tab="training" href="/training">
                                <IonLabel>Training</IonLabel>
                            </IonTabButton>
                            <IonTabButton tab="profile" href="/profile">
                                <IonLabel>Profile</IonLabel>
                            </IonTabButton>
                        </IonTabBar>
                    </IonTabs>
                </IonReactRouter>
            </AuthProvider>
        </IonApp>
    );
};

export default App;
