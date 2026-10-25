
"use strict";

// ==========================================
// 1. PENGATURAN DAN PENYIMPANAN DATA
// ==========================================

const STORAGE_GURU = "eAbsensiGuru_v1";
const STORAGE_ABSENSI = "eAbsensiData_v1";

const JAM_BATAS_MASUK = "07:00"; // Contoh, sesuaikan aturan sekolah.

const contohGuru = [
  { id: "G001", nama: "Budi Santoso", mapel: "Matematika" },
  { id: "G002", nama: "Siti Rahma", mapel: "Bahasa Indonesia" },
  { id: "G003", nama: "Andi Pratama", mapel: "Fisika" },
  { id: "G004", nama: "Dewi Lestari", mapel: "Biologi" }
];

function bacaData(kunci, dataAwal) {
  try {
    const data = localStorage.getItem(kunci);

    if (data === null) {
      localStorage.setItem(kunci, JSON.stringify(dataAwal));
      return dataAwal;
    }

    const hasil = JSON.parse(data);

    if (!Array.isArray(hasil)) {
      throw new Error("Format data tidak sesuai.");
    }

    return hasil;
  } catch (error) {
    console.error("Gagal membaca data:", error);
    alert(
      "Data tidak dapat dibaca. Periksa penyimpanan browser sebelum melanjutkan."
    );
    return dataAwal;
  }
}

let daftarGuru = bacaData(STORAGE_GURU, contohGuru);
let dataAbsensi = bacaData(STORAGE_ABSENSI, []);

let dataRekapAktif = [];
let filterAktif = {
  mulai: "",
  selesai: "",
  status: "",
  nama: ""
};

function simpanSemua() {
  try {
    localStorage.setItem(STORAGE_GURU, JSON.stringify(daftarGuru));
    localStorage.setItem(STORAGE_ABSENSI, JSON.stringify(dataAbsensi));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    tampilkanPesan(
      "Data gagal disimpan. Periksa kapasitas penyimpanan browser.",
      true
    );
    return false;
  }
}

// ==========================================
// 2. FUNGSI BANTUAN
// ==========================================

function tanggalLokal(date = new Date()) {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
}

