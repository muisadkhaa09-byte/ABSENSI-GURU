
import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegisterButton = document.getElementById("showRegister");
const showLoginButton = document.getElementById("showLogin");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");

let sedangMendaftar = false;

function tampilkanLogin() {
  loginScreen.hidden = false;
  appScreen.hidden = true;
  loginForm.hidden = false;
  registerForm.hidden = true;
}

function tampilkanPendaftaran() {
  loginScreen.hidden = false;
  appScreen.hidden = true;
  loginForm.hidden = true;
  registerForm.hidden = false;
}

function tampilkanAplikasi(role) {
  loginScreen.hidden = true;
  appScreen.hidden = false;

  console.info("Login berhasil. Role:", role);
}

function pesanLogin(teks) {
  loginMessage.textContent = teks;
}

function pesanDaftar(teks) {
  registerMessage.textContent = teks;
}

function pesanError(error) {
  const kode = error?.code || "";

  console.error("Firebase Auth error:", {
    code: kode,
    message: error?.message
  });

  const pesan = {
    "auth/invalid-email":
      "Format email tidak valid. Periksa kembali email kamu.",

    "auth/invalid-credential":
      "Email atau password salah. Periksa akun Firebase kamu.",

    "auth/user-not-found":
      "Akun tidak ditemukan di Firebase Authentication.",

    "auth/wrong-password":
      "Password salah. Coba periksa kembali.",

    "auth/too-many-requests":
      "Firebase membatasi percobaan login sementara. Coba lagi nanti.",

    "auth/network-request-failed":
      "Koneksi internet bermasalah. Periksa jaringan kamu.",

    "auth/operation-not-allowed":
      "Metode Email/Password belum diaktifkan di Firebase.",

    "auth/invalid-api-key":
      "API key Firebase tidak valid. Periksa firebase-config.js.",

    "auth/app-not-authorized":
      "Domain website belum diizinkan di pengaturan Firebase.",

    "auth/user-disabled":
      "Akun ini dinonaktifkan di Firebase Authentication.",

    "permission-denied":
      "Akses Firestore ditolak. Periksa Firestore Rules."
  };

  return pesan[kode] ||
    `Login gagal (${kode || "error tidak diketahui"}). ${error?.message || "Periksa Console untuk detail."}`;
}


// Pendaftaran akun guru.
// Role guru tidak langsung mendapat akses sebelum disetujui admin.
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  registerButton.disabled = true;
  sedangMendaftar = true;
  pesanDaftar("Sedang membuat akun...");

  const nama = document.getElementById("registerNama")
    .value.trim();

  const email = document.getElementById("registerEmail")
    .value.trim();

  const password = document.getElementById("registerPassword")
    .value;

  try {
    const hasil = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(doc(db, "users", hasil.user.uid), {
      nama,
      email,
      role: "guru",
      approved: false,
      createdAt: serverTimestamp()
    });

    await signOut(auth);

    registerForm.reset();
    tampilkanLogin();

    pesanLogin(
      "Pendaftaran berhasil. Silakan menunggu persetujuan admin."
    );
  } catch (error) {
    console.error("Pendaftaran gagal:", error);
    pesanDaftar(pesanError(error));

    // Jika akun sudah dibuat tetapi penyimpanan profil gagal,
    // jangan menganggap pendaftaran berhasil.
    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Gagal keluar:", signOutError);
      }
    }
  } finally {
    sedangMendaftar = false;
    registerButton.disabled = false;
  }
});

// Memeriksa sesi login dan role pada Firestore.
onAuthStateChanged(auth, async (user) => {
  if (sedangMendaftar) return;

  if (!user) {
    tampilkanLogin();
    return;
  }

  try {
    const profilRef = doc(db, "users", user.uid);
    const profilSnap = await getDoc(profilRef);

    if (!profilSnap.exists()) {
      tampilkanLogin();
      pesanLogin(
        "Profil akses tidak ditemukan. Hubungi admin."
      );
      await signOut(auth);
      return;
    }

    const profil = profilSnap.data();
    const role = String(profil.role || "").toLowerCase();

    if (role !== "admin" && role !== "guru") {
      tampilkanLogin();
      pesanLogin("Role akun tidak valid. Hubungi admin.");
      await signOut(auth);
      return;
    }

    if (profil.approved !== true) {
      tampilkanLogin();
      pesanLogin(
        role === "guru"
          ? "Akun guru masih menunggu persetujuan admin."
          : "Akun belum disetujui."
      );
      await signOut(auth);
      return;
    }

    tampilkanAplikasi(role);
  } catch (error) {
    console.error("Pemeriksaan akses gagal:", error);
    tampilkanLogin();
    pesanLogin(
      "Gagal memeriksa akses. Periksa koneksi dan aturan Firestore."
    );
  }
});
