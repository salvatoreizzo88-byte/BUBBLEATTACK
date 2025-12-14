/**
 * BUBBLE ATTACK - Game Engine
 * 
 * Motore principale del gioco basato su Babylon.js con fisica Havok.
 * Gestisce la scena, il rendering e il loop di gioco.
 */

import { ControllerDrago } from '../player/ControllerDrago.js';
import { SistemaBolla } from '../player/SistemaBolla.js';
import { SistemaInput } from '../player/SistemaInput.js';
import { GestoreGravita } from '../world/GestoreGravita.js';
import { GestoreCamera } from '../fx/GestoreCamera.js';
import { GestoreZone } from '../world/GestoreZone.js';
import { GestoreMaterialiFisici } from '../world/MaterialiFisici.js';
import { CaricatoreLivello } from '../world/CaricatoreLivello.js';

export class GiocoBubbleAttack {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        this.havokPlugin = null;
        this.camera = null;
        this.luce = null;

        // Sistemi di gioco
        this.controllerDrago = null;
        this.sistemaBolla = null;
        this.sistemaInput = null;
        this.gestoreGravita = null;
        this.gestoreCamera = null;
        this.gestoreZone = null;
        this.gestoreMateriali = null;
        this.caricatoreLivello = null;

        // Stato del gioco
        this.stato = {
            inPausa: false,
            oro: 0,
            gemme: 0,
            livelloCorrente: 1,
            biomaCorrente: 1
        };

