/**
 * BUBBLE ATTACK - Controlli Touch
 * 
 * Sistema controlli touch per mobile.
 * Joystick virtuale sinistro + pulsanti azione destro.
 */

export class ControlliTouch {
    constructor(opzioni = {}) {
        this.opzioni = {
            raggioJoystick: 60,
            raggioPulsante: 40,
            opacita: 0.7,
            ...opzioni
        };

        // Stato controlli
        this.joystick = {
            attivo: false,
            toccoId: null,
            posIniziale: { x: 0, y: 0 },
            posCorrente: { x: 0, y: 0 },
            direzione: { x: 0, y: 0 }
        };

        this.pulsanti = {
            spara: false,
            salta: false,
            armaSucc: false,
            pausa: false
        };

        // Elementi DOM
        this.elementi = {};

        // Callbacks
        this.onDirezione = null;
        this.onSpara = null;
        this.onSalta = null;
        this.onCambiaArma = null;
        this.onPausa = null;

        // Inizializza
        this.creaControlli();
        this.collegaEventi();
    }

    creaControlli() {
        // Container
        const container = document.createElement('div');
        container.id = 'touch-controls';
        container.innerHTML = `
            <!-- Joystick Sinistro -->
            <div id="joystick-area" class="joystick-area">
                <div id="joystick-base" class="joystick-base">
                    <div id="joystick-stick" class="joystick-stick"></div>
                </div>
            </div>
            
            <!-- Pulsanti Destro -->
            <div id="buttons-area" class="buttons-area">
                <button id="btn-spara" class="touch-btn btn-spara">🔵</button>
                <button id="btn-salta" class="touch-btn btn-salta">⬆️</button>
                <button id="btn-arma" class="touch-btn btn-arma">🔄</button>
            </div>
        `;

        document.body.appendChild(container);

        // Salva riferimenti
        this.elementi = {
            container: container,
            joystickArea: document.getElementById('joystick-area'),
            joystickBase: document.getElementById('joystick-base'),
            joystickStick: document.getElementById('joystick-stick'),
            btnSpara: document.getElementById('btn-spara'),
            btnSalta: document.getElementById('btn-salta'),
            btnArma: document.getElementById('btn-arma')
        };

        // Aggiungi stili
        this.aggiungiStili();
    }

    aggiungiStili() {
        const stili = document.createElement('style');
        stili.textContent = `
            #touch-controls {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 900;
                touch-action: none;
            }
            
            .joystick-area {
                position: absolute;
                left: 20px;
                bottom: 100px;
                width: 150px;
                height: 150px;
                pointer-events: auto;
            }
            
            .joystick-base {
                width: ${this.opzioni.raggioJoystick * 2}px;
                height: ${this.opzioni.raggioJoystick * 2}px;
                background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
                border: 3px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                position: relative;
                opacity: ${this.opzioni.opacita};
            }
            
            .joystick-stick {
                width: ${this.opzioni.raggioJoystick}px;
                height: ${this.opzioni.raggioJoystick}px;
                background: radial-gradient(circle, rgba(0,200,255,0.8) 0%, rgba(0,150,200,0.6) 100%);
                border: 2px solid rgba(255,255,255,0.5);
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                transition: none;
            }
            
            .buttons-area {
                position: absolute;
                right: 20px;
                bottom: 100px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                pointer-events: auto;
            }
            
            .touch-btn {
                width: ${this.opzioni.raggioPulsante * 2}px;
                height: ${this.opzioni.raggioPulsante * 2}px;
                border-radius: 50%;
                border: 3px solid rgba(255,255,255,0.3);
                background: rgba(255,255,255,0.15);
                font-size: 1.8em;
                cursor: pointer;
                opacity: ${this.opzioni.opacita};
                transition: all 0.1s;
                -webkit-tap-highlight-color: transparent;
            }
            
            .touch-btn:active {
                transform: scale(0.9);
                background: rgba(255,255,255,0.3);
            }
            
            .btn-spara {
                background: radial-gradient(circle, rgba(0,150,255,0.4) 0%, rgba(0,100,200,0.2) 100%);
                border-color: rgba(0,150,255,0.5);
            }
            
            .btn-salta {
                background: radial-gradient(circle, rgba(0,255,150,0.4) 0%, rgba(0,200,100,0.2) 100%);
                border-color: rgba(0,255,150,0.5);
            }
            
            .btn-arma {
                background: radial-gradient(circle, rgba(255,200,0,0.4) 0%, rgba(200,150,0,0.2) 100%);
                border-color: rgba(255,200,0,0.5);
                width: 60px;
                height: 60px;
                font-size: 1.3em;
            }
            
            /* Layout tablet/desktop più grande */
            @media (min-width: 768px) {
                .joystick-base {
                    width: 150px;
                    height: 150px;
                }
                
                .joystick-stick {
                    width: 70px;
                    height: 70px;
                }
                
                .touch-btn {
                    width: 90px;
                    height: 90px;
                    font-size: 2em;
                }
            }
        `;

        document.head.appendChild(stili);
    }

