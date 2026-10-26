import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const app = document.querySelector(".app");

function tampilkanLogin(pesan = "") {
  app.classList.remove("authenticated");
  loginScreen.hidden = false;
  loginMessage.textContent = pesan;
}

function tampilkanDashboard(user, role) {
  loginScreen.hidden = true;
  app.classList.add("authenticated");

  // Tambahkan informasi akun dan tombol keluar.
  let areaAkun = document.getElementById("accountArea");

  if (!areaAkun) {
    areaAkun = document.createElement("div");
    areaAkun.id = "accountArea";
    areaAkun.style.marginLeft = "auto";
    areaAkun.style.display = "flex";
    areaAkun.style.alignItems = "center";
    areaAkun.style.gap = "10px";
    areaAkun.style.flexWrap = "wrap";

    document.querySelector(".topbar").appendChild(areaAkun);
  }

  areaAkun.replaceChildren();

  const info = document.createElement("span");
  info.textContent = `${user.email} • ${role.toUpperCase()}`;

  const tombolKeluar = document.createElement("button");
  tombolKeluar.type = "button";
  tombolKeluar.className = "btn btn-light";
  tombolKeluar.textContent = "Keluar";

  tombolKeluar.addEventListener("click", async () => {
    await signOut(auth);
  });

  areaAkun.append(info, tombolKeluar);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  loginButton.disabled = true;
  loginButton.textContent = "Memeriksa akun...";
  loginMessage.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Status login dan role diperiksa oleh onAuthStateChanged.
  } catch (error) {
    console.error("Login gagal:", error);

    const pesan = {
      "auth/invalid-credential":
        "Email atau kata sandi salah.",
      "auth/invalid-email":
        "Format email tidak valid.",
      "auth/too-many-requests":
        "Terlalu banyak percobaan. Coba lagi nanti.",
      "auth/network-request-failed":
        "Koneksi internet bermasalah."
    };

    loginMessage.textContent =
      pesan[error.code] || "Login gagal. Periksa akun dan koneksi internet.";
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Masuk";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    tampilkanLogin();
    return;
  }

  try {
    // Profil harus dibuat oleh Admin di Firestore.
    const profilRef = doc(db, "users", user.uid);
    const profilSnap = await getDoc(profilRef);

    if (!profilSnap.exists()) {
      await signOut(auth);
      tampilkanLogin(
        "Akun belum memiliki profil yang disetujui Admin."
      );
      return;
    }

    const profil = profilSnap.data();
    const role = String(profil.role || "").toLowerCase();

    if (
      !["admin", "guru"].includes(role) ||
      profil.approved !== true
    ) {
      await signOut(auth);
      tampilkanLogin(
        "Akun belum disetujui atau tidak memiliki peran yang valid."
      );
      return;
    }

    tampilkanDashboard(user, role);
  } catch (error) {
    console.error("Pemeriksaan profil gagal:", error);

    await signOut(auth);
    tampilkanLogin(
      "Profil tidak dapat diperiksa. Periksa aturan keamanan Firestore."
    );
  }
});
