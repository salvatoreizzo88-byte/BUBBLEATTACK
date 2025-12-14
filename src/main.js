/**
 * BUBBLE ATTACK - Main Entry Point
 * 
 * Punto di ingresso principale del gioco BUBBLE ATTACK.
 * Inizializza il motore Babylon.js con fisica Havok e carica tutti i moduli.
 */

import { GiocoBubbleAttack } from './engine/GameEngine.js';

// Riferimenti agli elementi DOM
const canvas = document.getElementById('renderCanvas');
const schermataCaricamento = document.getElementById('schermataCaricamento');
const barraProgresso = document.getElementById('barraProgresso');
const testoCaricamento = document.getElementById('testoCaricamento');

// Aggiorna la barra di progresso
function aggiornaProgresso(percentuale, messaggio) {
    barraProgresso.style.width = `${percentuale}%`;
    testoCaricamento.textContent = messaggio;
}

// Nascondi la schermata di caricamento
function nascondiCaricamento() {
    schermataCaricamento.classList.add('nascosto');
    document.getElementById('hud').classList.add('visibile');
    document.getElementById('controlliTouch').classList.add('visibile');
}

// Mostra messaggio di gioco
function mostraMessaggio(testo, durata = 2000) {
    const messaggio = document.getElementById('messaggioGioco');
    messaggio.textContent = testo;
    messaggio.classList.add('visibile');
    
    setTimeout(() => {
        messaggio.classList.remove('visibile');
    }, durata);
}

// Funzione principale di inizializzazione
async function inizializzaGioco() {
    try {
        aggiornaProgresso(10, 'Inizializzazione motore fisico...');
        
        // Crea l'istanza del gioco
        const gioco = new GiocoBubbleAttack(canvas);
        
        // Inizializza il motore con Havok
        await gioco.inizializza((progresso, messaggio) => {
            aggiornaProgresso(progresso, messaggio);
        });
        
        aggiornaProgresso(100, 'Pronto!');
        
        // Attendi un momento prima di nascondere il caricamento
        await new Promise(resolve => setTimeout(resolve, 500));
        
        nascondiCaricamento();
        mostraMessaggio('🐉 BUBBLE ATTACK!');
        
        // Avvia il gioco
        gioco.avvia();
        
        // Esponi il gioco globalmente per debugging
        window.gioco = gioco;
        
    } catch (errore) {
        console.error('Errore durante l\'inizializzazione:', errore);
        testoCaricamento.textContent = 'Errore durante il caricamento. Ricarica la pagina.';
        testoCaricamento.style.color = '#ff5252';
    }
}

// Avvia quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inizializzaGioco);
} else {
    inizializzaGioco();
}

// Esponi la funzione per mostrare messaggi
window.mostraMessaggioGioco = mostraMessaggio;
