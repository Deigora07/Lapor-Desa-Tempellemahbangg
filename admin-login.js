import { configured, auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const $ = id => document.getElementById(id);
if ($("year")) $("year").textContent = new Date().getFullYear();
const form = $("loginForm"), message = $("loginMessage"), button = $("loginButton");
function show(text, type="error") { message.textContent = text; message.className = `form-message ${type}`; }
if (!configured) show("Firebase belum disambungkan. Lengkapi js/firebase-config.js sesuai README.md.", "info");
if (configured) onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const profile = await getDoc(doc(db, "users", user.uid));
    if (profile.exists() && profile.data().role === "admin" && profile.data().active === true) window.location.href = "admin.html";
  } catch (e) { console.warn("Pemeriksaan sesi admin:", e); }
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!configured) return show("Firebase belum terhubung. Ikuti README.md terlebih dahulu.", "info");
  button.disabled = true; button.textContent = "Memeriksa akun...";
  try {
    const credential = await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    const profile = await getDoc(doc(db, "users", credential.user.uid));
    if (!profile.exists() || profile.data().role !== "admin" || profile.data().active !== true) {
      await signOut(auth);
      show("Akun berhasil masuk, tetapi belum diberi hak admin. Minta pengelola membuat dokumen users dengan UID akun Anda.");
      return;
    }
    window.location.href = "admin.html";
  } catch (error) {
    console.error("Login admin gagal:", error);
    show(error?.code === "auth/invalid-credential" || error?.code === "auth/invalid-login-credentials" ? "Email atau kata sandi tidak sesuai." : error?.code === "auth/operation-not-allowed" ? "Aktifkan metode Email/Password di Firebase Authentication." : "Login gagal. Periksa email, kata sandi, jaringan, dan konfigurasi Firebase.");
  } finally { button.disabled = false; button.textContent = "Masuk ke Dashboard →"; }
});
