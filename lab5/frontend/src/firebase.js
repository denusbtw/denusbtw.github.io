import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB9y6hqnsGUtzPEfAnzohk8VUOStMuZSsE",
    authDomain: "lab5-fe5a6.firebaseapp.com",
    projectId: "lab5-fe5a6",
    storageBucket: "lab5-fe5a6.firebasestorage.app",
    messagingSenderId: "563923989339",
    appId: "1:563923989339:web:fdbc580b98e292890c207e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;