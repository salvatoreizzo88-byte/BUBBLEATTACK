/**
 * BUBBLE ATTACK - Selettore Livelli
 * 
 * Schermata selezione livelli con mappa biomi.
 * Tutto in italiano.
 */

export class SelettoreLivelli {
    constructor(gestoreEconomia) {
        this.gestoreEconomia = gestoreEconomia;

        // Biomi del gioco
        this.biomi = [
            {
                id: 'caverna_primordiale',
                nome: 'Caverna Primordiale',
                icona: '🪨',
                colore: '#8b7355',
                livelli: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            },
            {
                id: 'foresta_cristallo',
                nome: 'Foresta di Cristallo',
                icona: '💎',
                colore: '#9b59b6',
                livelli: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
            },
            {
                id: 'vulcano_abisso',
                nome: 'Vulcano dell\'Abisso',
                icona: '🌋',
                colore: '#e74c3c',
                livelli: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
            },
            {
                id: 'cielo_tempesta',
                nome: 'Cielo Tempestoso',
                icona: '⛈️',
                colore: '#3498db',
                livelli: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
            },
            {
                id: 'regno_ombra',
                nome: 'Regno dell\'Ombra',
                icona: '🌑',
                colore: '#2c3e50',
                livelli: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
            }
        ];

        // Stato
        this.biomaSelezionato = 0;
        this.aperto = false;

        // Callbacks
        this.onLivelloSelezionato = null;
        this.onChiudi = null;

        // Elementi DOM
        this.elementi = {};
    }

    apri() {
        this.aperto = true;
        this.creaUI();
        this.renderizzaBioma(this.biomaSelezionato);
    }

    chiudi() {
        this.aperto = false;
        if (this.elementi.container) {
            this.elementi.container.remove();
        }
        if (this.onChiudi) this.onChiudi();
    }

    creaUI() {
        const container = document.createElement('div');
        container.id = 'selettore-livelli';
        container.innerHTML = `
            <div class="selettore-overlay">
                <div class="selettore-box">
                    <div class="selettore-header">
                        <button id="btn-bioma-prec" class="btn-nav">◀</button>
                        <div class="bioma-info">
                            <span id="bioma-icona" class="bioma-icona">🪨</span>
                            <h2 id="bioma-nome">Caverna Primordiale</h2>
                        </div>
                        <button id="btn-bioma-succ" class="btn-nav">▶</button>
                    </div>
                    
                    <div id="griglia-livelli" class="griglia-livelli">
                        <!-- Generato dinamicamente -->
                    </div>
                    
                    <div class="selettore-footer">
                        <div class="progresso-bioma">
                            <span id="progresso-text">0/10 completati</span>
                            <div class="progresso-barra">
                                <div id="progresso-fill" class="progresso-fill" style="width: 0%"></div>
                            </div>
                        </div>
                        <button id="btn-chiudi-selettore" class="btn-chiudi">✖ Chiudi</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.elementi.container = container;

        // Aggiungi stili
        this.aggiungiStili();

        // Eventi
        document.getElementById('btn-bioma-prec').addEventListener('click', () => this.biomaPrecedente());
        document.getElementById('btn-bioma-succ').addEventListener('click', () => this.biomaSuccessivo());
        document.getElementById('btn-chiudi-selettore').addEventListener('click', () => this.chiudi());
    }

    aggiungiStili() {
        if (document.getElementById('stili-selettore')) return;

        const stili = document.createElement('style');
        stili.id = 'stili-selettore';
        stili.textContent = `
            #selettore-livelli {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 2000;
            }
            
