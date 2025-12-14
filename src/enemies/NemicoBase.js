/**
 * BUBBLE ATTACK - Classe Base Nemico
 * 
 * Classe astratta da cui derivano tutti i tipi di nemici.
 * Gestisce comportamento base, fisica, stati e interazione con bolle.
 */

// Stati possibili del nemico
export const StatiNemico = {
    INATTIVO: 'INATTIVO',
    PATTUGLIA: 'PATTUGLIA',
    INSEGUIMENTO: 'INSEGUIMENTO',
    ATTACCO: 'ATTACCO',
    STORDITO: 'STORDITO',
    CATTURATO: 'CATTURATO',      // Intrappolato in bolla
    MORTO: 'MORTO'
};

// Tipi di nemici
export const TipiNemico = {
    // Camminatori
    ZEN_ROBOT: 'ZenRobot',
    ROBOT_MOLLA: 'RobotMolla',
    SCARABEO_SCUDO: 'ScarabeoScudo',
    GRANCHIO_MAGMA: 'GranchioMagma',

    // Volanti
    DRONE_MAITA: 'DroneMaita',
    BOMBARDIERE_ELIO: 'BombardiereElio',
    RAZZA_NUVOLA: 'RazzaNuvola',
    INVASORE_X: 'InvasoreX',

    // Pesi Massimi
    GOLEM_GEODE: 'GolemGeode',
    VERGINE_FERRO: 'VergineFerro',

    // Anomalie
    STRISCIANTE_MELMA: 'StriscianteMelma',
    FORZIERE_MIMO: 'ForziereMimo',
    SENTINELLA_PRISMA: 'SentinellaPrisma',
    FUOCO_BUCO_NERO: 'FuocoBucoNero'
};

// Categorie nemici
export const CategorieNemico = {
    CAMMINATORE: 'Camminatore',
    VOLANTE: 'Volante',
    PESO_MASSIMO: 'PesoMassimo',
    ANOMALIA: 'Anomalia'
};

