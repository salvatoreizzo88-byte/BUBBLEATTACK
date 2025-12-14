/**
 * BUBBLE ATTACK - Sistema Input
 * 
 * Gestisce input da tastiera e touch screen.
 * Supporta joystick virtuale fluttuante e pulsanti contestuali.
 */

export class SistemaInput {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;

        // Stato input corrente
        this.stato = {
            x: 0,           // Asse X joystick (-1 a 1)
            y: 0,           // Asse Y joystick (-1 a 1)
            salto: false,   // Tasto salto premuto
            sparo: false,   // Tasto sparo premuto
            giu: false      // Input giù (per schianto meteora)
        };

        // Stato tasti (per rilevare pressioni multiple)
        this.tastiPrecedenti = {
            salto: false,
            sparo: false
        };

        // Joystick virtuale
        this.joystick = {
            attivo: false,
            touchId: null,
            centroX: 0,
            centroY: 0,
            raggioMax: 60,
            deadzone: 0.1
        };

        // Riferimenti DOM
        this.zonaJoystick = document.getElementById('zonaJoystick');
        this.pomelloJoystick = document.getElementById('pomelloJoystick');
        this.pulsanteSalto = document.getElementById('pulsanteSalto');
        this.pulsanteSparo = document.getElementById('pulsanteSparo');

