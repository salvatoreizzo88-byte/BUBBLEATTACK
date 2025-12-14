/**
 * BUBBLE ATTACK - Configurazione Firebase
 * 
 * Configurazione per Firebase SDK con tutti i servizi necessari.
 * Progetto: bubble-attack-68b11
 */

// Importa i moduli Firebase necessari
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Configurazione Firebase per BUBBLE ATTACK
const firebaseConfig = {
    apiKey: "AIzaSyC-t4Fc09ggrxm5Xra15D2ztTApNSWECeI",
    authDomain: "bubble-attack-68b11.firebaseapp.com",
    projectId: "bubble-attack-68b11",
    storageBucket: "bubble-attack-68b11.firebasestorage.app",
    messagingSenderId: "666202139130",
    appId: "1:666202139130:web:5132f623f18c05508c10a3",
    measurementId: "G-QELCQNX504"
};

// Inizializza Firebase
let app = null;
let analytics = null;
let db = null;
let auth = null;
let storage = null;

/**
 * Inizializza tutti i servizi Firebase
 */
export function inizializzaFirebase() {
    try {
        // Inizializza l'app
        app = initializeApp(firebaseConfig);

        // Analytics (solo in produzione/browser)
        if (typeof window !== 'undefined') {
            analytics = getAnalytics(app);
        }

        // Firestore Database
        db = getFirestore(app);

        // Authentication
        auth = getAuth(app);

        // Storage per file
        storage = getStorage(app);

        console.log('🔥 Firebase inizializzato con successo!');

        return { app, analytics, db, auth, storage };

    } catch (errore) {
        console.error('❌ Errore inizializzazione Firebase:', errore);
        throw errore;
    }
}

/**
 * Ottieni istanza Firestore
 */
export function ottieniFirestore() {
    if (!db) {
        throw new Error('Firebase non inizializzato. Chiama inizializzaFirebase() prima.');
    }
    return db;
}

/**
 * Ottieni istanza Auth
 */
export function ottieniAuth() {
    if (!auth) {
        throw new Error('Firebase non inizializzato. Chiama inizializzaFirebase() prima.');
    }
    return auth;
}

/**
 * Ottieni istanza Storage
 */
export function ottieniStorage() {
    if (!storage) {
        throw new Error('Firebase non inizializzato. Chiama inizializzaFirebase() prima.');
    }
    return storage;
}

/**
 * Ottieni configurazione
 */
export function ottieniConfig() {
    return firebaseConfig;
}

/**
 * Verifica se Firebase è inizializzato
 */
export function isInizializzato() {
    return app !== null;
}

// Esporta configurazione per uso diretto
export { firebaseConfig };