export class NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        this.scene = scene;
        this.posizioneIniziale = posizione.clone();
        this.opzioni = opzioni;

        // Identificazione
        this.id = `nemico_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.tipo = TipiNemico.ZEN_ROBOT;  // Override nelle sottoclassi
        this.categoria = CategorieNemico.CAMMINATORE;
        this.nomeVisualizzato = 'Nemico';

        // Stato
        this.statoCorrente = StatiNemico.INATTIVO;
        this.statoPrecedente = null;
        this.vivo = true;
        this.catturato = false;
        this.bollaCattura = null;

        // Fisica
        this.mesh = null;
        this.aggregatoFisico = null;
        this.massa = 1.0;
        this.attrito = 1.0;
        this.rimbalzo = 0.0;
        this.gravitaScale = 1.0;

        // Movimento
        this.velocitaMovimento = 3.0;
        this.velocitaRotazione = 5.0;
        this.direzioneCorrente = new BABYLON.Vector3(1, 0, 0);
        this.velocitaCorrente = new BABYLON.Vector3(0, 0, 0);

        // Pattuglia
        this.pattuglia = opzioni.pattuglia || false;
        this.puntiPattuglia = opzioni.puntiPattuglia || [];
        this.indicePattuglia = 0;
        this.rangoPatuglia = opzioni.rangoPatuglia || 5;
        this.tempoAttesaPattuglia = 0;
        this.attesaTraPunti = opzioni.attesaTraPunti || 1.0;

        // Rilevamento giocatore
        this.rangoRilevamento = opzioni.rangoRilevamento || 10;
        this.rangoAttacco = opzioni.rangoAttacco || 2;
        this.campoVisivo = opzioni.campoVisivo || Math.PI / 2;  // 90°
        this.target = null;

        // Combattimento
        this.puntiVita = opzioni.puntiVita || 1;
        this.puntiVitaMax = this.puntiVita;
        this.dannoContatto = opzioni.dannoContatto || 1;
        this.cooldownAttacco = opzioni.cooldownAttacco || 1.0;
        this.timerAttacco = 0;
        this.colpiPerCattura = opzioni.colpiPerCattura || 1;
        this.colpiRicevuti = 0;

        // Ricompense
        this.puntiUccisione = opzioni.puntiUccisione || 100;
        this.dropOro = opzioni.dropOro || { min: 1, max: 5 };
        this.dropFrutta = opzioni.dropFrutta || 'mela';

        // Timer e cooldown
        this.tempoStordimento = 0;
        this.durataStordimento = opzioni.durataStordimento || 2.0;
        this.tempoCattura = 0;
        this.durataCattura = opzioni.durataCattura || 8.0;  // Tempo prima che si liberi

        // Callbacks
        this.onMorte = opzioni.onMorte || null;
        this.onCattura = opzioni.onCattura || null;
        this.onDanno = opzioni.onDanno || null;

        // Debug
        this.debug = opzioni.debug || false;
    }

    /**
     * Crea il mesh e la fisica del nemico (override nelle sottoclassi)
     */
    async crea() {
        // Mesh base (cubo placeholder)
        this.mesh = BABYLON.MeshBuilder.CreateBox(
            this.id,
            { size: 1 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();

        // Materiale base
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(1, 0, 0);  // Rosso di default
        this.mesh.material = materiale;

        // Fisica
        this.creaFisica();

        // Genera punti pattuglia automatici se non specificati
        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiPattuglia();
        }

        // Tag per identificazione
        this.mesh.metadata = {
            tipo: 'nemico',
            istanza: this
        };

        console.log(`👾 ${this.nomeVisualizzato} creato in posizione ${this.posizioneIniziale}`);

        return this;
    }

    /**
     * Crea l'aggregato fisico
     */
    creaFisica() {
        this.aggregatoFisico = new BABYLON.PhysicsAggregate(
            this.mesh,
            BABYLON.PhysicsShapeType.BOX,
            {
                mass: this.massa,
                friction: this.attrito,
                restitution: this.rimbalzo
            },
            this.scene
        );

        // Blocca rotazione
        this.aggregatoFisico.body.setAngularDamping(100);
    }

    /**
     * Genera punti pattuglia automatici
     */
    generaPuntiPattuglia() {
        const centro = this.posizioneIniziale;
        const raggio = this.rangoPatuglia;

        // 4 punti cardinali
        this.puntiPattuglia = [
            new BABYLON.Vector3(centro.x + raggio, centro.y, centro.z),
            new BABYLON.Vector3(centro.x, centro.y, centro.z + raggio),
            new BABYLON.Vector3(centro.x - raggio, centro.y, centro.z),
            new BABYLON.Vector3(centro.x, centro.y, centro.z - raggio)
        ];
    }

    /**
     * Update principale (chiamato ogni frame)
     */
    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Aggiorna timer
        if (this.timerAttacco > 0) this.timerAttacco -= deltaTime;
        if (this.tempoStordimento > 0) this.tempoStordimento -= deltaTime;
        if (this.tempoAttesaPattuglia > 0) this.tempoAttesaPattuglia -= deltaTime;

        // Aggiorna timer cattura
        if (this.catturato) {
            this.tempoCattura += deltaTime;
            if (this.tempoCattura >= this.durataCattura) {
                this.liberaDaCattura();
            }
            return;  // Non fare altro se catturato
        }

        // FSM principale
        this.aggiornaStato(deltaTime, giocatore);

        // Esegui comportamento in base allo stato
        switch (this.statoCorrente) {
            case StatiNemico.PATTUGLIA:
                this.eseguiPattuglia(deltaTime);
                break;
            case StatiNemico.INSEGUIMENTO:
                this.eseguiInseguimento(deltaTime, giocatore);
                break;
            case StatiNemico.ATTACCO:
                this.eseguiAttacco(deltaTime, giocatore);
                break;
            case StatiNemico.STORDITO:
                // Nessuna azione
                break;
        }

        // Controlla bordi (inversione al burrone)
        this.controllaBoardi();
    }

    /**
     * Aggiorna la macchina a stati
     */
    aggiornaStato(deltaTime, giocatore) {
        // Se stordito, aspetta fine stordimento
        if (this.statoCorrente === StatiNemico.STORDITO) {
            if (this.tempoStordimento <= 0) {
                this.cambiaStato(StatiNemico.PATTUGLIA);
            }
            return;
        }

        // Controlla se vede il giocatore
        const vedeGiocatore = this.controllaLineaVista(giocatore);
        const distanzaGiocatore = giocatore ?
            BABYLON.Vector3.Distance(this.mesh.position, giocatore.position) :
            Infinity;

        // Transizioni di stato
        if (vedeGiocatore && distanzaGiocatore <= this.rangoAttacco) {
            this.cambiaStato(StatiNemico.ATTACCO);
            this.target = giocatore;
        } else if (vedeGiocatore && distanzaGiocatore <= this.rangoRilevamento) {
            this.cambiaStato(StatiNemico.INSEGUIMENTO);
            this.target = giocatore;
        } else if (this.pattuglia) {
            this.cambiaStato(StatiNemico.PATTUGLIA);
            this.target = null;
        } else {
            this.cambiaStato(StatiNemico.INATTIVO);
            this.target = null;
        }
    }

    /**
     * Cambia stato con callback
     */
    cambiaStato(nuovoStato) {
        if (this.statoCorrente === nuovoStato) return;

        this.statoPrecedente = this.statoCorrente;
        this.statoCorrente = nuovoStato;

        if (this.debug) {
            console.log(`${this.nomeVisualizzato}: ${this.statoPrecedente} → ${nuovoStato}`);
        }
    }

    /**
     * Controlla se ha linea di vista sul giocatore
     */
    controllaLineaVista(giocatore) {
        if (!giocatore || !giocatore.position) return false;

        const distanza = BABYLON.Vector3.Distance(this.mesh.position, giocatore.position);
        if (distanza > this.rangoRilevamento) return false;

        // Direzione verso giocatore
        const direzioneVersoTarget = giocatore.position.subtract(this.mesh.position).normalize();

        // Angolo rispetto alla direzione corrente
        const angolo = Math.acos(BABYLON.Vector3.Dot(this.direzioneCorrente, direzioneVersoTarget));

        if (angolo > this.campoVisivo / 2) return false;

        // Raycast per ostacoli
        const ray = new BABYLON.Ray(
            this.mesh.position.add(new BABYLON.Vector3(0, 0.5, 0)),
            direzioneVersoTarget,
            distanza
        );

        const hit = this.scene.pickWithRay(ray, (mesh) => {
            return mesh !== this.mesh &&
                mesh !== giocatore &&
                mesh.isPickable &&
                !mesh.name.startsWith('bolla_');
        });

        return !hit || !hit.hit;
    }

    /**
     * Comportamento pattuglia
     */
    eseguiPattuglia(deltaTime) {
        if (this.puntiPattuglia.length === 0) return;
        if (this.tempoAttesaPattuglia > 0) return;

        const targetPunto = this.puntiPattuglia[this.indicePattuglia];
        const distanza = BABYLON.Vector3.Distance(
            new BABYLON.Vector3(this.mesh.position.x, 0, this.mesh.position.z),
            new BABYLON.Vector3(targetPunto.x, 0, targetPunto.z)
        );

        if (distanza < 0.5) {
            // Raggiunto punto, vai al prossimo
            this.indicePattuglia = (this.indicePattuglia + 1) % this.puntiPattuglia.length;
            this.tempoAttesaPattuglia = this.attesaTraPunti;
        } else {
            // Muovi verso punto
            this.muoviVerso(targetPunto, this.velocitaMovimento * 0.5);
        }
    }

    /**
     * Comportamento inseguimento
     */
    eseguiInseguimento(deltaTime, giocatore) {
        if (!giocatore) return;

        this.muoviVerso(giocatore.position, this.velocitaMovimento);
    }

    /**
     * Comportamento attacco (override nelle sottoclassi)
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0) return;

        // Attacco base: danno da contatto
        // Le sottoclassi implementano attacchi specifici

        this.timerAttacco = this.cooldownAttacco;
    }

    /**
     * Muovi il nemico verso una posizione
     */
    muoviVerso(target, velocita) {
        if (!this.aggregatoFisico) return;

        const direzione = target.subtract(this.mesh.position);
        direzione.y = 0;  // Solo movimento orizzontale

        if (direzione.length() < 0.1) return;

        direzione.normalize();
        this.direzioneCorrente = direzione.clone();

        // Applica forza
        const forza = direzione.scale(velocita * this.massa * 10);
        this.aggregatoFisico.body.applyForce(forza, this.mesh.position);

        // Ruota verso direzione
        const angolo = Math.atan2(direzione.x, direzione.z);
        this.mesh.rotation.y = angolo;
    }

    /**
     * Controlla se sta per cadere da un bordo
     */
    controllaBoardi() {
        // Raycast in avanti e in basso per rilevare burroni
        const avanti = this.direzioneCorrente.scale(1.5);
        const puntoControllo = this.mesh.position.add(avanti);

        const ray = new BABYLON.Ray(
            puntoControllo.add(new BABYLON.Vector3(0, 0.5, 0)),
            new BABYLON.Vector3(0, -1, 0),
            3
        );

        const hit = this.scene.pickWithRay(ray, (mesh) => {
            return mesh !== this.mesh && mesh.isPickable;
        });

        if (!hit || !hit.hit) {
            // Burrone! Inverti direzione
            this.direzioneCorrente.scaleInPlace(-1);
            if (this.puntiPattuglia.length > 0) {
                this.indicePattuglia = (this.indicePattuglia + 1) % this.puntiPattuglia.length;
            }
        }
    }

    /**
     * Ricevi danno da una bolla
     */
    colpitoDaBolla(bolla) {
        if (this.catturato || !this.vivo) return false;

        this.colpiRicevuti++;

        if (this.onDanno) {
            this.onDanno(this, bolla);
        }

        if (this.colpiRicevuti >= this.colpiPerCattura) {
            this.cattura(bolla);
            return true;
        } else {
            // Stordisci temporaneamente
            this.stordisci();
            return false;
        }
    }

    /**
     * Stordisci il nemico
     */
    stordisci() {
        this.cambiaStato(StatiNemico.STORDITO);
        this.tempoStordimento = this.durataStordimento;

        // Ferma movimento
        if (this.aggregatoFisico) {
            this.aggregatoFisico.body.setLinearVelocity(BABYLON.Vector3.Zero());
        }

        // Effetto visivo
        if (this.mesh.material) {
            this.mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
            setTimeout(() => {
                if (this.mesh && this.mesh.material) {
                    this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                }
            }, this.durataStordimento * 1000);
        }
    }

    /**
     * Cattura il nemico in una bolla
     */
    cattura(bolla) {
        this.catturato = true;
        this.bollaCattura = bolla;
        this.tempoCattura = 0;
        this.cambiaStato(StatiNemico.CATTURATO);

        // Disabilita fisica
        if (this.aggregatoFisico) {
            this.aggregatoFisico.body.setLinearVelocity(BABYLON.Vector3.Zero());
            this.aggregatoFisico.body.setMassProperties({ mass: 0 });
        }

        // Attacca alla bolla
        if (bolla && bolla.mesh) {
            // Posiziona dentro la bolla
            this.mesh.parent = bolla.mesh;
            this.mesh.position = BABYLON.Vector3.Zero();
            this.mesh.scaling = new BABYLON.Vector3(0.6, 0.6, 0.6);
        }

        // Effetto visivo
        if (this.mesh.material) {
            this.mesh.material.alpha = 0.7;
        }

        if (this.onCattura) {
            this.onCattura(this, bolla);
        }

        console.log(`🫧 ${this.nomeVisualizzato} catturato!`);
    }

    /**
     * Libera il nemico dalla cattura
     */
    liberaDaCattura() {
        this.catturato = false;
        this.bollaCattura = null;
        this.colpiRicevuti = 0;
        this.cambiaStato(StatiNemico.PATTUGLIA);

        // Ripristina fisica
        if (this.aggregatoFisico) {
            this.aggregatoFisico.body.setMassProperties({ mass: this.massa });
        }

        // Scollega dalla bolla
        this.mesh.parent = null;
        this.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
        this.mesh.position = this.posizioneIniziale.clone();

        // Ripristina visivo
        if (this.mesh.material) {
            this.mesh.material.alpha = 1.0;
        }

        console.log(`💨 ${this.nomeVisualizzato} liberato!`);
    }

    /**
     * Uccidi il nemico (quando la bolla viene scoppiata)
     */
    muori() {
        if (!this.vivo) return;

        this.vivo = false;
        this.cambiaStato(StatiNemico.MORTO);

        console.log(`💀 ${this.nomeVisualizzato} sconfitto! +${this.puntiUccisione} punti`);

        // Callback morte
        if (this.onMorte) {
            this.onMorte(this);
        }

        // Distruggi dopo animazione
        this.distruggi();
    }

    /**
     * Pulisci e rimuovi il nemico
     */
    distruggi() {
        if (this.aggregatoFisico) {
            this.aggregatoFisico.dispose();
            this.aggregatoFisico = null;
        }

        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
    }

    /**
     * Ottieni info per debug/UI
     */
    ottieniInfo() {
        return {
            id: this.id,
            tipo: this.tipo,
            categoria: this.categoria,
            nome: this.nomeVisualizzato,
            stato: this.statoCorrente,
            vivo: this.vivo,
            catturato: this.catturato,
            vita: `${this.puntiVita}/${this.puntiVitaMax}`,
            posizione: this.mesh ? this.mesh.position : null
        };
    }
}

// Factory per creare nemici
export function creaNemico(tipo, scene, posizione, opzioni = {}) {
    // Import dinamici verranno implementati nelle sottoclassi
    // Per ora restituisce il nemico base
    const nemico = new NemicoBase(scene, posizione, opzioni);
    nemico.tipo = tipo;
    return nemico;
}
