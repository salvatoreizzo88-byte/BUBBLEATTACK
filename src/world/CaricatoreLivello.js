/**
 * BUBBLE ATTACK - Caricatore Livello
 * 
 * Gestisce il caricamento dei livelli da file JSON.
 * Supporta 1000 livelli statici pre-generati e livelli procedurali.
 */

import { TipoZona, GestoreZone } from './GestoreZone.js';
import { TipoMateriale, GestoreMaterialiFisici, MaterialiBioma } from './MaterialiFisici.js';
import { TipoGravita } from './GestoreGravita.js';

// Tipi di elementi del livello
export const TipoElemento = {
    PIATTAFORMA: 'piattaforma',
    PIATTAFORMA_MOBILE: 'piattaforma_mobile',
    PIATTAFORMA_FANTASMA: 'piattaforma_fantasma',
    MURO: 'muro',
    SPAWN_GIOCATORE: 'spawn_giocatore',
    SPAWN_NEMICO: 'spawn_nemico',
    ZONA_GRAVITA: 'zona_gravita',
    ZONA_MORTE: 'zona_morte',
    ZONA_VITTORIA: 'zona_vittoria',
    CHECKPOINT: 'checkpoint',
    COLLEZIONABILE: 'collezionabile',
    DECORAZIONE: 'decorazione',
    TRAMPOLINO: 'trampolino',
    TELETRASPORTO: 'teletrasporto'
};

export class CaricatoreLivello {
    constructor(scene, gestoreGravita, gestoreZone, gestoreMateriali) {
        this.scene = scene;
        this.gestoreGravita = gestoreGravita;
        this.gestoreZone = gestoreZone;
        this.gestoreMateriali = gestoreMateriali;

        // Cache livelli caricati
        this.cacheLivelli = new Map();

        // Livello corrente
        this.livelloCorrente = null;
        this.datiLivelloCorrente = null;

        // Elementi creati nel livello corrente
        this.elementiCreati = {
            piattaforme: [],
            muri: [],
            zone: [],
            nemici: [],
            collezionabili: [],
            decorazioni: []
        };

        // Configurazione
        this.percorsoLivelli = './data/livelli/';
        this.percorsoRemoto = null;  // Per Filebase

        // Materiali visuali
        this.materialiPiattaforma = new Map();

        // Pool oggetti
        this.poolPiattaforme = [];
        this.maxPool = 50;
    }

    /**
     * Carica un livello da JSON
     */
    async caricaLivello(numeroLivello) {
        console.log(`📦 Caricamento livello ${numeroLivello}...`);

        try {
            // Controlla cache
            if (this.cacheLivelli.has(numeroLivello)) {
                const dati = this.cacheLivelli.get(numeroLivello);
                await this.costruisciLivello(dati);
                return dati;
            }

            // Determina il bioma
            const bioma = this.calcolaBioma(numeroLivello);

            // Prova prima locale, poi remoto
            let dati = await this.caricaLocale(numeroLivello, bioma);

            if (!dati) {
                dati = await this.caricaRemoto(numeroLivello, bioma);
            }

            if (!dati) {
                console.warn(`Livello ${numeroLivello} non trovato, genero proceduralmente`);
                dati = this.generaLivelloProcedurale(numeroLivello, bioma);
            }

            // Salva in cache
            this.cacheLivelli.set(numeroLivello, dati);

            // Costruisci il livello
            await this.costruisciLivello(dati);

            return dati;

        } catch (errore) {
            console.error(`Errore caricamento livello ${numeroLivello}:`, errore);

            // Fallback: genera livello procedurale
            const bioma = this.calcolaBioma(numeroLivello);
            const dati = this.generaLivelloProcedurale(numeroLivello, bioma);
            await this.costruisciLivello(dati);
            return dati;
        }
    }

    /**
     * Carica livello da file locale
     */
    async caricaLocale(numeroLivello, bioma) {
        try {
            const percorso = `${this.percorsoLivelli}${bioma}/livello_${numeroLivello}.json`;
            const risposta = await fetch(percorso);

            if (!risposta.ok) return null;

            return await risposta.json();
        } catch {
            return null;
        }
    }

    /**
     * Carica livello da server remoto (Filebase/IPFS)
     */
    async caricaRemoto(numeroLivello, bioma) {
        if (!this.percorsoRemoto) return null;

        try {
            const url = `${this.percorsoRemoto}livelli/${bioma}/livello_${numeroLivello}.json`;
            const risposta = await fetch(url);

            if (!risposta.ok) return null;

            return await risposta.json();
        } catch {
            return null;
        }
    }

