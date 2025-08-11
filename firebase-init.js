/* Firebase initialization for HoopBoard using CDN modules */

// Load Firebase via ES modules from Google's CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  updateDoc,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB08MPauQgyANuHDJhhm5FUGKeh8ki5Nc4",
  authDomain: "hoopboard-54ffb.firebaseapp.com",
  projectId: "hoopboard-54ffb",
  storageBucket: "hoopboard-54ffb.firebasestorage.app",
  messagingSenderId: "637625060821",
  appId: "1:637625060821:web:57574b54b7b9c91b2b815c",
  measurementId: "G-2L6XNMWYSE"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Expose to window so existing scripts can detect and use Firestore
window.db = db;
window.firestoreFns = {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  updateDoc,
  query,
  orderBy
};