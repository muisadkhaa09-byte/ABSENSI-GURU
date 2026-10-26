
import { auth, db } from "./firebase-config.js";

console.log("Firebase berhasil diinisialisasi.");
console.log("Authentication tersedia:", !!auth);
console.log("Firestore tersedia:", !!db);