    /**
     * Calcola il bioma in base al numero di livello
     */
    calcolaBioma(numeroLivello) {
        const biomi = [
            { id: 'caverna_primordiale', inizio: 1, fine: 100 },
            { id: 'foresta_fungina', inizio: 101, fine: 200 },
            { id: 'guglia_meccanica', inizio: 201, fine: 300 },
            { id: 'grotta_cristallo', inizio: 301, fine: 400 },
            { id: 'deriva_nebulare', inizio: 401, fine: 500 },
            { id: 'fonderia_magma', inizio: 501, fine: 600 },
            { id: 'cyber_grid', inizio: 601, fine: 700 },
            { id: 'il_vuoto', inizio: 701, fine: 800 },
            { id: 'palazzo_escher', inizio: 801, fine: 900 },
            { id: 'picco_drago', inizio: 901, fine: 1000 }
        ];

        for (const bioma of biomi) {
            if (numeroLivello >= bioma.inizio && numeroLivello <= bioma.fine) {
                return bioma.id;
            }
        }

        return 'caverna_primordiale';
    }

    /**
     * Costruisce il livello dalla struttura JSON
     */
    async costruisciLivello(dati) {
        // Prima pulisci il livello precedente
        this.pulisciLivello();

        this.livelloCorrente = dati.numero;
        this.datiLivelloCorrente = dati;

        // Imposta l'ambiente
        this.impostaAmbiente(dati.bioma, dati.ambiente);

        // Imposta materiale del bioma
        this.gestoreMateriali.impostaBiomaCorrente(dati.bioma);

        // Imposta gravità iniziale
        if (dati.gravitaIniziale) {
            this.gestoreGravita.impostaGravitaLineare(
                new BABYLON.Vector3(
                    dati.gravitaIniziale.x || 0,
                    dati.gravitaIniziale.y || -9.81,
                    dati.gravitaIniziale.z || 0
                ),
                true
            );
        }

        // Crea elementi
        for (const elemento of dati.elementi || []) {
            await this.creaElemento(elemento, dati.bioma);
        }

        console.log(`✅ Livello ${dati.numero} costruito - ${this.elementiCreati.piattaforme.length} piattaforme`);
    }

    /**
     * Crea un singolo elemento del livello
     */
    async creaElemento(elemento, bioma) {
        const posizione = new BABYLON.Vector3(
            elemento.posizione?.x || 0,
            elemento.posizione?.y || 0,
            elemento.posizione?.z || 0
        );

        const dimensioni = {
            x: elemento.dimensioni?.x || elemento.dimensioni?.larghezza || 4,
            y: elemento.dimensioni?.y || elemento.dimensioni?.altezza || 0.5,
            z: elemento.dimensioni?.z || elemento.dimensioni?.profondita || 4
        };

        const rotazione = elemento.rotazione || { x: 0, y: 0, z: 0 };

        switch (elemento.tipo) {
            case TipoElemento.PIATTAFORMA:
                await this.creaPiattaforma(posizione, dimensioni, rotazione, bioma, elemento);
                break;

            case TipoElemento.PIATTAFORMA_MOBILE:
                await this.creaPiattaformaMobile(posizione, dimensioni, rotazione, bioma, elemento);
                break;

            case TipoElemento.PIATTAFORMA_FANTASMA:
                await this.creaPiattaformaFantasma(posizione, dimensioni, rotazione, bioma, elemento);
                break;

            case TipoElemento.MURO:
                await this.creaMuro(posizione, dimensioni, rotazione, bioma, elemento);
                break;

            case TipoElemento.SPAWN_GIOCATORE:
                this.impostaSpawnGiocatore(posizione);
                break;

            case TipoElemento.SPAWN_NEMICO:
                this.registraSpawnNemico(posizione, elemento.tipoNemico, elemento.opzioni);
                break;

            case TipoElemento.ZONA_GRAVITA:
                this.creaZonaGravita(posizione, dimensioni, elemento);
                break;

            case TipoElemento.ZONA_MORTE:
                this.gestoreZone.creaPianoMorte(posizione, dimensioni);
                break;

            case TipoElemento.ZONA_VITTORIA:
                this.gestoreZone.creaZonaVittoria(posizione, dimensioni, elemento.prossimoLivello);
                break;

            case TipoElemento.CHECKPOINT:
                this.gestoreZone.creaCheckpoint(posizione, dimensioni, elemento.id);
                break;

            case TipoElemento.TRAMPOLINO:
                this.gestoreZone.creaTrampolino(posizione, dimensioni, elemento.forza || 20);
                break;

            case TipoElemento.TELETRASPORTO:
                this.gestoreZone.creaTeletrasporto(posizione, dimensioni, elemento.destinazione);
                break;

            case TipoElemento.COLLEZIONABILE:
                await this.creaCollezionabile(posizione, elemento.tipoCollezionabile, elemento.valore);
                break;

            case TipoElemento.DECORAZIONE:
                await this.creaDecorazione(posizione, rotazione, elemento.idModello);
                break;
        }
    }

