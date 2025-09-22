import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// This is a more robust way to handle service account credentials.
// It avoids issues with formatting, especially for the private key.
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please download it from your Firebase project settings and add it to your .env file.');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
