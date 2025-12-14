/**
 * BUBBLE ATTACK - Gioco Principale
 * 
 * Classe principale che integra tutti i sistemi del gioco:
 * - Engine Babylon.js + Havok
 * - Giocatore e controlli
 * - Nemici e arsenale
 * - Economia e UI
 * - FX e Audio
 * 
 * Entry point del gioco.
 */

// Engine e fisiche
import { GameEngine } from './engine/GameEngine.js';

// Giocatore
import { ControllerDrago } from './player/ControllerDrago.js';
import { SistemaInput } from './player/SistemaInput.js';
import { SistemaBolla } from './player/SistemaBolla.js';

// Mondo
import { GestoreGravita } from './world/GestoreGravita.js';
import { GestoreCamera } from './world/GestoreCamera.js';
import { GestoreZone } from './world/GestoreZone.js';
import { CaricatoreLivello } from './world/CaricatoreLivello.js';
import { MaterialiFisici } from './world/MaterialiFisici.js';

// Nemici
import { GestoreNemici } from './enemies/GestoreNemici.js';
import { ZenRobot } from './enemies/Camminatori/ZenRobot.js';
import { RobotMolla } from './enemies/Camminatori/RobotMolla.js';
import { ScarabeoScudo } from './enemies/Camminatori/ScarabeoScudo.js';
import { GranchioMagma } from './enemies/Camminatori/GranchioMagma.js';
import { DroneMaita } from './enemies/Volanti/DroneMaita.js';
import { InvasoreX } from './enemies/Volanti/InvasoreX.js';
import { BombardiereElio } from './enemies/Volanti/BombardiereElio.js';
import { RazzaNuvola } from './enemies/Volanti/RazzaNuvola.js';
import { GolemGeode } from './enemies/PesiMassimi/GolemGeode.js';
import { VergineFerro } from './enemies/PesiMassimi/VergineFerro.js';
import { StriscianteMelma } from './enemies/Anomalie/StriscianteMelma.js';
import { ForziereMimo } from './enemies/Anomalie/ForziereMimo.js';
import { SentinellaPrisma } from './enemies/Anomalie/SentinellaPrisma.js';
import { FuocoBucoNero } from './enemies/Anomalie/FuocoBucoNero.js';

// Armi
import { GestoreArsenale } from './weapons/GestoreArsenale.js';
import { BollaFulmine } from './weapons/BollaFulmine.js';
import { OndaMareale } from './weapons/OndaMareale.js';
import { TrivellaPerforante } from './weapons/TrivellaPerforante.js';
import { TorrenteNapalm } from './weapons/TorrenteNapalm.js';
import { AncoraGravitazionale } from './weapons/AncoraGravitazionale.js';
import { CongelaTempo } from './weapons/CongelaTempo.js';
import { VuotoSingolarita } from './weapons/VuotoSingolarita.js';
import { DardoElio } from './weapons/DardoElio.js';
import { CometaRimbalzante } from './weapons/CometaRimbalzante.js';

// Economia
import { GestoreEconomia } from './economy/GestoreEconomia.js';
import { Negozio } from './economy/Negozio.js';

// UI
import { GestoreUI } from './ui/GestoreUI.js';
import { ControlliTouch } from './ui/ControlliTouch.js';
import { SelettoreLivelli } from './ui/SelettoreLivelli.js';

// FX
import { GestoreFX } from './fx/GestoreFX.js';
import { GestoreAudio } from './fx/GestoreAudio.js';
import { EffettiPostProcess } from './fx/EffettiPostProcess.js';

// Firebase
import { GestoreSalvataggi } from './firebase/GestoreSalvataggi.js';

/**
 * Stato del gioco
 */
export const StatiGioco = {
    CARICAMENTO: 'CARICAMENTO',
    MENU: 'MENU',
    GIOCO: 'GIOCO',
    PAUSA: 'PAUSA',
    VITTORIA: 'VITTORIA',
    SCONFITTA: 'SCONFITTA'
};

/**
 * Classe principale del gioco
 */