        // Localizzazione italiana (caricata dinamicamente)
        this.stringhe = null;
    }

    /**
     * Carica le stringhe di localizzazione
     */
    async caricaStringhe() {
        try {
            const risposta = await fetch('./src/localization/it.json');
            this.stringhe = await risposta.json();
        } catch (errore) {
            console.warn('Impossibile caricare stringhe, uso default');
            // Stringhe fallback
            this.stringhe = {
                messaggi: {
                    caricamento_havok: 'Inizializzazione motore fisico...',
                    caricamento_livello: 'Preparazione livello...',
                    caricamento_assets: 'Caricamento risorse...',
                    pronto: 'Pronto!'
                }
            };
        }
    }

    /**
     * Inizializza il motore Babylon.js e la fisica Havok
     */
    async inizializza(callbackProgresso) {
        // Prima carica le stringhe
        await this.caricaStringhe();

        callbackProgresso(15, this.stringhe.messaggi.caricamento_havok);

        // Crea il motore Babylon.js
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        });

        // Adatta il canvas al ridimensionamento
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        callbackProgresso(25, this.stringhe.messaggi.caricamento_havok);

        // Inizializza Havok
        const havokInstance = await HavokPhysics();
        this.havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);

        callbackProgresso(40, this.stringhe.messaggi.caricamento_livello);

        // Crea la scena
        await this.creaScena();

        callbackProgresso(60, this.stringhe.messaggi.caricamento_assets);

        // Inizializza i sistemi di gioco
        await this.inizializzaSistemi();

        callbackProgresso(80, this.stringhe.messaggi.caricamento_livello);

        // Carica il livello iniziale (tutorial)
        await this.caricaLivelloIniziale();

        callbackProgresso(95, this.stringhe.messaggi.pronto);
    }

    /**
     * Crea la scena di gioco
     */
    async creaScena() {
        this.scene = new BABYLON.Scene(this.engine);

        // Abilita la fisica Havok
        this.scene.enablePhysics(
            new BABYLON.Vector3(0, -9.81, 0), // Gravità iniziale
            this.havokPlugin
        );

        // Colore di sfondo (viola profondo)
        this.scene.clearColor = new BABYLON.Color4(0.1, 0, 0.2, 1);

        // Nebbia per atmosfera
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.01;
        this.scene.fogColor = new BABYLON.Color3(0.1, 0, 0.2);

        // Camera ArcRotate per terza persona
        this.camera = new BABYLON.ArcRotateCamera(
            'cameraPrincipale',
            Math.PI / 2,  // Alpha (rotazione orizzontale)
            Math.PI / 3,  // Beta (inclinazione)
            15,           // Raggio (distanza dal target)
            BABYLON.Vector3.Zero(),
            this.scene
        );

        // Limiti della camera
        this.camera.lowerBetaLimit = 0.3;
        this.camera.upperBetaLimit = Math.PI / 2 - 0.1;
        this.camera.lowerRadiusLimit = 8;
        this.camera.upperRadiusLimit = 25;

        // Luce ambientale
        const luceAmbiente = new BABYLON.HemisphericLight(
            'luceAmbiente',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        luceAmbiente.intensity = 0.7;
        luceAmbiente.groundColor = new BABYLON.Color3(0.1, 0.1, 0.2);

        // Luce direzionale (sole)
        this.luce = new BABYLON.DirectionalLight(
            'luceSole',
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        this.luce.intensity = 0.8;
        this.luce.diffuse = new BABYLON.Color3(1, 0.95, 0.8);

        // Ombre
        const generatoreOmbre = new BABYLON.ShadowGenerator(1024, this.luce);
        generatoreOmbre.useBlurExponentialShadowMap = true;
        generatoreOmbre.blurKernel = 32;

        this.generatoreOmbre = generatoreOmbre;
    }

    /**
     * Inizializza tutti i sistemi di gioco
     */
    async inizializzaSistemi() {
        // Gestore Gravità
        this.gestoreGravita = new GestoreGravita(this.scene);

        // Gestore Camera (Juice effects)
        this.gestoreCamera = new GestoreCamera(this.camera, this.scene);

        // Sistema Input (Touch/Keyboard)
        this.sistemaInput = new SistemaInput(this.canvas, this.camera);

        // Gestore Zone (Trigger volumes)
        this.gestoreZone = new GestoreZone(this.scene, this.gestoreGravita);

        // Gestore Materiali Fisici (Preset biomi)
        this.gestoreMateriali = new GestoreMaterialiFisici(this.scene);

        // Caricatore Livello
        this.caricatoreLivello = new CaricatoreLivello(
            this.scene,
            this.gestoreGravita,
            this.gestoreZone,
            this.gestoreMateriali
        );

        // Configura callbacks delle zone
        this.gestoreZone.impostaCallback('onMorte', (checkpoint) => {
            this.gestisciMorteGiocatore(checkpoint);
        });

        this.gestoreZone.impostaCallback('onVittoria', (prossimoLivello) => {
            this.gestisciVittoriaLivello(prossimoLivello);
        });

        this.gestoreZone.impostaCallback('onCheckpoint', (idCheckpoint) => {
            console.log(`💾 Checkpoint raggiunto: ${idCheckpoint}`);
        });

        // Controller Drago (Player)
        this.controllerDrago = new ControllerDrago(
            this.scene,
            this.gestoreGravita,
            this.sistemaInput
        );
        await this.controllerDrago.crea();

        // Sistema Bolle
        this.sistemaBolla = new SistemaBolla(
            this.scene,
            this.controllerDrago,
            this.gestoreGravita
        );

        // Aggiungi il drago alle ombre
        if (this.controllerDrago.mesh) {
            this.generatoreOmbre.addShadowCaster(this.controllerDrago.mesh);
        }

        // Collega la camera al drago
        this.camera.lockedTarget = this.controllerDrago.mesh;

        // Rendi disponibile globalmente per i sistemi
        window.gioco = this;
    }

    /**
     * Carica il livello iniziale (Tutorial - Caverna Primordiale)
     */
    async caricaLivelloIniziale() {
        // Crea un pavimento temporaneo per il tutorial
        const pavimento = BABYLON.MeshBuilder.CreateBox(
            'pavimento',
            { width: 50, height: 2, depth: 50 },
            this.scene
        );
        pavimento.position.y = -1;
        pavimento.receiveShadows = true;

        // Materiale del pavimento
        const materialePavimento = new BABYLON.StandardMaterial('matPavimento', this.scene);
        materialePavimento.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        materialePavimento.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        pavimento.material = materialePavimento;

        // Fisica del pavimento
        new BABYLON.PhysicsAggregate(
            pavimento,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0, friction: 0.5, restitution: 0.1 },
            this.scene
        );

        // Alcune piattaforme di test
        this.creaPiattaformeDiTest();
    }

    /**
     * Crea piattaforme di test per il tutorial
     */
    creaPiattaformeDiTest() {
        const posizioni = [
            { x: 5, y: 2, z: 0 },
            { x: 10, y: 4, z: 3 },
            { x: -5, y: 3, z: 5 },
            { x: 0, y: 6, z: 8 }
        ];

        const materialePiattaforma = new BABYLON.StandardMaterial('matPiattaforma', this.scene);
        materialePiattaforma.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.5);
        materialePiattaforma.specularColor = new BABYLON.Color3(0.2, 0.2, 0.3);

        posizioni.forEach((pos, i) => {
            const piattaforma = BABYLON.MeshBuilder.CreateBox(
                `piattaforma_${i}`,
                { width: 4, height: 0.5, depth: 4 },
                this.scene
            );
            piattaforma.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
            piattaforma.material = materialePiattaforma;
            piattaforma.receiveShadows = true;

            new BABYLON.PhysicsAggregate(
                piattaforma,
                BABYLON.PhysicsShapeType.BOX,
                { mass: 0, friction: 0.5, restitution: 0.1 },
                this.scene
            );
        });
    }

    /**
     * Avvia il loop di gioco
     */
    avvia() {
        // Registra il loop di update
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.stato.inPausa) {
                this.update();
            }
        });

        // Avvia il render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        console.log('🐉 BUBBLE ATTACK avviato!');
    }

    /**
     * Update loop del gioco
     */
    update() {
        const deltaTime = this.engine.getDeltaTime() / 1000;

        // Aggiorna i sistemi
        this.sistemaInput.update();
        this.gestoreGravita.update(deltaTime);
        this.controllerDrago.update(deltaTime);
        this.sistemaBolla.update(deltaTime);
        this.gestoreCamera.update(deltaTime);

        // Aggiorna HUD
        this.aggiornaHUD();
    }

    /**
     * Aggiorna l'HUD
     */
    aggiornaHUD() {
        document.getElementById('contatorOro').textContent = this.stato.oro;
        document.getElementById('contatoreGemme').textContent = this.stato.gemme;
    }

    /**
     * Mette in pausa il gioco
     */
    pausa() {
        this.stato.inPausa = true;
    }

    /**
     * Riprende il gioco
     */
    riprendi() {
        this.stato.inPausa = false;
    }

    /**
     * Aggiunge oro al giocatore
     */
    aggiungiOro(quantita) {
        this.stato.oro += quantita;
    }

    /**
     * Aggiunge gemme al giocatore
     */
    aggiungiGemme(quantita) {
        this.stato.gemme += quantita;
    }

    /**
     * Ottiene una stringa localizzata
     */
    ottieniStringa(percorso) {
        const parti = percorso.split('.');
        let valore = this.stringhe;
        for (const parte of parti) {
            valore = valore?.[parte];
        }
        return valore || percorso;
    }

    /**
     * Gestisce la morte del giocatore
     */
    gestisciMorteGiocatore(checkpoint) {
        console.log('💀 Morte del giocatore');

        // Ottieni posizione di respawn dal checkpoint o default
        const posizioneRespawn = checkpoint?.posizione ||
            this.gestoreZone.ottieniPosizioneRespawn();

        // Teletrasporta il giocatore
        if (this.controllerDrago) {
            this.controllerDrago.teletrasporta(
                new BABYLON.Vector3(
                    posizioneRespawn.x,
                    posizioneRespawn.y,
                    posizioneRespawn.z
                )
            );
        }

        // Effetto camera
        if (this.gestoreCamera) {
            this.gestoreCamera.aggiungiTrauma(0.5);
        }

        // TODO: Riduci vite, mostra UI morte, etc.
    }

    /**
     * Gestisce la vittoria del livello
     */
    async gestisciVittoriaLivello(prossimoLivello) {
        console.log(`🏆 Livello completato! Prossimo: ${prossimoLivello || 'da determinare'}`);

        this.pausa();

        // Mostra messaggio vittoria
        // TODO: Implementare UI vittoria

        // Determina prossimo livello
        const nuovoLivello = prossimoLivello || (this.stato.livelloCorrente + 1);

        // Attendi un momento prima di caricare
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Carica prossimo livello
        await this.caricaProssimoLivello(nuovoLivello);

        this.riprendi();
    }

    /**
     * Carica un nuovo livello
     */
    async caricaProssimoLivello(numeroLivello) {
        console.log(`📦 Caricamento livello ${numeroLivello}...`);

        this.stato.livelloCorrente = numeroLivello;
        this.stato.biomaCorrente = this.caricatoreLivello.calcolaBioma(numeroLivello);

        // Carica e costruisci il livello
        await this.caricatoreLivello.caricaLivello(numeroLivello);

        // Teletrasporta giocatore allo spawn
        const spawnPos = this.caricatoreLivello.ottieniSpawnGiocatore();
        if (this.controllerDrago) {
            this.controllerDrago.teletrasporta(
                new BABYLON.Vector3(spawnPos.x, spawnPos.y, spawnPos.z)
            );
        }

        // Precarica livelli successivi
        this.caricatoreLivello.precaricaLivelli(numeroLivello, 2);

        console.log(`✅ Livello ${numeroLivello} pronto`);
    }

    /**
     * Riavvia il livello corrente
     */
    async riavviaLivello() {
        await this.caricaProssimoLivello(this.stato.livelloCorrente);
    }
}
