import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './src/config/config.js'; // Import config
import authRoutes from './src/routes/auth.js';
import aiRoutes from './src/routes/ai.js';
import profileRoutes from './src/routes/profile.js'; // Import profile routes

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: config.APP_CLIENT_ORIGIN, credentials: true }));

app.use('/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes); // Use profile routes

app.listen(config.PORT, () => console.log(`Server listening on ${config.PORT}`));
