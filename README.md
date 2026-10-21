# Lapor Desa Tempellemahbang — prototipe

Website pelaporan masyarakat untuk pembelajaran. Aplikasi ini belum merupakan layanan resmi Pemerintah Desa Tempellemahbang dan jangan digunakan untuk laporan darurat atau data sangat sensitif.

## Fitur yang tersedia

- Halaman utama dan daftar kategori laporan.
- Formulir laporan dengan validasi dasar, kontak opsional, tanggal, lokasi, deskripsi, dan foto bukti opsional.
- Penyimpanan laporan ke Cloud Firestore dan unggah foto ke Firebase Storage.
- Kode tiket acak; status dapat dilihat pada browser/perangkat yang sama dengan sesi anonim pelapor.
- Login admin melalui Firebase Authentication (email dan kata sandi).
- Dashboard admin, filter, pencarian, ringkasan, pembaruan status, catatan tindak lanjut, dan riwayat status.
- Draf kebijakan privasi.

## Struktur folder

```text
lapor-desa-tempellemahbang/
├── index.html
├── lapor.html
├── cek-status.html
├── admin-login.html
├── admin.html
├── privasi.html
├── firestore.rules
├── storage.rules
├── README.md
├── css/
│   └── style.css
└── js/
    ├── firebase-config.js
    ├── app.js
    ├── report.js
    ├── status.js
    ├── admin-login.js
    └── admin.js
```

## A. Siapkan Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat proyek baru.
2. Tambahkan aplikasi Web (ikon `</>`), beri nama misalnya `Lapor Desa Tempellemahbang`.
3. Salin konfigurasi aplikasi web yang disediakan Firebase.
4. Di bagian **Authentication → Sign-in method**, aktifkan **Anonymous** agar warga dapat mengirim laporan tanpa membuat akun. Aktifkan juga **Email/Password** untuk akun admin.
5. Di bagian **Firestore Database**, buat database. Mulailah dari aturan ketat/production mode.
6. Di bagian **Storage**, siapkan bucket jika fitur foto akan digunakan. Jika belum memerlukan foto, pengguna dapat mengosongkan kolom foto.
7. Buka `js/firebase-config.js`, lalu ganti seluruh nilai `GANTI_DENGAN_...` dengan nilai asli dari Firebase. Jangan mengisi dengan private key atau Service Account.
8. Salin isi file `firestore.rules` ke tab **Firestore Database → Rules**, lalu klik **Publish**.
9. Salin isi file `storage.rules` ke tab **Storage → Rules**, lalu klik **Publish**. Uji aturan ini terlebih dahulu menggunakan akun uji; jangan membuka akses publik ke seluruh database.

Dokumentasi resmi: [Menambahkan Firebase ke aplikasi web](https://firebase.google.com/docs/web/setup), [Firebase Authentication](https://firebase.google.com/docs/auth/web/start), dan [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started).

## B. Buat akun admin dengan aman

1. Di **Authentication → Users**, pilih **Add user** dan buat akun admin menggunakan email yang dikuasai petugas.
2. Salin UID akun dari daftar pengguna.
3. Buka **Firestore Database → Data**, buat koleksi bernama `users` bila belum ada.
4. Buat dokumen dengan **Document ID persis sama dengan UID** tadi.
5. Tambahkan field:
   - `role` — string — `admin`
   - `active` — boolean — `true`
6. Jangan membuat fitur pendaftaran admin publik. Hanya pengelola proyek yang boleh mengubah dokumen peran admin. Gunakan kata sandi kuat dan jangan membagikannya.

## C. Jalankan di VS Code

1. Ekstrak ZIP ke folder yang mudah ditemukan.
2. Buka VS Code → **File → Open Folder** → pilih `lapor-desa-tempellemahbang`.
3. Pasang ekstensi **Live Server** jika belum terpasang.
4. Klik kanan `index.html` → **Open with Live Server**.
5. Pastikan perangkat tersambung ke internet karena Firebase SDK diambil dari CDN.
6. Coba buka halaman **Buat Laporan**, isi data uji yang tidak sensitif, kirim, lalu catat kode tiket. Cek status pada browser yang sama.
7. Masuk ke halaman Login Admin menggunakan akun admin yang telah dibuat di langkah B.

Jika halaman laporan error `permission-denied`, periksa bahwa Firestore Rules dan Storage Rules telah dipublikasikan, metode Anonymous aktif, dan nilai konfigurasi proyek tepat.

## D. Catatan keterbatasan penting

- Kode tiket **bukan** sistem autentikasi. Untuk mencegah kebocoran, prototipe ini mengikat laporan warga ke UID Firebase Anonymous di browser yang mengirimkannya. Akibatnya, laporan tidak bisa dilacak dari perangkat/browser lain hanya dengan kode tiket. Penyimpanan browser yang dihapus juga dapat menghilangkan sesi aksesnya.
- Untuk implementasi publik, tambahkan cara pemulihan lintas perangkat yang tervalidasi (misalnya akun pelapor atau backend tepercaya yang memverifikasi kode rahasia dengan pembatasan percobaan). Jangan memperbolehkan pembacaan laporan publik hanya karena seseorang mengetahui kode tiket.
- Foto tersimpan pada Firebase Storage dalam jalur khusus UID pemilik. Aturan Storage harus diuji. Jika foto gagal dimuat oleh admin, periksa konfigurasi CORS bucket dan Firebase Storage Rules.
- Firestore Rules di file ini menerapkan beberapa validasi penting, tetapi tetap perlu diuji menggunakan Firebase Rules Playground/Emulator dan ditinjau sebelum dipakai untuk data asli.
- Untuk dipakai resmi, ganti kontak placeholder, siapkan SOP, tunjuk admin, tetapkan retensi data, tinjau kebijakan privasi, dan dapatkan persetujuan pemerintah desa.
- Batasi kuota/biaya Firebase, pantau penggunaan, siapkan penanganan spam, dan jangan menganggap konfigurasi frontend sebagai perlindungan data yang cukup.

## E. Publikasi

Frontend dapat ditaruh di GitHub Pages setelah konfigurasi Firebase selesai. Karena autentikasi berbasis domain, tambahkan domain website ke **Firebase Authentication → Settings → Authorized domains**. GitHub Pages tidak menyimpan data: semua penyimpanan dilakukan oleh Firebase. Pastikan rules sudah diuji sebelum memublikasikan situs.

## F. Checklist pengujian

- [ ] Formulir tidak menerima data wajib kosong.
- [ ] Deskripsi di bawah 20 karakter ditolak.
- [ ] Foto non-gambar atau foto di atas 5 MB ditolak.
- [ ] Jika Firebase belum terhubung, halaman memberi pesan yang jelas.
- [ ] Setelah sukses, tiket terbentuk dan bisa dipakai untuk pencarian dari browser yang sama.
- [ ] Pengunjung anonim tidak dapat membaca laporan orang lain.
- [ ] Akun biasa tidak dapat masuk ke dashboard admin.
- [ ] Admin terdaftar dapat mengubah status dan catatan tindak lanjut.
- [ ] Kontak/nama warga tidak ditampilkan di halaman publik.
- [ ] Periksa aturan Firestore dan Storage dengan alat pengujian sebelum data riil digunakan.
