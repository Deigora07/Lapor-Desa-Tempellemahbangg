import { configured, auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, updateDoc, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getBlob, ref } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";
const $ = id => document.getElementById(id);
const tbody = $("reportTable"), message = $("adminMessage");
let reports = [];
let currentReport = null;
if ($("year")) $("year").textContent = new Date().getFullYear();
function show(text, type="error") { message.textContent = text; message.className = `form-message ${type}`; }
function esc(v="") { return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function dateText(v) { if (!v) return "—"; const d = v.toDate ? v.toDate() : new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }); }
function statusClass(s) { if (s === "Selesai") return "done"; if (s === "Ditolak") return "rejected"; if (s === "Sedang ditangani" || s === "Diteruskan ke petugas terkait") return "progress"; return "pending"; }
function render() {
  const search = $("searchInput").value.trim().toLowerCase(); const status = $("statusFilter").value;
  const filtered = reports.filter(r => (!status || r.status === status) && (!search || [r.ticketId,r.title,r.location,r.category].some(v => String(v || "").toLowerCase().includes(search))));
  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Tidak ada laporan yang sesuai.</td></tr>'; return; }
  tbody.innerHTML = filtered.map(r => `<tr><td><b class="ticket-text">${esc(r.ticketId)}</b><small>${esc(dateText(r.createdAt))}</small></td><td><b>${esc(r.title)}</b><small>${esc(r.category)}</small></td><td>${esc(r.location)}</td><td><span class="status-pill ${statusClass(r.status)}">${esc(r.status)}</span></td><td><button class="button button-outline button-small" data-detail="${esc(r.id)}">Detail</button></td></tr>`).join("");
  tbody.querySelectorAll("[data-detail]").forEach(button => button.addEventListener("click", () => openDetail(button.dataset.detail)));
}
function updateStats() {
  $("statTotal").textContent = reports.length;
  $("statPending").textContent = reports.filter(r => r.status === "Menunggu verifikasi" || r.status === "Sedang diverifikasi").length;
  $("statProgress").textContent = reports.filter(r => r.status === "Sedang ditangani" || r.status === "Diteruskan ke petugas terkait").length;
  $("statDone").textContent = reports.filter(r => r.status === "Selesai").length;
}
async function loadReports() {
  if (!configured) return show("Firebase belum disambungkan. Ikuti README.md untuk konfigurasi.", "info");
  show("Memuat daftar laporan...", "info");
  try {
    const snap = await getDocs(collection(db, "reports"));
    reports = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    updateStats(); render(); show(`${reports.length} laporan dimuat.`, "success");
  } catch (error) {
    console.error("Gagal memuat laporan:", error);
    show(error?.code === "permission-denied" ? "Akses ditolak. Pastikan akun ini terdaftar sebagai admin di dokumen users dan Firestore Rules sudah dipasang." : "Gagal memuat data. Periksa koneksi dan konfigurasi Firebase.");
  }
}
function toMillis(v) { if (!v) return 0; return v.toDate ? v.toDate().getTime() : new Date(v).getTime() || 0; }
function openDetail(id) {
  const r = reports.find(item => item.id === id); if (!r) return;
  currentReport = r;
  $("detailTicket").textContent = `${r.ticketId} · ${dateText(r.createdAt)}`;
  $("detailContent").innerHTML = `<div class="detail-grid"><div><small>Nama pelapor</small><b>${esc(r.reporterName || "—")}</b></div><div><small>Kontak</small><b>${esc(r.reporterContact || "Tidak diberikan")}</b></div><div><small>Kategori</small><b>${esc(r.category)}</b></div><div><small>Tanggal kejadian</small><b>${esc(r.incidentDate || "—")}</b></div><div class="full-width"><small>Lokasi</small><b>${esc(r.location)}</b></div><div class="full-width"><small>Deskripsi</small><p>${esc(r.description)}</p></div><div class="full-width"><small>Foto bukti</small><div id="photoArea">${r.photoPath ? `<button id="loadPhotoButton" type="button" class="button button-outline button-small">Muat foto bukti</button><div id="photoPreview"></div>` : "Tidak ada foto bukti."}</div></div></div>`;
  $("detailReportId").value = id; $("newStatus").value = r.status || "Menunggu verifikasi"; $("followUpNotes").value = r.followUpNotes || ""; $("detailPanel").hidden = false; $("detailPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  const loadButton = $("loadPhotoButton");
  if (loadButton) loadButton.addEventListener("click", async () => {
    loadButton.disabled = true; loadButton.textContent = "Memuat foto...";
    try { const blob = await getBlob(ref(storage, r.photoPath)); const url = URL.createObjectURL(blob); $("photoPreview").innerHTML = `<img class="evidence-image" src="${url}" alt="Foto bukti laporan">`; loadButton.remove(); }
    catch (e) { console.error(e); loadButton.disabled = false; loadButton.textContent = "Coba muat foto lagi"; show("Foto tidak dapat dibuka. Periksa Storage Rules dan pengaturan CORS Firebase Storage."); }
  });
}
function closeDetail() { $("detailPanel").hidden = true; currentReport = null; }
$("searchInput").addEventListener("input", render); $("statusFilter").addEventListener("change", render); $("refreshButton").addEventListener("click", loadReports); $("closeDetail").addEventListener("click", closeDetail);
$("logoutButton").addEventListener("click", async () => { try { await signOut(auth); window.location.href = "admin-login.html"; } catch (e) { show("Gagal keluar. Coba kembali."); } });
$("updateForm").addEventListener("submit", async event => {
  event.preventDefault(); if (!currentReport) return;
  const status = $("newStatus").value; const notes = $("followUpNotes").value.trim();
  $("saveUpdate").disabled = true; $("saveUpdate").textContent = "Menyimpan...";
  try {
    await updateDoc(doc(db, "reports", currentReport.id), {
      status,
      followUpNotes: notes,
      updatedAt: serverTimestamp(),
      statusHistory: arrayUnion({ status, at: new Date().toISOString(), note: notes || "Status laporan diperbarui" })
    });
    show("Perubahan laporan berhasil disimpan.", "success"); await loadReports(); closeDetail();
  } catch (error) {
    console.error("Gagal memperbarui laporan:", error);
    show(error?.code === "permission-denied" ? "Anda tidak memiliki hak untuk mengubah laporan. Periksa status admin dan Firestore Rules." : "Perubahan gagal disimpan. Periksa koneksi dan coba lagi.");
  } finally { $("saveUpdate").disabled = false; $("saveUpdate").textContent = "Simpan Perubahan"; }
});
if (!configured) show("Firebase belum disambungkan. Ikuti README.md untuk konfigurasi.", "info");
else onAuthStateChanged(auth, async user => {
  if (!user) { window.location.replace("admin-login.html"); return; }
  try {
    const profile = await getDoc(doc(db, "users", user.uid));
    if (!profile.exists() || profile.data().role !== "admin" || profile.data().active !== true) { await signOut(auth); window.location.replace("admin-login.html"); return; }
    $("adminEmail").textContent = user.email || "Admin";
    await loadReports();
  } catch (error) { console.error(error); show("Tidak dapat memeriksa hak akses. Periksa konfigurasi Firebase."); }
});
