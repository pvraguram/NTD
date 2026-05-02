// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyBMmdQkJR9NLZ6JvC4auRrn6kLbspZakoY",
  authDomain: "assistivedashboard-4d8f0.firebaseapp.com",
  databaseURL: "https://assistivedashboard-4d8f0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "assistivedashboard-4d8f0",
  storageBucket: "assistivedashboard-4d8f0.firebasestorage.app",
  messagingSenderId: "512122291410",
  appId: "1:512122291410:web:aef70d6fbac07bee2ad90b",
  measurementId: "G-GYQ66SQYHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);