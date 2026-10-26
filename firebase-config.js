// firebase-config.js
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQ78Yw0I1jFFLqrSunKslJMYgM4pE8i28",
  authDomain: "e-absensi-c0f00.firebaseapp.com",
  projectId: "e-absensi-c0f00",
  storageBucket: "e-absensi-c0f00.firebasestorage.app",
  messagingSenderId: "994584200791",
  appId: "1:994584200791:web:e288b6a10307b057aa4512",
};

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