export class GiocoBubbleAttack {
    constructor(canvas) {
        this.canvas = canvas;

        // Stato
        this.statoCorrente = StatiGioco.CARICAMENTO;
        this.livelloCorrente = 1;
        this.inPausa = false;

        // Sistemi core
        this.engine = null;
        this.scene = null;
        this.camera = null;

        // Sistemi gioco
        this.giocatore = null;
        this.sistemaInput = null;
        this.sistemaBolla = null;

        // Mondo
        this.gestoreGravita = null;
        this.gestoreCamera = null;
        this.gestoreZone = null;
        this.caricatoreLivello = null;
        this.materialiFisici = null;

        // Entità
        this.gestoreNemici = null;
        this.gestoreArsenale = null;

        // Economia e UI
        this.gestoreEconomia = null;
        this.negozio = null;
        this.gestoreUI = null;
        this.controlliTouch = null;
        this.selettoreLivelli = null;

        // FX
        this.gestoreFX = null;
        this.gestoreAudio = null;
        this.effettiPost = null;

        // Firebase
        this.gestoreSalvataggi = null;

        // Dati giocatore
        this.viteRimaste = 3;
        this.viteMax = 3;

        // Callbacks
        this.onPronto = null;
        this.onErrore = null;
    }

    /**
     * Inizializza il gioco
     */
    async inizializza() {
        console.log('🐉 BUBBLE ATTACK - Inizializzazione...');

        try {
            // 1. Engine Babylon.js
            await this.inizializzaEngine();

            // 2. Firebase (opzionale)
            await this.inizializzaFirebase();

            // 3. Economia
            this.inizializzaEconomia();

            // 4. UI
            this.inizializzaUI();

            // 5. Controlli
            this.inizializzaControlli();

            // 6. FX e Audio
            this.inizializzaFX();

            // 7. Registra nemici e armi
            this.registraEntita();

            // 8. Loop di gioco
            this.avviaGameLoop();

            // Pronto!
            this.statoCorrente = StatiGioco.MENU;
            this.gestoreUI.apriMenuPrincipale();

            console.log('✅ BUBBLE ATTACK pronto!');

            if (this.onPronto) this.onPronto();

        } catch (errore) {
            console.error('❌ Errore inizializzazione:', errore);
            if (this.onErrore) this.onErrore(errore);
        }
    }

