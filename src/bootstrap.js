/**
 * BUBBLE ATTACK - Bootstrap
 * 
 * Script di avvio che carica tutti i moduli del gioco.
 * Gestisce il caricamento e mostra il progresso.
 */

// Importa il gioco principale
import { avviaGioco, GiocoBubbleAttack } from './GiocoBubbleAttack.js';

/**
 * Stato caricamento
 */
const statoCaricamento = {
    progressoTarget: 0,
    progressoCorrente: 0,
    completato: false
};

/**
 * Aggiorna barra di progresso
 */
function aggiornaProgresso(percentuale, testo) {
    const barra = document.getElementById('barraProgresso');
    const testoElem = document.getElementById('testoCaricamento');

    if (barra) {
        statoCaricamento.progressoTarget = percentuale;
        animaProgresso();
    }

    if (testoElem && testo) {
        testoElem.textContent = testo;
    }
}

function animaProgresso() {
    if (statoCaricamento.progressoCorrente < statoCaricamento.progressoTarget) {
        statoCaricamento.progressoCorrente += 1;

        const barra = document.getElementById('barraProgresso');
        if (barra) {
            barra.style.width = `${statoCaricamento.progressoCorrente}%`;
        }

        requestAnimationFrame(animaProgresso);
    }
}

/**
 * Nascondi schermata caricamento
 */
function nascondiSchermataCaricamento() {
    const schermata = document.getElementById('schermataCaricamento');
    if (schermata) {
        schermata.classList.add('nascosto');

        // Rimuovi dopo transizione
        setTimeout(() => {
            schermata.remove();
        }, 500);
    }
}

/**
 * Gestisci errore
 */
function gestisciErrore(errore) {
    console.error('❌ Errore avvio:', errore);

    const testoElem = document.getElementById('testoCaricamento');
    if (testoElem) {
        testoElem.textContent = `Errore: ${errore.message}`;
        testoElem.style.color = '#ff5252';
    }
}

/**
 * Inizializzazione principale
 */
async function inizializza() {
    console.log('🐉 BUBBLE ATTACK - Avvio...');

    try {
        // Fase 1: Controllo compatibilità
        aggiornaProgresso(10, 'Controllo compatibilità...');
        await controllaCompatibilita();

        // Fase 2: Caricamento Babylon.js
        aggiornaProgresso(30, 'Caricamento engine 3D...');
        await attendiCaricamentoBabylon();

        // Fase 3: Caricamento Havok Physics
        aggiornaProgresso(50, 'Caricamento fisica...');
        await attendiCaricamentoHavok();

        // Fase 4: Inizializzazione gioco
        aggiornaProgresso(70, 'Inizializzazione gioco...');
        const gioco = await avviaGioco('renderCanvas');

        // Fase 5: Completato
        aggiornaProgresso(100, 'Pronto!');

        // Piccola pausa per mostrare il 100%
        await new Promise(resolve => setTimeout(resolve, 500));

        // Nascondi schermata caricamento
        nascondiSchermataCaricamento();

        // Audio - inizializza al primo click
        document.addEventListener('click', () => {
            if (gioco.gestoreAudio && !gioco.gestoreAudio.inizializzato) {
                gioco.gestoreAudio.inizializza();
            }
        }, { once: true });

        console.log('✅ BUBBLE ATTACK pronto!');

    } catch (errore) {
        gestisciErrore(errore);
    }
}

/**
 * Controlla compatibilità browser
 */
async function controllaCompatibilita() {
    // WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
        throw new Error('WebGL non supportato dal browser');
    }

    // ES Modules
    if (typeof import.meta === 'undefined') {
        throw new Error('ES Modules non supportati');
    }

    return true;
}

/**
 * Attendi caricamento Babylon.js
 */
async function attendiCaricamentoBabylon() {
    return new Promise((resolve, reject) => {
        if (typeof BABYLON !== 'undefined') {
            resolve();
            return;
        }

        // Aspetta che Babylon sia caricato (max 10 secondi)
        let tentativi = 0;
        const intervallo = setInterval(() => {
            if (typeof BABYLON !== 'undefined') {
                clearInterval(intervallo);
                resolve();
            } else if (tentativi++ > 100) {
                clearInterval(intervallo);
                reject(new Error('Timeout caricamento Babylon.js'));
            }
        }, 100);
    });
}

/**
 * Attendi caricamento Havok Physics
 */
async function attendiCaricamentoHavok() {
    return new Promise((resolve, reject) => {
        if (typeof HavokPhysics !== 'undefined') {
            resolve();
            return;
        }

        let tentativi = 0;
        const intervallo = setInterval(() => {
            if (typeof HavokPhysics !== 'undefined') {
                clearInterval(intervallo);
                resolve();
            } else if (tentativi++ > 100) {
                clearInterval(intervallo);
                reject(new Error('Timeout caricamento Havok Physics'));
            }
        }, 100);
    });
}

// Avvia al caricamento della pagina
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inizializza);
} else {
    inizializza();
}

// Esporta per debug
window.BubbleAttack = {
    avviaGioco,
    GiocoBubbleAttack
};