        // Inizializza listeners
        this.inizializzaListeners();
    }

    /**
     * Inizializza tutti i listener per input
     */
    inizializzaListeners() {
        // --- TASTIERA ---
        window.addEventListener('keydown', (e) => this.gestisciTastoGiu(e));
        window.addEventListener('keyup', (e) => this.gestisciTastoSu(e));

        // --- TOUCH ---
        if (this.zonaJoystick) {
            this.zonaJoystick.addEventListener('touchstart', (e) => this.iniziaJoystick(e), { passive: false });
            this.zonaJoystick.addEventListener('touchmove', (e) => this.muoviJoystick(e), { passive: false });
            this.zonaJoystick.addEventListener('touchend', (e) => this.terminaJoystick(e));
            this.zonaJoystick.addEventListener('touchcancel', (e) => this.terminaJoystick(e));
        }

        // Pulsante Salto
        if (this.pulsanteSalto) {
            this.pulsanteSalto.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.stato.salto = true;
            }, { passive: false });

            this.pulsanteSalto.addEventListener('touchend', () => {
                this.stato.salto = false;
            });

            this.pulsanteSalto.addEventListener('touchcancel', () => {
                this.stato.salto = false;
            });
        }

        // Pulsante Sparo
        if (this.pulsanteSparo) {
            this.pulsanteSparo.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.stato.sparo = true;
            }, { passive: false });

            this.pulsanteSparo.addEventListener('touchend', () => {
                this.stato.sparo = false;
            });

            this.pulsanteSparo.addEventListener('touchcancel', () => {
                this.stato.sparo = false;
            });
        }

        // Swipe per schianto meteora (lato destro schermo)
        this.canvas.addEventListener('touchstart', (e) => this.gestisciSwipeInizio(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.gestisciSwipe(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.gestisciSwipeFine(e));

        this.swipeInizio = null;
    }

    /**
     * Gestisce tasto premuto
     */
    gestisciTastoGiu(evento) {
        switch (evento.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.stato.y = 1;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.stato.y = -1;
                this.stato.giu = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.stato.x = -1;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.stato.x = 1;
                break;
            case 'Space':
                this.stato.salto = true;
                break;
            case 'KeyJ':
            case 'KeyZ':
                this.stato.sparo = true;
                break;
        }
    }

    /**
     * Gestisce tasto rilasciato
     */
    gestisciTastoSu(evento) {
        switch (evento.code) {
            case 'KeyW':
            case 'ArrowUp':
                if (this.stato.y > 0) this.stato.y = 0;
                break;
            case 'KeyS':
            case 'ArrowDown':
                if (this.stato.y < 0) this.stato.y = 0;
                this.stato.giu = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                if (this.stato.x < 0) this.stato.x = 0;
                break;
            case 'KeyD':
            case 'ArrowRight':
                if (this.stato.x > 0) this.stato.x = 0;
                break;
            case 'Space':
                this.stato.salto = false;
                break;
            case 'KeyJ':
            case 'KeyZ':
                this.stato.sparo = false;
                break;
        }
    }

    /**
     * Inizia interazione joystick
     */
    iniziaJoystick(evento) {
        evento.preventDefault();

        if (this.joystick.attivo) return;

        const touch = evento.changedTouches[0];
        this.joystick.attivo = true;
        this.joystick.touchId = touch.identifier;

        // Il centro è dove l'utente tocca (joystick fluttuante)
        const rect = this.zonaJoystick.getBoundingClientRect();
        this.joystick.centroX = touch.clientX;
        this.joystick.centroY = touch.clientY;
    }

    /**
     * Aggiorna posizione joystick
     */
    muoviJoystick(evento) {
        evento.preventDefault();

        if (!this.joystick.attivo) return;

        // Trova il touch corretto
        let touch = null;
        for (let i = 0; i < evento.changedTouches.length; i++) {
            if (evento.changedTouches[i].identifier === this.joystick.touchId) {
                touch = evento.changedTouches[i];
                break;
            }
        }

        if (!touch) return;

        // Calcola offset dal centro
        let deltaX = touch.clientX - this.joystick.centroX;
        let deltaY = touch.clientY - this.joystick.centroY;

        // Limita al raggio massimo
        const distanza = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distanza > this.joystick.raggioMax) {
            deltaX = (deltaX / distanza) * this.joystick.raggioMax;
            deltaY = (deltaY / distanza) * this.joystick.raggioMax;
        }

        // Normalizza a -1, 1
        this.stato.x = deltaX / this.joystick.raggioMax;
        this.stato.y = -deltaY / this.joystick.raggioMax;  // Inverti Y

        // Applica deadzone
        if (Math.abs(this.stato.x) < this.joystick.deadzone) this.stato.x = 0;
        if (Math.abs(this.stato.y) < this.joystick.deadzone) this.stato.y = 0;

        // Input giù per swipe
        this.stato.giu = this.stato.y < -0.7;

        // Aggiorna visivamente il pomello
        if (this.pomelloJoystick) {
            this.pomelloJoystick.style.transform =
                `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        }
    }

    /**
     * Termina interazione joystick
     */
    terminaJoystick(evento) {
        // Controlla se è il touch del joystick
        let trovato = false;
        for (let i = 0; i < evento.changedTouches.length; i++) {
            if (evento.changedTouches[i].identifier === this.joystick.touchId) {
                trovato = true;
                break;
            }
        }

        if (!trovato) return;

        this.joystick.attivo = false;
        this.joystick.touchId = null;
        this.stato.x = 0;
        this.stato.y = 0;
        this.stato.giu = false;

        // Resetta visivamente il pomello
        if (this.pomelloJoystick) {
            this.pomelloJoystick.style.transform = 'translate(-50%, -50%)';
        }
    }

    /**
     * Gestisce inizio swipe per schianto
     */
    gestisciSwipeInizio(evento) {
        // Solo lato destro dello schermo
        const touch = evento.changedTouches[0];
        if (touch.clientX > window.innerWidth / 2) {
            this.swipeInizio = {
                x: touch.clientX,
                y: touch.clientY,
                id: touch.identifier
            };
        }
    }

    /**
     * Gestisce movimento swipe
     */
    gestisciSwipe(evento) {
        if (!this.swipeInizio) return;

        for (let i = 0; i < evento.changedTouches.length; i++) {
            const touch = evento.changedTouches[i];
            if (touch.identifier === this.swipeInizio.id) {
                const deltaY = touch.clientY - this.swipeInizio.y;

                // Swipe giù rilevato
                if (deltaY > 50) {
                    this.stato.giu = true;
                }
            }
        }
    }

    /**
     * Gestisce fine swipe
     */
    gestisciSwipeFine(evento) {
        if (!this.swipeInizio) return;

        for (let i = 0; i < evento.changedTouches.length; i++) {
            if (evento.changedTouches[i].identifier === this.swipeInizio.id) {
                this.swipeInizio = null;
                this.stato.giu = false;
                break;
            }
        }
    }

    /**
     * Ottiene lo stato input corrente
     */
    getInput() {
        return { ...this.stato };
    }

    /**
     * Aggiorna lo stato (chiamato ogni frame)
     */
    update() {
        // Salva stati precedenti per rilevare edge
        this.tastiPrecedenti.salto = this.stato.salto;
        this.tastiPrecedenti.sparo = this.stato.sparo;
    }

    /**
     * Rileva se il salto è stato appena premuto (edge detection)
     */
    saltoAppenaPreminato() {
        return this.stato.salto && !this.tastiPrecedenti.salto;
    }

    /**
     * Rileva se lo sparo è stato appena premuto (edge detection)
     */
    sparoAppenaPremuto() {
        return this.stato.sparo && !this.tastiPrecedenti.sparo;
    }

    /**
     * Converte l'input in direzione relativa alla camera
     * L'input "avanti" segue sempre la direzione della camera
     */
    convertiInputInDirezioneCamera(inputMovimento) {
        if (!this.camera || inputMovimento.length() < 0.01) {
            return inputMovimento;
        }

        // Ottieni la direzione forward della camera sul piano XZ
        const cameraForward = this.camera.getForwardRay().direction;
        const forward = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();

        // Calcola il vettore right
        const right = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), forward).normalize();

        // Combina input con direzioni camera
        const direzione = new BABYLON.Vector3(
            right.x * inputMovimento.x + forward.x * inputMovimento.z,
            0,
            right.z * inputMovimento.x + forward.z * inputMovimento.z
        );

        return direzione;
    }
}
