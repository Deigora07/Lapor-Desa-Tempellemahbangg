import { configured, auth, db, storage } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const $ = (id) => document.getElementById(id);
const form = $("reportForm");
const message = $("formMessage");
const submitButton = $("submitButton");
const description = $("description");
const photoInput = $("photo");
const incidentDate = $("incidentDate");
if ($("year")) $("year").textContent = new Date().getFullYear();
if (incidentDate) incidentDate.max = new Date().toISOString().slice(0, 10);
if (description) description.addEventListener("input", () => { $("charCount").textContent = description.value.length; });
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");
if (menuToggle && nav) menuToggle.addEventListener("click", () => { const open = nav.classList.toggle("is-open"); menuToggle.setAttribute("aria-expanded", String(open)); });

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `form-message ${type}`;
}
function makeTicketId() {
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase();
  return `LAP-${random}`;
}
function cleanFilename(name) { return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100); }

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  if (!configured) {
    showMessage("Firebase belum disambungkan. Ikuti README.md untuk mengisi konfigurasi Firebase sebelum mengirim laporan.");
    return;
  }
  const photo = photoInput.files?.[0] || null;
  if (photo && !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) return showMessage("Foto harus berformat JPG, PNG, atau WebP.");
  if (photo && photo.size > 5 * 1024 * 1024) return showMessage("Ukuran foto maksimal 5 MB.");
  if (description.value.trim().length < 20) return showMessage("Deskripsi laporan minimal 20 karakter.");
  if (new Date(incidentDate.value) > new Date(new Date().toDateString())) return showMessage("Tanggal kejadian tidak boleh di masa depan.");
  submitButton.disabled = true;
  submitButton.textContent = "Mengirim laporan...";
  showMessage("Sedang memproses laporan. Jangan tutup halaman ini.", "info");
  let uploadedPath = "";
  try {
    await auth.authStateReady();
    let user = auth.currentUser;
    if (!user) user = (await signInAnonymously(auth)).user;
    const ticketId = makeTicketId();
    if (photo) {
      uploadedPath = `report-photos/${user.uid}/${Date.now()}-${cleanFilename(photo.name)}`;
      await uploadBytes(ref(storage, uploadedPath), photo, { contentType: photo.type });
    }
    const report = {
      ownerUid: user.uid,
      ticketId,
      reporterName: $("reporterName").value.trim(),
      reporterContact: $("reporterContact").value.trim(),
      category: $("category").value,
      title: $("title").value.trim(),
      description: description.value.trim(),
      location: $("location").value.trim(),
      incidentDate: incidentDate.value,
      photoPath: uploadedPath,
      status: "Menunggu verifikasi",
      followUpNotes: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusHistory: [{ status: "Menunggu verifikasi", at: new Date().toISOString(), note: "Laporan diterima" }]
    };
    await addDoc(collection(db, "reports"), report);
    localStorage.setItem("laporDesa.lastTicket", ticketId);
    localStorage.setItem("laporDesa.lastTicketAt", new Date().toISOString());
    form.reset();
    $("charCount").textContent = "0";
    message.className = "form-message success";
    message.innerHTML = `<strong>Laporan berhasil dikirim.</strong><br>Kode tiket Anda: <code>${ticketId}</code><br><span>Simpan kode ini. Untuk prototipe ini, cek status dari browser/perangkat yang sama.</span><br><a href="cek-status.html">Buka halaman cek status →</a>`;
  } catch (error) {
    console.error("Gagal mengirim laporan:", error);
    const friendly = error?.code === "permission-denied" ? "Akses ditolak oleh aturan Firebase. Periksa Firestore Rules/Storage Rules pada README.md." : error?.code === "auth/operation-not-allowed" ? "Login anonim belum diaktifkan. Aktifkan Anonymous di Firebase Authentication." : "Laporan gagal dikirim. Periksa koneksi internet dan konfigurasi Firebase, lalu coba lagi.";
    showMessage(friendly);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Kirim Laporan <span>→</span>';
  }
});