    /**
     * Crea una piattaforma
     */
    async creaPiattaforma(posizione, dimensioni, rotazione, bioma, opzioni = {}) {
        // Prova a riutilizzare dal pool
        let mesh = this.ottieniDaPool();

        if (mesh) {
            // Ridimensiona mesh esistente
            mesh.scaling = new BABYLON.Vector3(dimensioni.x, dimensioni.y, dimensioni.z);
        } else {
            // Crea nuova mesh
            mesh = BABYLON.MeshBuilder.CreateBox(
                `piattaforma_${this.elementiCreati.piattaforme.length}`,
                { width: 1, height: 1, depth: 1 },
                this.scene
            );
            mesh.scaling = new BABYLON.Vector3(dimensioni.x, dimensioni.y, dimensioni.z);
        }

        mesh.position = posizione;
        mesh.rotation = new BABYLON.Vector3(rotazione.x, rotazione.y, rotazione.z);
        mesh.receiveShadows = true;
        mesh.isVisible = true;

        // Materiale visivo
        mesh.material = this.ottieniMaterialePiattaforma(bioma, opzioni.materiale);

        // Fisica
        const tipoMateriale = opzioni.materialeFisico ||
            MaterialiBioma[bioma] ||
            TipoMateriale.STANDARD;

        this.gestoreMateriali.creaAggregatoConMateriale(
            mesh,
            BABYLON.PhysicsShapeType.BOX,
            tipoMateriale,
            { massa: 0 }
        );

        this.elementiCreati.piattaforme.push(mesh);

        return mesh;
    }

    /**
     * Crea piattaforma mobile
     */
    async creaPiattaformaMobile(posizione, dimensioni, rotazione, bioma, opzioni) {
        const mesh = await this.creaPiattaforma(posizione, dimensioni, rotazione, bioma, opzioni);

        // Aggiungi animazione
        const punti = opzioni.percorso || [
            { x: posizione.x, y: posizione.y, z: posizione.z },
            { x: posizione.x + 5, y: posizione.y, z: posizione.z }
        ];

        const velocita = opzioni.velocita || 2;

        // Crea animazione keyframe
        const animazione = new BABYLON.Animation(
            'animazionePiattaforma',
            'position',
            30,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const framePerPunto = 60;
        const keys = punti.map((punto, i) => ({
            frame: i * framePerPunto,
            value: new BABYLON.Vector3(punto.x, punto.y, punto.z)
        }));

        // Aggiungi ritorno all'inizio
        keys.push({
            frame: punti.length * framePerPunto,
            value: new BABYLON.Vector3(punti[0].x, punti[0].y, punti[0].z)
        });

        animazione.setKeys(keys);
        mesh.animations = [animazione];

        this.scene.beginAnimation(mesh, 0, punti.length * framePerPunto, true);

        mesh.metadata.mobile = true;

        return mesh;
    }

    /**
     * Crea piattaforma fantasma (appare/scompare)
     */
    async creaPiattaformaFantasma(posizione, dimensioni, rotazione, bioma, opzioni) {
        const mesh = await this.creaPiattaforma(posizione, dimensioni, rotazione, bioma, opzioni);

        // Timer per apparizione/scomparsa
        const tempoVisibile = opzioni.tempoVisibile || 3;
        const tempoInvisibile = opzioni.tempoInvisibile || 2;
        const offset = opzioni.offset || 0;

        let tempo = offset;
        let visibile = true;

        // Usa observer per aggiornamento
        const observer = this.scene.onBeforeRenderObservable.add(() => {
            tempo += this.scene.getEngine().getDeltaTime() / 1000;

            const cicloDurata = tempoVisibile + tempoInvisibile;
            const tempoCiclo = tempo % cicloDurata;

            const dovrebbeEssereVisibile = tempoCiclo < tempoVisibile;

            if (dovrebbeEssereVisibile !== visibile) {
                visibile = dovrebbeEssereVisibile;
                mesh.isVisible = visibile;

                // Abilita/disabilita fisica
                if (mesh.physicsBody) {
                    mesh.physicsBody.setMotionType(
                        visibile ?
                            BABYLON.PhysicsMotionType.STATIC :
                            BABYLON.PhysicsMotionType.ANIMATED
                    );
                }
            }
        });

        mesh.metadata.fantasma = true;
        mesh.metadata.observer = observer;

        return mesh;
    }

    /**
     * Crea un muro
     */
    async creaMuro(posizione, dimensioni, rotazione, bioma, opzioni = {}) {
        const mesh = BABYLON.MeshBuilder.CreateBox(
            `muro_${this.elementiCreati.muri.length}`,
            { width: dimensioni.x, height: dimensioni.y, depth: dimensioni.z },
            this.scene
        );

        mesh.position = posizione;
        mesh.rotation = new BABYLON.Vector3(rotazione.x, rotazione.y, rotazione.z);
        mesh.receiveShadows = true;

        // Materiale
        mesh.material = this.ottieniMaterialeMuro(bioma);

        // Fisica
        new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0, friction: 0.5, restitution: 0 },
            this.scene
        );

