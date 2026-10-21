import { configured, auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const $ = (id) => document.getElementById(id);
const form = $("statusForm"), message = $("statusMessage"), result = $("statusResult");
if ($("year")) $("year").textContent = new Date().getFullYear();
const navToggle = document.querySelector(".menu-toggle"), nav = document.querySelector(".nav-links");
if (navToggle && nav) navToggle.addEventListener("click", () => { const open = nav.classList.toggle("is-open"); navToggle.setAttribute("aria-expanded", String(open)); });
const savedTicket = localStorage.getItem("laporDesa.lastTicket");
if (savedTicket) $("ticketId").value = savedTicket;
function show(text, type="error") { message.textContent = text; message.className = `form-message ${type}`; }
function escapeHtml(v="") { return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function dateText(value) {
  if (!value) return "Belum tersedia";
  const d = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? "Belum tersedia" : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}
function statusClass(status) { if (status === "Selesai") return "done"; if (status === "Ditolak") return "rejected"; if (status === "Sedang ditangani" || status === "Diteruskan ke petugas terkait") return "progress"; return "pending"; }
form.addEventListener("submit", async (event) => {
  event.preventDefault(); result.hidden = true;
  if (!configured) return show("Firebase belum disambungkan. Ikuti README.md untuk menyelesaikan konfigurasi terlebih dahulu.");
  const ticket = $("ticketId").value.trim().toUpperCase();
  if (!ticket) return show("Masukkan kode tiket laporan.");
  show("Mencari laporan...", "info");
  try {
    await auth.authStateReady();
    let user = auth.currentUser;
    if (!user) user = (await signInAnonymously(auth)).user;
    const snapshot = await getDocs(query(collection(db, "reports"), where("ownerUid", "==", user.uid)));
    const doc = snapshot.docs.find(item => (item.data().ticketId || "").toUpperCase() === ticket);
    if (!doc) {
      show("Laporan dengan kode tersebut tidak ditemukan pada sesi browser ini. Pastikan Anda memakai browser/perangkat saat laporan dikirim.");
      return;
    }
    const report = doc.data();
    const history = Array.isArray(report.statusHistory) ? [...report.statusHistory].sort((a,b) => new Date(a.at || 0) - new Date(b.at || 0)) : [];
    result.innerHTML = `<div class="result-header"><div><span class="eyebrow">HASIL PELACAKAN</span><h2>${escapeHtml(report.title)}</h2><p>Kode tiket: <strong>${escapeHtml(report.ticketId)}</strong></p></div><span class="status-pill ${statusClass(report.status)}">${escapeHtml(report.status)}</span></div><div class="result-meta"><div><small>Kategori</small><b>${escapeHtml(report.category)}</b></div><div><small>Tanggal kejadian</small><b>${escapeHtml(report.incidentDate)}</b></div><div><small>Lokasi</small><b>${escapeHtml(report.location)}</b></div><div><small>Diperbarui</small><b>${dateText(report.updatedAt)}</b></div></div><div class="result-description"><h3>Ringkasan laporan</h3><p>${escapeHtml(report.description)}</p>${report.followUpNotes ? `<h3>Catatan petugas</h3><p>${escapeHtml(report.followUpNotes)}</p>` : ""}</div><div class="history"><h3>Riwayat status</h3>${history.length ? history.map(item => `<div class="history-item"><span class="history-dot"></span><div><b>${escapeHtml(item.status || "Pembaruan status")}</b><p>${escapeHtml(item.note || "Status laporan diperbarui")}</p><small>${escapeHtml(dateText(item.at))}</small></div></div>`).join("") : "<p>Belum ada riwayat status.</p>"}</div>`;
    result.hidden = false; show("Laporan ditemukan.", "success");
  } catch (error) {
    console.error("Gagal mencari laporan:", error);
    show(error?.code === "permission-denied" ? "Akses ditolak oleh aturan keamanan Firebase. Periksa Firestore Rules." : "Tidak dapat memeriksa status saat ini. Periksa internet dan konfigurasi Firebase.");
  }
});