            .selettore-overlay {
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .selettore-box {
                background: linear-gradient(180deg, #2d3748, #1a202c);
                border-radius: 20px;
                padding: 30px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .selettore-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            
            .bioma-info {
                text-align: center;
                flex: 1;
            }
            
            .bioma-icona {
                font-size: 3em;
                display: block;
                margin-bottom: 10px;
            }
            
            .bioma-info h2 {
                color: white;
                margin: 0;
            }
            
            .btn-nav {
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                color: white;
                font-size: 1.5em;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-nav:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .btn-nav:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .griglia-livelli {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .livello-card {
                aspect-ratio: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 3px solid rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .livello-card:hover:not(.bloccato) {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            
            .livello-card.completato {
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2));
                border-color: #22c55e;
            }
            
            .livello-card.corrente {
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2));
                border-color: #3b82f6;
                animation: pulse 2s infinite;
            }
            
            .livello-card.bloccato {
                opacity: 0.4;
                cursor: not-allowed;
            }
            
            @keyframes pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
                50% { box-shadow: 0 0 20px 5px rgba(59, 130, 246, 0.3); }
            }
            
            .livello-numero {
                font-size: 1.5em;
                font-weight: bold;
                color: white;
            }
            
            .livello-stelle {
                font-size: 0.8em;
                margin-top: 5px;
            }
            
            .livello-lucchetto {
                font-size: 1.5em;
            }
            
            .selettore-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .progresso-bioma {
                flex: 1;
                margin-right: 20px;
            }
            
            #progresso-text {
                color: #a0aec0;
                font-size: 0.9em;
            }
            
            .progresso-barra {
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-top: 5px;
            }
            
            .progresso-fill {
                height: 100%;
                background: linear-gradient(90deg, #4ade80, #22c55e);
                transition: width 0.3s;
            }
            
            .btn-chiudi {
                padding: 10px 25px;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                color: white;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-chiudi:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `;

        document.head.appendChild(stili);
    }

    renderizzaBioma(indice) {
        const bioma = this.biomi[indice];
        if (!bioma) return;

        // Aggiorna header
        document.getElementById('bioma-icona').textContent = bioma.icona;
        document.getElementById('bioma-nome').textContent = bioma.nome;

        // Aggiorna navigazione
        document.getElementById('btn-bioma-prec').disabled = indice === 0;
        document.getElementById('btn-bioma-succ').disabled =
            indice === this.biomi.length - 1 ||
            !this.biomaSbloccato(indice + 1);

        // Genera griglia livelli
        const griglia = document.getElementById('griglia-livelli');
        griglia.innerHTML = '';

        const livelloMax = this.gestoreEconomia.progressione.livelloMaxRaggiunto;
        let completati = 0;

        bioma.livelli.forEach(numLivello => {
            const sbloccato = numLivello <= livelloMax + 1;
            const completato = numLivello <= livelloMax;
            const corrente = numLivello === livelloMax + 1;

            if (completato) completati++;

            const card = document.createElement('div');
            card.className = 'livello-card';

            if (completato) card.classList.add('completato');
            if (corrente) card.classList.add('corrente');
            if (!sbloccato) card.classList.add('bloccato');

            if (sbloccato) {
                // Stelle (simulazione - in un gioco reale verrebbero salvate)
                const stelle = completato ? Math.floor(Math.random() * 2) + 2 : 0;

                card.innerHTML = `
                    <span class="livello-numero">${numLivello}</span>
                    <span class="livello-stelle">${'⭐'.repeat(stelle)}${'☆'.repeat(3 - stelle)}</span>
                `;

                card.addEventListener('click', () => this.selezionaLivello(numLivello));
            } else {
                card.innerHTML = `<span class="livello-lucchetto">🔒</span>`;
            }

            griglia.appendChild(card);
        });

        // Aggiorna progresso
        document.getElementById('progresso-text').textContent =
            `${completati}/${bioma.livelli.length} completati`;
        document.getElementById('progresso-fill').style.width =
            `${(completati / bioma.livelli.length) * 100}%`;
    }

    biomaSbloccato(indice) {
        if (indice === 0) return true;

        // Un bioma è sbloccato se il precedente è completato almeno al 70%
        const biomaPrecedente = this.biomi[indice - 1];
        if (!biomaPrecedente) return false;

        const livelloMax = this.gestoreEconomia.progressione.livelloMaxRaggiunto;
        const livelliCompletati = biomaPrecedente.livelli.filter(l => l <= livelloMax).length;

        return livelliCompletati >= biomaPrecedente.livelli.length * 0.7;
    }

    biomaPrecedente() {
        if (this.biomaSelezionato > 0) {
            this.biomaSelezionato--;
            this.renderizzaBioma(this.biomaSelezionato);
        }
    }

    biomaSuccessivo() {
        if (this.biomaSelezionato < this.biomi.length - 1 && this.biomaSbloccato(this.biomaSelezionato + 1)) {
            this.biomaSelezionato++;
            this.renderizzaBioma(this.biomaSelezionato);
        }
    }

    selezionaLivello(numero) {
        console.log(`📍 Livello ${numero} selezionato`);

        if (this.onLivelloSelezionato) {
            this.onLivelloSelezionato(numero);
        }

        this.chiudi();
    }
}