function waktuLokal(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function formatTanggal(tanggal) {
  if (!tanggal) return "-";

  const bagian = tanggal.split("-");

  if (bagian.length !== 3) return tanggal;

  return `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
}

function escapeHTML(nilai) {
  return String(nilai ?? "").replace(/[&<>"']/g, function (karakter) {
    const pengganti = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return pengganti[karakter];
  });
}

function cariGuru(id) {
  return daftarGuru.find((guru) => guru.id === id);
}

function cariNamaGuru(id) {
  const guru = cariGuru(id);
  return guru ? guru.nama : "Guru tidak ditemukan";
}

function kelasStatus(status) {
  const kelas = {
    Hadir: "status-hadir",
    Terlambat: "status-terlambat",
    Izin: "status-izin",
    Sakit: "status-sakit"
  };

  return kelas[status] || "";
}

function buatBadge(status) {
  return `<span class="status ${kelasStatus(status)}">${escapeHTML(
    status
  )}</span>`;
}

function tampilkanPesan(pesan, error = false) {
  const notice = document.getElementById("notice");

  notice.textContent = pesan;
  notice.classList.toggle("error", error);
  notice.classList.add("show");

  // Pesan akan ditutup ketika pengguna berpindah halaman.
}

function selIsiKosong(jumlahKolom, pesan) {
  return `
    <tr>
      <td colspan="${jumlahKolom}" class="empty-state">
        ${escapeHTML(pesan)}
      </td>
    </tr>
  `;
}

// ==========================================
// 3. NAVIGASI ANTARHALAMAN
// ==========================================

const judulHalaman = {
  dashboard: "Dashboard",
  guru: "Data Guru",
  absensi: "Absensi Guru",
  rekap: "Rekap Laporan"
};

function bukaHalaman(id) {
  const halaman = document.getElementById(id);

  if (!halaman || !judulHalaman[id]) return;

  document.querySelectorAll(".page").forEach((bagian) => {
    bagian.classList.toggle("active", bagian.id === id);
  });

  document.querySelectorAll(".nav-link").forEach((tombol) => {
    const aktif = tombol.dataset.page === id;
    tombol.classList.toggle("active", aktif);

    if (aktif) {
      tombol.setAttribute("aria-current", "page");
    } else {
      tombol.removeAttribute("aria-current");
    }
  });

  document.getElementById("pageTitle").textContent = judulHalaman[id];
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("notice").classList.remove("show");

  if (id === "dashboard") renderDashboard();
  if (id === "guru") renderGuru();
  if (id === "absensi") perbaruiPilihanGuru();
  if (id === "rekap") renderRekap();
}

document.querySelectorAll(".nav-link").forEach((tombol) => {
  tombol.addEventListener("click", () => {
    bukaHalaman(tombol.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach((tombol) => {
  tombol.addEventListener("click", () => {
    bukaHalaman(tombol.dataset.go);
  });
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ==========================================
// 4. DATA GURU
// ==========================================

function renderGuru() {
  const kataKunci = document
    .getElementById("cariGuru")
    .value.trim()
    .toLowerCase();

  const hasil = daftarGuru.filter((guru) => {
    return (
      guru.id.toLowerCase().includes(kataKunci) ||
      guru.nama.toLowerCase().includes(kataKunci) ||
      guru.mapel.toLowerCase().includes(kataKunci)
    );
  });

  const tabel = document.getElementById("guruTable");

  if (hasil.length === 0) {
    tabel.innerHTML = selIsiKosong(4, "Data guru tidak ditemukan.");
  } else {
    tabel.innerHTML = hasil
      .map(
        (guru) => `
          <tr>
            <td>${escapeHTML(guru.id)}</td>
            <td>${escapeHTML(guru.nama)}</td>
            <td>${escapeHTML(guru.mapel)}</td>
            <td>
              <button
                class="btn btn-danger btn-small"
                data-hapus-guru="${escapeHTML(guru.id)}"
                type="button"
              >Hapus</button>
            </td>
          </tr>
        `
      )
      .join("");
  }

  perbaruiPilihanGuru();
}

document.getElementById("cariGuru").addEventListener("input", renderGuru);

document.getElementById("guruForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const id = document.getElementById("guruId").value.trim();
  const nama = document.getElementById("guruNama").value.trim();
  const mapel = document.getElementById("guruMapel").value.trim();

  if (!id || !nama || !mapel) {
    tampilkanPesan("Lengkapi semua data guru.", true);
    return;
  }

  const idAda = daftarGuru.some(
    (guru) => guru.id.toLowerCase() === id.toLowerCase()
  );

  if (idAda) {
    tampilkanPesan("ID guru sudah digunakan. Gunakan ID lain.", true);
    return;
  }

  daftarGuru.push({ id, nama, mapel });

  if (!simpanSemua()) {
    daftarGuru.pop();
    return;
  }

  event.target.reset();
  renderGuru();
  renderDashboard();
  renderRekap();

  tampilkanPesan(`Data guru ${nama} berhasil ditambahkan.`);
});

document.getElementById("guruTable").addEventListener("click", (event) => {
  const tombol = event.target.closest("[data-hapus-guru]");
  if (!tombol) return;

  const id = tombol.dataset.hapusGuru;
  const guru = cariGuru(id);

  if (!guru) return;

  const memilikiRiwayat = dataAbsensi.some(
    (catatan) => catatan.guruId === id
  );

  if (memilikiRiwayat) {
    tampilkanPesan(
      "Guru memiliki riwayat absensi. Data tidak dihapus agar riwayat tetap terjaga.",
      true
    );
    return;
  }

  if (!confirm(`Hapus data guru ${guru.nama}?`)) return;

  const daftarLama = daftarGuru;
  daftarGuru = daftarGuru.filter((item) => item.id !== id);

  if (!simpanSemua()) {
    daftarGuru = daftarLama;
    return;
  }

  renderGuru();
  renderDashboard();
  tampilkanPesan("Data guru berhasil dihapus.");
});

function perbaruiPilihanGuru() {
  const select = document.getElementById("absensiGuru");
  const nilaiLama = select.value;

  select.innerHTML =
    '<option value="">-- Pilih Guru --</option>' +
    daftarGuru
      .map(
        (guru) => `
          <option value="${escapeHTML(guru.id)}">
            ${escapeHTML(guru.id)} - ${escapeHTML(guru.nama)}
          </option>
        `
      )
      .join("");

  if (daftarGuru.some((guru) => guru.id === nilaiLama)) {
    select.value = nilaiLama;
  }
}

// ==========================================
// 5. PENCATATAN ABSENSI
// ==========================================

const formAbsensi = document.getElementById("absensiForm");

document.getElementById("absensiTanggal").value = tanggalLokal();
document.getElementById("absensiJam").value = waktuLokal();

document.getElementById("resetAbsensi").addEventListener("click", () => {
  setTimeout(() => {
    document.getElementById("absensiTanggal").value = tanggalLokal();
    document.getElementById("absensiJam").value = waktuLokal();
  }, 0);
});

formAbsensi.addEventListener("submit", (event) => {
  event.preventDefault();

  const guruId = document.getElementById("absensiGuru").value;
  const tanggal = document.getElementById("absensiTanggal").value;
  const jam = document.getElementById("absensiJam").value;
  const status = document.getElementById("absensiStatus").value;
  const keterangan = document
    .getElementById("absensiKeterangan")
    .value.trim();

  const guru = cariGuru(guruId);

  if (!guru) {
    tampilkanPesan("Pilih guru yang sudah terdaftar.", true);
    return;
  }

  if (!tanggal || !jam) {
    tampilkanPesan("Tanggal dan jam wajib diisi.", true);
    return;
  }

  if (tanggal > tanggalLokal()) {
    tampilkanPesan("Tanggal absensi tidak boleh di masa depan.", true);
    return;
  }

  if (!["Hadir", "Terlambat", "Izin", "Sakit"].includes(status)) {
    tampilkanPesan("Status kehadiran tidak valid.", true);
    return;
  }

  const sudahAda = dataAbsensi.some(
    (catatan) =>
      catatan.guruId === guruId && catatan.tanggal === tanggal
  );

  if (sudahAda) {
    tampilkanPesan(
      "Guru ini sudah memiliki catatan pada tanggal tersebut. Periksa rekap sebelum melakukan koreksi.",
      true
    );
    return;
  }

  const catatanBaru = {
    id: buatIdAbsensi(),
    guruId,
    tanggal,
    jamMasuk: jam,
    status,
    keterangan,
    dibuatPada: new Date().toISOString()
  };

  dataAbsensi.push(catatanBaru);

  if (!simpanSemua()) {
    dataAbsensi.pop();
    return;
  }

  formAbsensi.reset();

  document.getElementById("absensiTanggal").value = tanggalLokal();
  document.getElementById("absensiJam").value = waktuLokal();

  renderDashboard();
  renderRekap();

  tampilkanPesan(
    `Absensi ${guru.nama} berhasil dicatat dengan status ${status}.`
  );
});

function buatIdAbsensi() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return (
    "A-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 9)
  );
}

// ==========================================
// 6. DASHBOARD DAN RINGKASAN
// ==========================================

function renderDashboard() {
  const hariIni = tanggalLokal();

  const catatanHariIni = dataAbsensi.filter(
    (catatan) => catatan.tanggal === hariIni
  );

  const jumlah = (status) =>
    catatanHariIni.filter((catatan) => catatan.status === status).length;

  document.getElementById("totalGuru").textContent = daftarGuru.length;
  document.getElementById("totalHadir").textContent = jumlah("Hadir");
  document.getElementById("totalTerlambat").textContent =
    jumlah("Terlambat");

  document.getElementById("totalIzinSakit").textContent =
    jumlah("Izin") + jumlah("Sakit");

  const jumlahTercatat = catatanHariIni.length;
  const jumlahDatang = jumlah("Hadir") + jumlah("Terlambat");

  const persen =
    jumlahTercatat === 0
      ? 0
      : Math.round((jumlahDatang / jumlahTercatat) * 100);

  document.getElementById("persentaseHadir").textContent = `${persen}%`;
  document.getElementById("progressBar").style.width = `${persen}%`;

  const tabel = document.getElementById("dashboardTable");

  const terbaru = [...catatanHariIni].sort((a, b) =>
    b.jamMasuk.localeCompare(a.jamMasuk)
  );

  if (terbaru.length === 0) {
    tabel.innerHTML = selIsiKosong(
      4,
      "Belum ada catatan absensi hari ini."
    );
    return;
  }

  tabel.innerHTML = terbaru
    .map((catatan) => {
      const guru = cariGuru(catatan.guruId);

      return `
        <tr>
          <td>${escapeHTML(guru ? guru.nama : "Guru tidak ditemukan")}</td>
          <td>${escapeHTML(guru ? guru.mapel : "-")}</td>
          <td>${escapeHTML(catatan.jamMasuk)}</td>
          <td>${buatBadge(catatan.status)}</td>
        </tr>
      `;
    })
    .join("");
}

// ==========================================
// 7. FILTER DAN REKAP ABSENSI
// ==========================================

function renderRekap() {
  const hasil = dataAbsensi
    .filter((catatan) => {
      const guru = cariGuru(catatan.guruId);
      const teks = filterAktif.nama.toLowerCase();

      const cocokNama =
        !teks ||
        catatan.guruId.toLowerCase().includes(teks) ||
        (guru && guru.nama.toLowerCase().includes(teks));

      const cocokMulai =
        !filterAktif.mulai || catatan.tanggal >= filterAktif.mulai;

      const cocokSelesai =
        !filterAktif.selesai || catatan.tanggal <= filterAktif.selesai;

      const cocokStatus =
        !filterAktif.status || catatan.status === filterAktif.status;

      return (
        cocokNama &&
        cocokMulai &&
        cocokSelesai &&
        cocokStatus
      );
    })
    .sort((a, b) => {
      const tanggalBanding = b.tanggal.localeCompare(a.tanggal);
      return tanggalBanding || b.jamMasuk.localeCompare(a.jamMasuk);
    });

  dataRekapAktif = hasil;

  const jumlah = (status) =>
    hasil.filter((catatan) => catatan.status === status).length;

  document.getElementById("rekapTotal").textContent = hasil.length;
  document.getElementById("rekapHadir").textContent = jumlah("Hadir");
  document.getElementById("rekapTerlambat").textContent =
    jumlah("Terlambat");

  document.getElementById("rekapIzinSakit").textContent =
    jumlah("Izin") + jumlah("Sakit");

  document.getElementById("jumlahHasil").textContent =
    `${hasil.length} catatan`;

  const tabel = document.getElementById("rekapTable");

  if (hasil.length === 0) {
    tabel.innerHTML = selIsiKosong(
      7,
      "Tidak ada catatan yang sesuai dengan filter."
    );
    return;
  }

  tabel.innerHTML = hasil
    .map((catatan) => {
      const guru = cariGuru(catatan.guruId);

      return `
        <tr>
          <td>${escapeHTML(formatTanggal(catatan.tanggal))}</td>
          <td>${escapeHTML(catatan.guruId)}</td>
          <td>${escapeHTML(guru ? guru.nama : "Guru tidak ditemukan")}</td>
          <td>${escapeHTML(catatan.jamMasuk)}</td>
          <td>${buatBadge(catatan.status)}</td>
          <td>${escapeHTML(catatan.keterangan || "-")}</td>
          <td>
            <button
              class="btn btn-danger btn-small"
              data-hapus-absensi="${escapeHTML(catatan.id)}"
              type="button"
            >Hapus</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

document.getElementById("terapkanFilter").addEventListener("click", () => {
  const mulai = document.getElementById("filterMulai").value;
  const selesai = document.getElementById("filterSelesai").value;

  if (mulai && selesai && mulai > selesai) {
    tampilkanPesan(
      "Tanggal awal tidak boleh melebihi tanggal akhir.",
      true
    );
    return;
  }

  filterAktif = {
    mulai,
    selesai,
    status: document.getElementById("filterStatus").value,
    nama: document.getElementById("filterNama").value.trim()
  };

  renderRekap();
  tampilkanPesan("Filter laporan berhasil diterapkan.");
});

document.getElementById("resetFilter").addEventListener("click", () => {
  document.getElementById("filterMulai").value = "";
  document.getElementById("filterSelesai").value = "";
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterNama").value = "";

  filterAktif = {
    mulai: "",
    selesai: "",
    status: "",
    nama: ""
  };

  renderRekap();
  tampilkanPesan("Filter laporan telah direset.");
});

// ==========================================
// 8. HAPUS CATATAN ABSENSI
// ==========================================

document.getElementById("rekapTable").addEventListener("click", (event) => {
  const tombol = event.target.closest("[data-hapus-absensi]");
  if (!tombol) return;

  const id = tombol.dataset.hapusAbsensi;
  const catatan = dataAbsensi.find((item) => item.id === id);

  if (!catatan) return;

  if (
    !confirm(
      "Hapus catatan absensi ini? Tindakan ini hanya tersedia pada prototipe demo."
    )
  ) {
    return;
  }

  const dataLama = dataAbsensi;
  dataAbsensi = dataAbsensi.filter((item) => item.id !== id);

  if (!simpanSemua()) {
    dataAbsensi = dataLama;
    return;
  }

  renderRekap();
  renderDashboard();
  tampilkanPesan("Catatan absensi berhasil dihapus dari demo.");
});

// ==========================================
// 9. EKSPOR CSV UNTUK EXCEL
// ==========================================

function lindungiCSV(nilai) {
  let teks = String(nilai ?? "");

  // Cegah sel CSV ditafsirkan sebagai formula spreadsheet.
  if (/^[\s]*[=+\-@]/.test(teks)) {
    teks = "'" + teks;
  }

  return '"' + teks.replace(/"/g, '""') + '"';
}

document.getElementById("exportCSV").addEventListener("click", () => {
  if (dataRekapAktif.length === 0) {
    tampilkanPesan(
      "Tidak ada data untuk diunduh. Periksa filter laporan.",
      true
    );
    return;
  }

  const baris = [
    [
      "Tanggal",
      "ID Guru",
      "Nama Guru",
      "Mata Pelajaran",
      "Jam Check-in",
      "Status",
      "Keterangan"
    ],
    ...dataRekapAktif.map((catatan) => {
      const guru = cariGuru(catatan.guruId);

      return [
        catatan.tanggal,
        catatan.guruId,
        guru ? guru.nama : "Guru tidak ditemukan",
        guru ? guru.mapel : "-",
        catatan.jamMasuk,
        catatan.status,
        catatan.keterangan || ""
      ];
    })
  ];

  const isiCSV =
    "\uFEFF" +
    baris
      .map((barisData) => barisData.map(lindungiCSV).join(","))
      .join("\r\n");

  const file = new Blob([isiCSV], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = `rekap-absensi-${tanggalLokal()}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  tampilkanPesan("File CSV berhasil disiapkan untuk diunduh.");
});

// ==========================================
// 10. MULAI APLIKASI
// ==========================================

function mulaiAplikasi() {
  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  renderGuru();
  renderDashboard();
  renderRekap();
  bukaHalaman("dashboard");
}

mulaiAplikasi();