    collegaEventi() {
        const area = this.elementi.joystickArea;

        // Joystick touch events
        area.addEventListener('touchstart', (e) => this.iniziaJoystick(e), { passive: false });
        area.addEventListener('touchmove', (e) => this.muoviJoystick(e), { passive: false });
        area.addEventListener('touchend', (e) => this.rilasciaJoystick(e), { passive: false });
        area.addEventListener('touchcancel', (e) => this.rilasciaJoystick(e), { passive: false });

        // Pulsanti
        this.elementi.btnSpara.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.pulsanti.spara = true;
            if (this.onSpara) this.onSpara(true);
        });
        this.elementi.btnSpara.addEventListener('touchend', () => {
            this.pulsanti.spara = false;
            if (this.onSpara) this.onSpara(false);
        });

        this.elementi.btnSalta.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.pulsanti.salta = true;
            if (this.onSalta) this.onSalta();
        });
        this.elementi.btnSalta.addEventListener('touchend', () => {
            this.pulsanti.salta = false;
        });

        this.elementi.btnArma.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.onCambiaArma) this.onCambiaArma();
        });
    }

    iniziaJoystick(e) {
        e.preventDefault();

        const touch = e.touches[0];
        const rect = this.elementi.joystickBase.getBoundingClientRect();

        this.joystick.attivo = true;
        this.joystick.toccoId = touch.identifier;
        this.joystick.posIniziale = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        this.aggiornaJoystick(touch.clientX, touch.clientY);
    }

    muoviJoystick(e) {
        e.preventDefault();

        if (!this.joystick.attivo) return;

        // Trova il touch corretto
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.joystick.toccoId) {
                this.aggiornaJoystick(e.touches[i].clientX, e.touches[i].clientY);
                break;
            }
        }
    }

    aggiornaJoystick(touchX, touchY) {
        const centro = this.joystick.posIniziale;
        const maxDistanza = this.opzioni.raggioJoystick;

        // Calcola offset dal centro
        let dx = touchX - centro.x;
        let dy = touchY - centro.y;

        // Limita al raggio
        const distanza = Math.sqrt(dx * dx + dy * dy);
        if (distanza > maxDistanza) {
            dx = (dx / distanza) * maxDistanza;
            dy = (dy / distanza) * maxDistanza;
        }

        // Aggiorna posizione stick
        const stick = this.elementi.joystickStick;
        stick.style.left = `calc(50% + ${dx}px)`;
        stick.style.top = `calc(50% + ${dy}px)`;

        // Calcola direzione normalizzata (-1 a 1)
        this.joystick.direzione = {
            x: dx / maxDistanza,
            y: -dy / maxDistanza  // Inverti Y per coordinate gioco
        };

        // Callback
        if (this.onDirezione) {
            this.onDirezione(this.joystick.direzione);
        }
    }

    rilasciaJoystick(e) {
        e.preventDefault();

        this.joystick.attivo = false;
        this.joystick.toccoId = null;
        this.joystick.direzione = { x: 0, y: 0 };

        // Resetta posizione stick
        const stick = this.elementi.joystickStick;
        stick.style.left = '50%';
        stick.style.top = '50%';

        // Callback
        if (this.onDirezione) {
            this.onDirezione({ x: 0, y: 0 });
        }
    }

    // ==================== API ====================

    /**
     * Ottieni direzione corrente joystick
     */
    ottieniDirezione() {
        return { ...this.joystick.direzione };
    }

    /**
     * Controlla se un pulsante è premuto
     */
    pulsantePremuto(nome) {
        return this.pulsanti[nome] === true;
    }

    /**
     * Mostra/nascondi controlli
     */
    mostra() {
        this.elementi.container.style.display = 'block';
    }

    nascondi() {
        this.elementi.container.style.display = 'none';
    }

    /**
     * Controlla se il dispositivo supporta touch
     */
    static supportaTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * Pulisci e rimuovi
     */
    distruggi() {
        if (this.elementi.container) {
            this.elementi.container.remove();
        }
    }
}
