// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyA_J-wyK_etzJrbo82O84l9rP5VDbB7ND0",
    authDomain: "chantelle-ai.firebaseapp.com",
    projectId: "chantelle-ai",
    storageBucket: "chantelle-ai.firebasestorage.app",
    messagingSenderId: "761069136616",
    appId: "1:761069136616:web:b672b4c83bbee8fca6f75d",
    measurementId: "G-78GDJ24ZXV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;