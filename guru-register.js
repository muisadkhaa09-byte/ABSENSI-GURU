
import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const showRegister = document.getElementById("showRegister");
const showRegisterWrap = document.getElementById("showRegisterWrap");
const backToLogin = document.getElementById("backToLogin");
const registerMessage = document.getElementById("registerMessage");
const registerButton = document.getElementById("registerButton");

showRegister?.addEventListener("click", () => {
  loginForm.hidden = true;
  registerForm.hidden = false;
  showRegisterWrap.hidden = true;
  registerMessage.textContent = "";
});

backToLogin?.addEventListener("click", () => {
  registerForm.hidden = true;
  loginForm.hidden = false;
  showRegisterWrap.hidden = false;
  registerMessage.textContent = "";
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nama = document.getElementById("registerNama").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const passwordConfirm =
    document.getElementById("registerPasswordConfirm").value;

  if (!nama) {
    registerMessage.textContent = "Nama lengkap wajib diisi.";
    return;
  }

  if (password !== passwordConfirm) {
    registerMessage.textContent =
      "Konfirmasi kata sandi belum sama.";
    return;
  }

  registerButton.disabled = true;
  registerMessage.textContent = "Sedang membuat akun...";

  let newUser = null;

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    newUser = credential.user;

    await setDoc(doc(db, "users", newUser.uid), {
      nama: nama,
      email: email,
      role: "guru",
      approved: false,
      createdAt: new Date().toISOString()
    });

    await signOut(auth);

    registerForm.reset();
    registerForm.hidden = true;
    loginForm.hidden = false;
    showRegisterWrap.hidden = false;

    const loginMessage = document.getElementById("loginMessage");
    if (loginMessage) {
      loginMessage.textContent =
        "Pendaftaran berhasil. Tunggu persetujuan admin sebelum login.";
    }
  } catch (error) {
    console.error("Pendaftaran guru gagal:", error);

    if (newUser) {
      registerMessage.textContent =
        "Akun berhasil dibuat, tetapi profil belum tersimpan. Hubungi admin sebelum mencoba daftar ulang.";
    } else if (error.code === "auth/email-already-in-use") {
      registerMessage.textContent =
        "Email sudah terdaftar. Silakan kembali ke halaman login.";
    } else if (error.code === "auth/weak-password") {
      registerMessage.textContent =
        "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    } else if (error.code === "auth/invalid-email") {
      registerMessage.textContent = "Format email tidak valid.";
    } else if (error.code === "permission-denied" ||
               error.code === "firestore/permission-denied") {
      registerMessage.textContent =
        "Firestore menolak penyimpanan profil. Periksa Rules Firestore.";
    } else {
      registerMessage.textContent =
        "Pendaftaran gagal. Periksa koneksi dan Console browser.";
    }
  } finally {
    registerButton.disabled = false;
  }
});
