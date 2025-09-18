import { auth } from '../config/firebase.js'; // Changed to ES module import

export const firebaseAuth = async (req, res, next) => { // Changed to named ES module export
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await auth.verifyIdToken(token);

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
};