        this.elementiCreati.muri.push(mesh);

        return mesh;
    }

    /**
     * Crea zona gravità
     */
    creaZonaGravita(posizione, dimensioni, opzioni) {
        switch (opzioni.tipoGravita) {
            case 'LINEARE':
            case TipoGravita.LINEARE:
                this.gestoreZone.creaZonaGravitaLineare(
                    posizione,
                    dimensioni,
                    opzioni.vettore || { x: 0, y: -9.81, z: 0 },
                    opzioni.istantanea
                );
                break;

            case 'PUNTO':
            case TipoGravita.PUNTO:
                this.gestoreZone.creaZonaGravitaPunto(
                    posizione,
                    dimensioni,
                    opzioni.centro,
                    opzioni.magnitudine
                );
                break;

            case 'ZERO':
            case TipoGravita.ZERO:
                this.gestoreZone.creaZonaGravitaZero(posizione, dimensioni);
                break;
        }
    }

    /**
     * Imposta spawn del giocatore
     */
    impostaSpawnGiocatore(posizione) {
        this.datiLivelloCorrente.spawnGiocatore = posizione;

        // Se il gioco è attivo, teletrasporta il giocatore
        if (window.gioco?.controllerDrago) {
            window.gioco.controllerDrago.teletrasporta(posizione);
        }
    }

    /**
     * Registra spawn nemico (i nemici verranno creati dal gestore nemici)
     */
    registraSpawnNemico(posizione, tipoNemico, opzioni = {}) {
        this.elementiCreati.nemici.push({
            posizione: posizione,
            tipo: tipoNemico,
            opzioni: opzioni
        });
    }

    /**
     * Crea collezionabile (moneta, gemma, etc.)
     */
    async creaCollezionabile(posizione, tipo, valore) {
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            `collezionabile_${this.elementiCreati.collezionabili.length}`,
            { diameter: 0.5 },
            this.scene
        );

        mesh.position = posizione;

        // Materiale dorato per monete
        const materiale = new BABYLON.StandardMaterial('matCollezionabile', this.scene);
        if (tipo === 'moneta' || tipo === 'oro') {
            materiale.diffuseColor = new BABYLON.Color3(1, 0.85, 0);
            materiale.emissiveColor = new BABYLON.Color3(0.3, 0.25, 0);
        } else {
            // Gemma
            materiale.diffuseColor = new BABYLON.Color3(0.5, 0, 1);
            materiale.emissiveColor = new BABYLON.Color3(0.2, 0, 0.4);
        }
        mesh.material = materiale;

        // Fisica trigger
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: 0, isTrigger: true },
            this.scene
        );

        mesh.metadata = {
            tipoCollezionabile: tipo,
            valore: valore || 1
        };

        // Animazione rotazione
        const animazione = new BABYLON.Animation(
            'rotazioneCollezionabile',
            'rotation.y',
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        animazione.setKeys([
            { frame: 0, value: 0 },
            { frame: 60, value: Math.PI * 2 }
        ]);
        mesh.animations = [animazione];
        this.scene.beginAnimation(mesh, 0, 60, true);

        this.elementiCreati.collezionabili.push(mesh);

        return mesh;
    }

    /**
     * Crea decorazione (non-fisica)
     */
    async creaDecorazione(posizione, rotazione, idModello) {
        // Per ora crea un cubo placeholder
        const mesh = BABYLON.MeshBuilder.CreateBox(
            `decorazione_${this.elementiCreati.decorazioni.length}`,
            { size: 1 },
            this.scene
        );

        mesh.position = posizione;
        mesh.rotation = new BABYLON.Vector3(rotazione.x, rotazione.y, rotazione.z);
        mesh.isPickable = false;

        // TODO: Caricare modello reale da idModello

        this.elementiCreati.decorazioni.push(mesh);

        return mesh;
    }

    /**
     * Imposta ambiente del livello
     */
    impostaAmbiente(bioma, ambiente = {}) {
        // Colore cielo
        if (ambiente.coloreCielo) {
            this.scene.clearColor = new BABYLON.Color4(
                ambiente.coloreCielo[0],
                ambiente.coloreCielo[1],
                ambiente.coloreCielo[2],
                1
            );
        }

        // Nebbia
        if (ambiente.nebbia) {
            this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
            this.scene.fogDensity = ambiente.nebbia.densita || 0.01;
            if (ambiente.nebbia.colore) {
                this.scene.fogColor = new BABYLON.Color3(
                    ambiente.nebbia.colore[0],
                    ambiente.nebbia.colore[1],
                    ambiente.nebbia.colore[2]
                );
            }
        }

        // Luce ambiente
        const luceAmbiente = this.scene.getLightByName('luceAmbiente');
        if (luceAmbiente && ambiente.lucaAmbiente) {
            luceAmbiente.intensity = ambiente.lucaAmbiente.intensita || 0.7;
        }
    }

    /**
     * Ottieni materiale piattaforma per bioma
     */
    ottieniMaterialePiattaforma(bioma, tipoOverride = null) {
        const chiave = tipoOverride || bioma;

        if (this.materialiPiattaforma.has(chiave)) {
            return this.materialiPiattaforma.get(chiave);
        }

        const materiale = new BABYLON.StandardMaterial(`matPiattaforma_${chiave}`, this.scene);

        // Colori per bioma
        const colori = {
            'caverna_primordiale': { diffuse: [0.3, 0.25, 0.2], specular: [0.1, 0.1, 0.1] },
            'foresta_fungina': { diffuse: [0.2, 0.4, 0.3], specular: [0.2, 0.3, 0.2] },
            'guglia_meccanica': { diffuse: [0.4, 0.4, 0.45], specular: [0.5, 0.5, 0.5] },
            'grotta_cristallo': { diffuse: [0.5, 0.7, 0.8], specular: [0.8, 0.9, 1] },
            'deriva_nebulare': { diffuse: [0.4, 0.3, 0.5], specular: [0.5, 0.4, 0.6] },
            'fonderia_magma': { diffuse: [0.3, 0.1, 0.1], specular: [0.5, 0.2, 0.1] },
            'cyber_grid': { diffuse: [0.1, 0.3, 0.3], specular: [0, 1, 1] },
            'il_vuoto': { diffuse: [0.1, 0.1, 0.1], specular: [0.2, 0.2, 0.2] },
            'palazzo_escher': { diffuse: [0.4, 0.4, 0.45], specular: [0.6, 0.6, 0.7] },
            'picco_drago': { diffuse: [0.5, 0.4, 0.2], specular: [0.7, 0.6, 0.3] }
        };

        const colore = colori[chiave] || colori['caverna_primordiale'];
        materiale.diffuseColor = new BABYLON.Color3(...colore.diffuse);
        materiale.specularColor = new BABYLON.Color3(...colore.specular);

        this.materialiPiattaforma.set(chiave, materiale);

        return materiale;
    }

    /**
     * Ottieni materiale muro per bioma
     */
    ottieniMaterialeMuro(bioma) {
        const materiale = this.ottieniMaterialePiattaforma(bioma);
        // I muri usano lo stesso materiale ma potrebbero essere più scuri
        return materiale;
    }

    /**
     * Pulisce il livello corrente
     */
    pulisciLivello() {
        // Rimuovi piattaforme
        for (const mesh of this.elementiCreati.piattaforme) {
            if (mesh.metadata?.observer) {
                this.scene.onBeforeRenderObservable.remove(mesh.metadata.observer);
            }
            this.riciclaInPool(mesh);
        }

        // Rimuovi muri
        for (const mesh of this.elementiCreati.muri) {
            mesh.dispose();
        }

        // Rimuovi collezionabili
        for (const mesh of this.elementiCreati.collezionabili) {
            mesh.dispose();
        }

        // Rimuovi decorazioni
        for (const mesh of this.elementiCreati.decorazioni) {
            mesh.dispose();
        }

        // Pulisci zone
        this.gestoreZone.pulisciTutte();

        // Reset liste
        this.elementiCreati = {
            piattaforme: [],
            muri: [],
            zone: [],
            nemici: [],
            collezionabili: [],
            decorazioni: []
        };

        console.log('🧹 Livello pulito');
    }

    /**
     * Ottieni mesh dal pool
     */
    ottieniDaPool() {
        if (this.poolPiattaforme.length > 0) {
            const mesh = this.poolPiattaforme.pop();
            mesh.setEnabled(true);
            return mesh;
        }
        return null;
    }

    /**
     * Ricicla mesh nel pool
     */
    riciclaInPool(mesh) {
        if (this.poolPiattaforme.length < this.maxPool) {
            mesh.setEnabled(false);
            if (mesh.physicsBody) {
                mesh.physicsBody.dispose();
            }
            this.poolPiattaforme.push(mesh);
        } else {
            mesh.dispose();
        }
    }

    /**
     * Genera livello procedurale (fallback)
     */
    generaLivelloProcedurale(numeroLivello, bioma) {
        const difficolta = Math.min(10, Math.floor(numeroLivello / 100) + 1);

        const dati = {
            numero: numeroLivello,
            bioma: bioma,
            nome: `Livello ${numeroLivello}`,
            difficolta: difficolta,
            gravitaIniziale: { x: 0, y: -9.81, z: 0 },
            ambiente: {},
            elementi: []
        };

        // Pavimento
        dati.elementi.push({
            tipo: TipoElemento.PIATTAFORMA,
            posizione: { x: 0, y: -1, z: 0 },
            dimensioni: { x: 30, y: 2, z: 30 }
        });

        // Spawn giocatore
        dati.elementi.push({
            tipo: TipoElemento.SPAWN_GIOCATORE,
            posizione: { x: 0, y: 2, z: 0 }
        });

        // Piattaforme random
        const numPiattaforme = 5 + difficolta;
        for (let i = 0; i < numPiattaforme; i++) {
            dati.elementi.push({
                tipo: TipoElemento.PIATTAFORMA,
                posizione: {
                    x: (Math.random() - 0.5) * 20,
                    y: 2 + i * 2,
                    z: (Math.random() - 0.5) * 20
                },
                dimensioni: {
                    x: 3 + Math.random() * 3,
                    y: 0.5,
                    z: 3 + Math.random() * 3
                }
            });
        }

        // Zona vittoria in cima
        dati.elementi.push({
            tipo: TipoElemento.ZONA_VITTORIA,
            posizione: { x: 0, y: 2 + numPiattaforme * 2 + 2, z: 0 },
            dimensioni: { x: 5, y: 3, z: 5 },
            prossimoLivello: numeroLivello + 1
        });

        // Piano di morte sotto
        dati.elementi.push({
            tipo: TipoElemento.ZONA_MORTE,
            posizione: { x: 0, y: -20, z: 0 },
            dimensioni: { x: 100, y: 2, z: 100 }
        });

        return dati;
    }

    /**
     * Ottieni spawn nemici per il gestore nemici
     */
    ottieniSpawnNemici() {
        return this.elementiCreati.nemici;
    }

    /**
     * Ottieni posizione spawn giocatore
     */
    ottieniSpawnGiocatore() {
        return this.datiLivelloCorrente?.spawnGiocatore || { x: 0, y: 2, z: 0 };
    }

    /**
     * Imposta percorso server remoto
     */
    impostaPercorsoRemoto(url) {
        this.percorsoRemoto = url;
    }

    /**
     * Precarica livelli successivi in cache
     */
    async precaricaLivelli(daLivello, quantita = 3) {
        for (let i = 1; i <= quantita; i++) {
            const numeroLivello = daLivello + i;
            if (numeroLivello <= 1000 && !this.cacheLivelli.has(numeroLivello)) {
                const bioma = this.calcolaBioma(numeroLivello);
                const dati = await this.caricaLocale(numeroLivello, bioma);
                if (dati) {
                    this.cacheLivelli.set(numeroLivello, dati);
                }
            }
        }
    }

    /**
     * Pulisci cache
     */
    pulisciCache() {
        this.cacheLivelli.clear();
    }
}
