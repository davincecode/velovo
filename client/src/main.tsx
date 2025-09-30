import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { StravaProvider } from './context/StravaContext'; // Import StravaProvider
import './theme/tailwind.css';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <StravaProvider>
          <App />
        </StravaProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
