import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDx2p5tkMaeAjL6WrHNxFvK7rKZ77iFZ4w",
  authDomain: "financeiro-a7116.firebaseapp.com",
  projectId: "financeiro-a7116",
  storageBucket: "financeiro-a7116.firebasestorage.app",
  messagingSenderId: "952138197288",
  appId: "1:952138197288:web:11b60ce4a514d346ce081d"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Inicializar e exportar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
