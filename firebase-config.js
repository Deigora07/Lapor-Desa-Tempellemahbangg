// 1) Buka Firebase Console > Project settings > Your apps > SDK setup and configuration.
// 2) Salin konfigurasi aplikasi web Anda ke objek firebaseConfig di bawah ini.
// Jangan pernah menaruh Service Account/private key di frontend.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkJqpCvH7v-92wn6AzH-Ka9Wj9J-_F0IE",
  authDomain: "lapor-desa-tempellemahbang.firebaseapp.com",
  projectId: "lapor-desa-tempellemahbang",
  storageBucket: "lapor-desa-tempellemahbang.firebasestorage.app",
  messagingSenderId: "165156396765",
  appId: "1:165156396765:web:f30413d3611312c9144534",
  measurementId: "G-KTZD4CZZQ2"
};

export const configured = Boolean(
  firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("GANTI_") &&
  firebaseConfig.authDomain && !firebaseConfig.authDomain.startsWith("GANTI_") &&
  firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("GANTI_") &&
  firebaseConfig.appId && !firebaseConfig.appId.startsWith("GANTI_")
);

let app = null;
let auth = null;
let db = null;
let storage = null;
if (configured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}
export { app, auth, db, storage };
