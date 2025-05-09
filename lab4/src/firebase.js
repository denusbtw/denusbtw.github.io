import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyADRt9tFuvSoMhX4NMNDwTsB8zygXv7iSM",
    authDomain: "lab4-e1c0d.firebaseapp.com",
    projectId: "lab4-e1c0d",
    storageBucket: "lab4-e1c0d.firebasestorage.app",
    messagingSenderId: "6128933190",
    appId: "1:6128933190:web:544f5b57482d4b5cbaad47",
    measurementId: "G-VZGLV2NE1T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);