    async inizializzaEngine() {
        // Crea engine Babylon
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        });

        // Crea scena
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);

        // Inizializza Havok
        const havok = await HavokPhysics();
        const plugin = new BABYLON.HavokPlugin(true, havok);
        this.scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), plugin);

        // Camera
        this.camera = new BABYLON.ArcRotateCamera(
            'camera',
            Math.PI / 2,
            Math.PI / 3,
            20,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = 10;
        this.camera.upperRadiusLimit = 40;

        // Luce ambiente
        const luce = new BABYLON.HemisphericLight(
            'luce',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        luce.intensity = 0.8;

        // Luce direzionale
        const luceDirezionale = new BABYLON.DirectionalLight(
            'luceDirezionale',
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        luceDirezionale.intensity = 0.6;

        // Gestori mondo
        this.gestoreGravita = new GestoreGravita(this.scene);
        this.gestoreCamera = new GestoreCamera(this.camera, this.scene);
        this.gestoreZone = new GestoreZone(this.scene);
        this.caricatoreLivello = new CaricatoreLivello(this.scene);
        this.materialiFisici = new MaterialiFisici(this.scene);

        console.log('🎮 Engine inizializzato');
    }

    async inizializzaFirebase() {
        try {
            this.gestoreSalvataggi = new GestoreSalvataggi();
            console.log('☁️ Firebase pronto');
        } catch (e) {
            console.warn('Firebase non configurato, salvataggio locale');
        }
    }

    inizializzaEconomia() {
        this.gestoreEconomia = new GestoreEconomia(this.gestoreSalvataggi);

        // Carica progressione salvata
        if (this.gestoreSalvataggi) {
            // Il caricamento async verrà gestito separatamente
        }

        // Negozio
        this.negozio = new Negozio(this.gestoreEconomia, this.gestoreArsenale);

        // Callbacks economia
        this.gestoreEconomia.onLivelloUp = (livello) => {
            this.gestoreFX?.levelUp(this.giocatore?.mesh?.position);
            this.gestoreAudio?.riproduciEffetto('levelUp');
            this.gestoreUI?.mostraToast(`Level Up! Livello ${livello}`, 'successo');
        };

        console.log('💰 Economia inizializzata');
    }

    inizializzaUI() {
        this.gestoreUI = new GestoreUI(this.gestoreEconomia);
        this.selettoreLivelli = new SelettoreLivelli(this.gestoreEconomia);

        // Callbacks UI
        this.gestoreUI.onPausa = () => this.pausa();
        this.gestoreUI.onRiprendi = () => this.riprendi();
        this.gestoreUI.onMenuPrincipale = () => this.tornaAlMenu();
        this.gestoreUI.onGiocaNuovo = () => this.nuovaPartita();

        this.selettoreLivelli.onLivelloSelezionato = (num) => {
            this.caricaLivello(num);
        };

        console.log('🖥️ UI inizializzata');
    }

    inizializzaControlli() {
        // Sistema input
        this.sistemaInput = new SistemaInput(this.scene, this.canvas);

        // Controlli touch per mobile
        if (ControlliTouch.supportaTouch()) {
            this.controlliTouch = new ControlliTouch();

            this.controlliTouch.onDirezione = (dir) => {
                if (this.giocatore) {
                    this.giocatore.setInputDirezione(dir.x, dir.y);
                }
            };

            this.controlliTouch.onSpara = (premuto) => {
                if (premuto && this.gestoreArsenale) {
                    const direzione = this.giocatore?.getDirezioneSparo() || new BABYLON.Vector3(0, 0, 1);
                    this.gestoreArsenale.spara(direzione);
                }
            };

            this.controlliTouch.onSalta = () => {
                if (this.giocatore) {
                    this.giocatore.salta();
                }
            };

            this.controlliTouch.onCambiaArma = () => {
                if (this.gestoreArsenale) {
                    this.gestoreArsenale.ciclaProssimaArma();
                }
            };
        }

        console.log('🎮 Controlli inizializzati');
    }

    inizializzaFX() {
        this.gestoreFX = new GestoreFX(this.scene, this.camera);
        this.gestoreAudio = new GestoreAudio(this.scene);
        this.effettiPost = new EffettiPostProcess(this.scene, this.camera);

        console.log('✨ FX inizializzati');
    }

    registraEntita() {
        // Gestore nemici
        this.gestoreNemici = new GestoreNemici(this.scene, null);

        // Registra tutti i tipi di nemici
        this.gestoreNemici.registraNemico('ZenRobot', ZenRobot);
        this.gestoreNemici.registraNemico('RobotMolla', RobotMolla);
        this.gestoreNemici.registraNemico('ScarabeoScudo', ScarabeoScudo);
        this.gestoreNemici.registraNemico('GranchioMagma', GranchioMagma);
        this.gestoreNemici.registraNemico('DroneMaita', DroneMaita);
        this.gestoreNemici.registraNemico('InvasoreX', InvasoreX);
        this.gestoreNemici.registraNemico('BombardiereElio', BombardiereElio);
        this.gestoreNemici.registraNemico('RazzaNuvola', RazzaNuvola);
        this.gestoreNemici.registraNemico('GolemGeode', GolemGeode);
        this.gestoreNemici.registraNemico('VergineFerro', VergineFerro);
        this.gestoreNemici.registraNemico('StriscianteMelma', StriscianteMelma);
        this.gestoreNemici.registraNemico('ForziereMimo', ForziereMimo);
        this.gestoreNemici.registraNemico('SentinellaPrisma', SentinellaPrisma);
        this.gestoreNemici.registraNemico('FuocoBucoNero', FuocoBucoNero);

        // Gestore arsenale
        this.gestoreArsenale = new GestoreArsenale(this.scene, null);

        // Registra tutte le armi
        this.gestoreArsenale.registraArma('BollaFulmine', BollaFulmine);
        this.gestoreArsenale.registraArma('OndaMareale', OndaMareale);
        this.gestoreArsenale.registraArma('TrivellaPerforante', TrivellaPerforante);
        this.gestoreArsenale.registraArma('TorrenteNapalm', TorrenteNapalm);
        this.gestoreArsenale.registraArma('AncoraGravitazionale', AncoraGravitazionale);
        this.gestoreArsenale.registraArma('CongelaTempo', CongelaTempo);
        this.gestoreArsenale.registraArma('VuotoSingolarita', VuotoSingolarita);
        this.gestoreArsenale.registraArma('DardoElio', DardoElio);
        this.gestoreArsenale.registraArma('CometaRimbalzante', CometaRimbalzante);

        // Sblocca arma iniziale
        this.gestoreArsenale.sbloccaArma('BollaFulmine');
        this.gestoreArsenale.equipaggiaArma('BollaFulmine', 0);

        console.log('👾 Entità registrate');
    }

    avviaGameLoop() {
        this.engine.runRenderLoop(() => {
            if (this.statoCorrente === StatiGioco.GIOCO && !this.inPausa) {
                const deltaTime = this.engine.getDeltaTime() / 1000;
                this.update(deltaTime);
            }

            this.scene.render();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    /**
     * Update principale del gioco
     */
    update(deltaTime) {
        // Aggiorna input
        this.sistemaInput?.update(deltaTime);

        // Aggiorna giocatore
        this.giocatore?.update(deltaTime);

        // Aggiorna bolle
        this.sistemaBolla?.update(deltaTime);

        // Aggiorna nemici
        this.gestoreNemici?.update(deltaTime);

        // Aggiorna arsenale
        this.gestoreArsenale?.update(deltaTime);

        // Controlla collisioni bolle-nemici
        if (this.sistemaBolla) {
            for (const bolla of this.sistemaBolla.bolleAttive) {
                const colpito = this.gestoreNemici?.controllaCollisioneBolla(bolla);
                if (colpito) {
                    this.gestoreFX?.scoppioBolla(bolla.mesh.position);
                    this.gestoreAudio?.riproduciEffetto('bollaScoppio');
                }
            }
        }

        // Aggiorna camera
        this.gestoreCamera?.update(deltaTime);

        // Aggiorna FX
        this.gestoreFX?.update(deltaTime);

        // Aggiorna zone
        if (this.giocatore) {
            this.gestoreZone?.controllaZone(this.giocatore.mesh.position);
        }

        // Aggiorna UI
        this.gestoreUI?.aggiornaHUD();

        // Controlla condizioni vittoria/sconfitta
        this.controllaStatoPartita();
    }

    controllaStatoPartita() {
        // Vittoria: tutti i nemici sconfitti
        if (this.gestoreNemici?.contaNemiciVivi() === 0 &&
            this.statoCorrente === StatiGioco.GIOCO) {
            // Aspetta un secondo prima di dichiarare vittoria
            // (per permettere animazioni)
        }

        // Sconfitta: vite esaurite
        if (this.viteRimaste <= 0 && this.statoCorrente === StatiGioco.GIOCO) {
            this.sconfitta();
        }
    }

    // ==================== CONTROLLO GIOCO ====================

    async nuovaPartita() {
        this.viteRimaste = this.viteMax;
        await this.caricaLivello(1);
    }

    async caricaLivello(numero) {
        console.log(`📍 Caricamento livello ${numero}...`);

        this.statoCorrente = StatiGioco.CARICAMENTO;
        this.livelloCorrente = numero;

        // Pulisci livello precedente
        this.gestoreNemici?.pulisciTutti();
        this.sistemaBolla?.pulisciTutte();

        // Carica dati livello
        const datiLivello = await this.caricatoreLivello.caricaLivello(numero);

        if (!datiLivello) {
            // Crea livello di test
            this.creaLivelloTest();
        } else {
            // Applica dati livello
            this.applicaDatiLivello(datiLivello);
        }

        // Crea giocatore se necessario
        if (!this.giocatore) {
            await this.creaGiocatore();
        } else {
            this.giocatore.reset();
        }

        // Aggiorna riferimenti
        this.gestoreNemici.giocatore = this.giocatore;
        this.gestoreArsenale.giocatore = this.giocatore;

        // Preset visivo bioma
        const bioma = this.ottieniNomeBioma(numero);
        this.effettiPost?.applicaPresetBioma(bioma);
        this.gestoreAudio?.avviaMusica(bioma);

        // Aggiorna UI
        this.gestoreUI?.aggiornaNomeLivello(`Livello ${numero}`);
        this.gestoreUI?.aggiornaVite(this.viteRimaste, this.viteMax);
        this.gestoreUI?.mostraHUD();

        this.statoCorrente = StatiGioco.GIOCO;

        console.log(`✅ Livello ${numero} caricato`);
    }

    async creaGiocatore() {
        this.giocatore = new ControllerDrago(this.scene);
        await this.giocatore.crea();

        this.sistemaBolla = new SistemaBolla(this.scene, this.giocatore);

        // Callback danno giocatore
        this.giocatore.onDanno = (danno) => {
            this.viteRimaste -= danno;
            this.gestoreUI?.aggiornaVite(this.viteRimaste, this.viteMax);
            this.gestoreFX?.creaEffetto('colpo', this.giocatore.mesh.position);
            this.effettiPost?.effettoDanno();
            this.gestoreAudio?.riproduciEffetto('danno');
            this.gestoreCamera?.shake(0.3, 0.2);
        };

        // Callback morte giocatore
        this.giocatore.onMorte = () => {
            this.sconfitta();
        };
    }

    creaLivelloTest() {
        // Pavimento
        const pavimento = BABYLON.MeshBuilder.CreateGround(
            'pavimento',
            { width: 30, height: 30 },
            this.scene
        );

        const matPavimento = new BABYLON.StandardMaterial('mat_pav', this.scene);
        matPavimento.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        pavimento.material = matPavimento;

        new BABYLON.PhysicsAggregate(
            pavimento,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0, friction: 0.8 },
            this.scene
        );

        // Piattaforme
        for (let i = 0; i < 5; i++) {
            const piattaforma = BABYLON.MeshBuilder.CreateBox(
                `piattaforma_${i}`,
                { width: 3, height: 0.5, depth: 3 },
                this.scene
            );
            piattaforma.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 20,
                1 + i * 1.5,
                (Math.random() - 0.5) * 20
            );
            piattaforma.material = matPavimento;

            new BABYLON.PhysicsAggregate(
                piattaforma,
                BABYLON.PhysicsShapeType.BOX,
                { mass: 0 },
                this.scene
            );
        }

        // Spawna nemici test
        const nemiciTest = [
            { tipo: 'ZenRobot', posizione: new BABYLON.Vector3(5, 1, 5) },
            { tipo: 'ZenRobot', posizione: new BABYLON.Vector3(-5, 1, 5) },
            { tipo: 'RobotMolla', posizione: new BABYLON.Vector3(0, 1, 8) },
            { tipo: 'DroneMaita', posizione: new BABYLON.Vector3(0, 5, -5) }
        ];

        this.gestoreNemici.spawnaNemici(nemiciTest);
    }

    applicaDatiLivello(dati) {
        // Implementazione caricamento da JSON
        if (dati.nemici) {
            this.gestoreNemici.spawnaNemici(dati.nemici);
        }

        if (dati.bioma) {
            this.materialiFisici?.applicaBioma(dati.bioma);
        }
    }

    ottieniNomeBioma(numeroLivello) {
        if (numeroLivello <= 10) return 'caverna_primordiale';
        if (numeroLivello <= 20) return 'foresta_cristallo';
        if (numeroLivello <= 30) return 'vulcano_abisso';
        if (numeroLivello <= 40) return 'cielo_tempesta';
        return 'ombra_regno';
    }

    // ==================== STATO GIOCO ====================

    pausa() {
        if (this.statoCorrente !== StatiGioco.GIOCO) return;

        this.inPausa = true;
        this.statoCorrente = StatiGioco.PAUSA;
        this.gestoreAudio?.pausaMusica();
        this.gestoreAudio?.riproduciEffetto('pausa');
    }

    riprendi() {
        if (this.statoCorrente !== StatiGioco.PAUSA) return;

        this.inPausa = false;
        this.statoCorrente = StatiGioco.GIOCO;
        this.gestoreAudio?.riprendiMusica();
    }

    vittoria() {
        this.statoCorrente = StatiGioco.VITTORIA;

        // Calcola ricompense
        const stelle = this.calcolaStelle();
        const ricompense = this.gestoreEconomia?.completaLivello(this.livelloCorrente, stelle);

        // FX
        this.gestoreAudio?.avviaMusica('vittoria');
        this.effettiPost?.effettoLevelUp();

        // UI
        this.gestoreUI?.mostraVittoria(
            ricompense?.oro || 0,
            ricompense?.xp || 0,
            stelle
        );
    }

    sconfitta() {
        this.statoCorrente = StatiGioco.SCONFITTA;

        this.gestoreEconomia?.aggiornaStatistica('mortiTotali');
        this.gestoreAudio?.avviaMusica('sconfitta');
        this.effettiPost?.effettoMorte();

        setTimeout(() => {
            this.gestoreUI?.mostraSconfitta();
        }, 1000);
    }

    tornaAlMenu() {
        this.statoCorrente = StatiGioco.MENU;

        // Pulisci
        this.gestoreNemici?.pulisciTutti();
        this.sistemaBolla?.pulisciTutte();

        // UI
        this.gestoreUI?.nascondiHUD();
        this.gestoreUI?.apriMenuPrincipale();

        // Audio
        this.gestoreAudio?.avviaMusica('menu');
    }

    calcolaStelle() {
        // 3 stelle: vita piena
        // 2 stelle: almeno 50% vita
        // 1 stella: sopravvissuto
        const percentualeVita = this.viteRimaste / this.viteMax;

        if (percentualeVita >= 1) return 3;
        if (percentualeVita >= 0.5) return 2;
        return 1;
    }

    // ==================== PULIZIA ====================

    distruggi() {
        this.gestoreNemici?.distruggi();
        this.gestoreArsenale?.distruggi();
        this.gestoreUI?.distruggi();
        this.controlliTouch?.distruggi();
        this.gestoreFX?.pulisciTutto();
        this.effettiPost?.distruggi();
        this.engine?.dispose();
    }
}

/**
 * Inizializza il gioco
 */
export async function avviaGioco(canvasId = 'renderCanvas') {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        console.error(`Canvas '${canvasId}' non trovato!`);
        return null;
    }

    const gioco = new GiocoBubbleAttack(canvas);
    await gioco.inizializza();

    // Esponi globalmente per debug
    window.gioco = gioco;

    return gioco;
}
