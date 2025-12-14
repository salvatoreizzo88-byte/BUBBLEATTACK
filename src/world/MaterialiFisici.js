/**
 * BUBBLE ATTACK - Materiali Fisici
 * 
 * Gestisce i preset dei materiali fisici per ogni bioma.
 * Include attrito, rimbalzo e proprietà speciali per superfici diverse.
 */

// Tipi di materiale disponibili
export const TipoMateriale = {
    STANDARD: 'standard',
    GHIACCIO: 'ghiaccio',
    MELMA: 'melma',
    RESPINGENTE: 'respingente',
    MAGMA: 'magma',
    METALLO: 'metallo',
    CRISTALLO: 'cristallo',
    NEBBIA: 'nebbia',
    VUOTO: 'vuoto',
    ENERGIA: 'energia',
    SABBIA: 'sabbia',
    LEGNO: 'legno',
    GOMMA: 'gomma'
};

// Preset materiali fisici per biomi
export const PresetMateriali = {
    [TipoMateriale.STANDARD]: {
        nome: 'Standard',
        attrito: 0.5,
        rimbalzo: 0.0,
        descrizione: 'Superficie standard - buon grip, nessun rimbalzo',
        biomi: ['caverna_primordiale', 'tutorial']
    },
    [TipoMateriale.GHIACCIO]: {
        nome: 'Ghiaccio',
        attrito: 0.05,
        rimbalzo: 0.1,
        descrizione: 'Superficie scivolosa - il giocatore slitta',
        biomi: ['grotta_cristallo'],
        effettiSpeciali: {
            slittamento: true,
            frenataRidotta: 0.2  // Il 20% della frenata normale
        }
    },
    [TipoMateriale.MELMA]: {
        nome: 'Melma',
        attrito: 2.0,
        rimbalzo: 0.0,
        descrizione: 'Superficie appiccicosa - movimento lento',
        biomi: ['foresta_fungina'],
        effettiSpeciali: {
            rallentamento: 0.5,  // 50% della velocità
            saltoRidotto: 0.7
        }
    },
    [TipoMateriale.RESPINGENTE]: {
        nome: 'Respingente',
        attrito: 0.5,
        rimbalzo: 1.5,
        descrizione: 'Superficie elastica - alto rimbalzo',
        biomi: ['foresta_fungina', 'boss'],
        effettiSpeciali: {
            superSalto: true,
            moltiplicatoreSalto: 1.5
        }
    },
    [TipoMateriale.MAGMA]: {
        nome: 'Magma',
        attrito: 0.8,
        rimbalzo: 0.0,
        descrizione: 'Superficie calda - causa danno continuo',
        biomi: ['fonderia_magma'],
        effettiSpeciali: {
            dannoContatto: 5,  // DPS
            tipoDanno: 'fuoco'
        }
    },
    [TipoMateriale.METALLO]: {
        nome: 'Metallo',
        attrito: 0.6,
        rimbalzo: 0.3,
        descrizione: 'Superficie metallica - conduce elettricità',
        biomi: ['guglia_meccanica', 'cyber_grid'],
        effettiSpeciali: {
            conduceElettricita: true,
            suonoPasso: 'metallo'
        }
    },
    [TipoMateriale.CRISTALLO]: {
        nome: 'Cristallo',
        attrito: 0.3,
        rimbalzo: 0.4,
        descrizione: 'Superficie cristallina - leggermente scivolosa e riflettente',
        biomi: ['grotta_cristallo'],
        effettiSpeciali: {
            trasparente: true,
            riflessione: 0.5
        }
    },
    [TipoMateriale.NEBBIA]: {
        nome: 'Nebbia',
        attrito: 0.3,
        rimbalzo: 0.5,
        descrizione: 'Superficie nebulosa - bassa resistenza',
        biomi: ['deriva_nebulare'],
        effettiSpeciali: {
            breviLevitazione: true,
            gravitaRidotta: 0.5
        }
    },
    [TipoMateriale.VUOTO]: {
        nome: 'Vuoto',
        attrito: 0.3,
        rimbalzo: 0.0,
        descrizione: 'Superficie eterea - può scomparire',
        biomi: ['il_vuoto'],
        effettiSpeciali: {
            instabile: true,
            tempoDiScomparsa: 2  // secondi dopo contatto
        }
    },
    [TipoMateriale.ENERGIA]: {
        nome: 'Energia',
        attrito: 0.5,
        rimbalzo: 0.5,
        descrizione: 'Superficie energetica - aumenta velocità',
        biomi: ['cyber_grid'],
        effettiSpeciali: {
            boostVelocita: 1.5,
            durataBoost: 2  // secondi
        }
    },
    [TipoMateriale.SABBIA]: {
        nome: 'Sabbia',
        attrito: 0.8,
        rimbalzo: 0.0,
        descrizione: 'Superficie sabbiosa - rallenta leggermente',
        biomi: ['picco_drago'],
        effettiSpeciali: {
            rallentamento: 0.8
        }
    },
    [TipoMateriale.LEGNO]: {
        nome: 'Legno',
        attrito: 0.6,
        rimbalzo: 0.1,
        descrizione: 'Superficie in legno - grip normale',
        biomi: ['foresta_fungina'],
        effettiSpeciali: {
            infiammabile: true
        }
    },
    [TipoMateriale.GOMMA]: {
        nome: 'Gomma',
        attrito: 0.9,
        rimbalzo: 0.8,
        descrizione: 'Superficie gommosa - alto grip e rimbalzo',
        biomi: ['tutorial', 'boss'],
        effettiSpeciali: {
            assorbeImpatto: true
        }
    }
};

// Mappatura bioma -> materiale default
export const MaterialiBioma = {
    'caverna_primordiale': TipoMateriale.STANDARD,
    'foresta_fungina': TipoMateriale.MELMA,
    'guglia_meccanica': TipoMateriale.METALLO,
    'grotta_cristallo': TipoMateriale.GHIACCIO,
    'deriva_nebulare': TipoMateriale.NEBBIA,
    'fonderia_magma': TipoMateriale.MAGMA,
    'cyber_grid': TipoMateriale.ENERGIA,
    'il_vuoto': TipoMateriale.VUOTO,
    'palazzo_escher': TipoMateriale.CRISTALLO,
    'picco_drago': TipoMateriale.STANDARD
};

export class GestoreMaterialiFisici {
    constructor(scene) {
        this.scene = scene;

        // Cache dei materiali creati
        this.materialiCreati = new Map();

        // Materiale corrente del bioma
        this.materialeCorrente = TipoMateriale.STANDARD;

        // Materiali visuali per debug
        this.materialiVisuali = new Map();
        this.mostraDebug = false;
    }

    /**
     * Ottieni le proprietà fisiche di un materiale
     */
    ottieniProprietaMateriale(tipoMateriale) {
        const preset = PresetMateriali[tipoMateriale];
        if (!preset) {
            console.warn(`Materiale sconosciuto: ${tipoMateriale}, uso standard`);
            return PresetMateriali[TipoMateriale.STANDARD];
        }
        return preset;
    }

    /**
     * Ottieni il materiale default per un bioma
     */
    ottieniMaterialeBioma(idBioma) {
        return MaterialiBioma[idBioma] || TipoMateriale.STANDARD;
    }

    /**
     * Applica materiale fisico a una mesh
     */
    applicaMateriale(mesh, tipoMateriale) {
        const proprieta = this.ottieniProprietaMateriale(tipoMateriale);

        // Ottieni l'aggregato fisico se esiste
        const aggregato = mesh.physicsBody;
        if (aggregato) {
            // Imposta attrito e rimbalzo
            aggregato.setFriction(proprieta.attrito);
            aggregato.setRestitution(proprieta.rimbalzo);
        }

        // Salva il tipo di materiale nella mesh
        if (!mesh.metadata) mesh.metadata = {};
        mesh.metadata.materialeFisico = tipoMateriale;
        mesh.metadata.effettiSpeciali = proprieta.effettiSpeciali || {};

        // Applica materiale visuale di debug se attivo
        if (this.mostraDebug) {
            mesh.material = this.ottieniMaterialeVisuale(tipoMateriale);
        }

        return proprieta;
    }

    /**
     * Crea aggregato fisico con materiale specifico
     */
    creaAggregatoConMateriale(mesh, tipoForma, tipoMateriale, opzioniExtra = {}) {
        const proprieta = this.ottieniProprietaMateriale(tipoMateriale);

        const opzioniFisiche = {
            mass: opzioniExtra.massa || 0,
            friction: proprieta.attrito,
            restitution: proprieta.rimbalzo,
            ...opzioniExtra
        };

        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            tipoForma,
            opzioniFisiche,
            this.scene
        );

        // Salva metadata
        if (!mesh.metadata) mesh.metadata = {};
        mesh.metadata.materialeFisico = tipoMateriale;
        mesh.metadata.effettiSpeciali = proprieta.effettiSpeciali || {};

        return aggregato;
    }

    /**
     * Ottieni materiale visuale per debug
     */
    ottieniMaterialeVisuale(tipoMateriale) {
        if (this.materialiVisuali.has(tipoMateriale)) {
            return this.materialiVisuali.get(tipoMateriale);
        }

        const materiale = new BABYLON.StandardMaterial(
            `matFisico_${tipoMateriale}`,
            this.scene
        );

        // Colori per tipo
        switch (tipoMateriale) {
            case TipoMateriale.GHIACCIO:
                materiale.diffuseColor = new BABYLON.Color3(0.7, 0.9, 1);
                materiale.specularColor = new BABYLON.Color3(1, 1, 1);
                materiale.alpha = 0.7;
                break;
            case TipoMateriale.MELMA:
                materiale.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
                materiale.specularColor = new BABYLON.Color3(0.3, 0.8, 0.3);
                break;
            case TipoMateriale.RESPINGENTE:
                materiale.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
                materiale.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0);
                break;
            case TipoMateriale.MAGMA:
                materiale.diffuseColor = new BABYLON.Color3(1, 0.2, 0);
                materiale.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0);
                break;
            case TipoMateriale.METALLO:
                materiale.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
                materiale.specularColor = new BABYLON.Color3(1, 1, 1);
                break;
            case TipoMateriale.CRISTALLO:
                materiale.diffuseColor = new BABYLON.Color3(0.8, 0.9, 1);
                materiale.alpha = 0.5;
                materiale.specularPower = 128;
                break;
            case TipoMateriale.NEBBIA:
                materiale.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.9);
                materiale.alpha = 0.4;
                break;
            case TipoMateriale.VUOTO:
                materiale.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                materiale.alpha = 0.3;
                break;
            case TipoMateriale.ENERGIA:
                materiale.diffuseColor = new BABYLON.Color3(0, 1, 1);
                materiale.emissiveColor = new BABYLON.Color3(0, 0.5, 0.5);
                break;
            case TipoMateriale.SABBIA:
                materiale.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.5);
                break;
            case TipoMateriale.LEGNO:
                materiale.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
                break;
            case TipoMateriale.GOMMA:
                materiale.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                materiale.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
                break;
            default:  // STANDARD
                materiale.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        }

        this.materialiVisuali.set(tipoMateriale, materiale);
        return materiale;
    }

    /**
     * Gestisci effetti speciali quando il giocatore tocca una superficie
     */
    gestisciContattoSuperficie(mesh, giocatore, deltaTime) {
        if (!mesh.metadata || !mesh.metadata.effettiSpeciali) return null;

        const effetti = mesh.metadata.effettiSpeciali;
        const risultato = {};

        // Rallentamento
        if (effetti.rallentamento) {
            risultato.moltiplicatoreVelocita = effetti.rallentamento;
        }

        // Salto ridotto
        if (effetti.saltoRidotto) {
            risultato.moltiplicatoreSalto = effetti.saltoRidotto;
        }

        // Super salto
        if (effetti.superSalto) {
            risultato.moltiplicatoreSalto = effetti.moltiplicatoreSalto || 1.5;
        }

        // Boost velocità
        if (effetti.boostVelocita) {
            risultato.moltiplicatoreVelocita = effetti.boostVelocita;
            risultato.durataBoost = effetti.durataBoost || 2;
        }

        // Danno da contatto
        if (effetti.dannoContatto) {
            risultato.danno = effetti.dannoContatto * deltaTime;
            risultato.tipoDanno = effetti.tipoDanno || 'generico';
        }

        // Gravità ridotta
        if (effetti.gravitaRidotta) {
            risultato.moltiplicatoreGravita = effetti.gravitaRidotta;
        }

        // Superficie instabile
        if (effetti.instabile) {
            risultato.instabile = true;
            risultato.tempoDiScomparsa = effetti.tempoDiScomparsa || 2;
        }

        // Slittamento (ghiaccio)
        if (effetti.slittamento) {
            risultato.slittamento = true;
            risultato.frenataRidotta = effetti.frenataRidotta || 0.2;
        }

        return risultato;
    }

    /**
     * Imposta il materiale default per il bioma corrente
     */
    impostaBiomaCorrente(idBioma) {
        this.materialeCorrente = this.ottieniMaterialeBioma(idBioma);
        console.log(`🌍 Materiale bioma impostato: ${this.materialeCorrente} per ${idBioma}`);
        return this.materialeCorrente;
    }

    /**
     * Ottieni il materiale corrente
     */
    ottieniMaterialeCorrente() {
        return this.materialeCorrente;
    }

    /**
     * Abilita/disabilita visualizzazione debug
     */
    impostaDebug(attivo) {
        this.mostraDebug = attivo;
    }

    /**
     * Ottieni lista di tutti i materiali disponibili
     */
    ottieniListaMateriali() {
        return Object.keys(PresetMateriali).map(tipo => ({
            tipo: tipo,
            ...PresetMateriali[tipo]
        }));
    }

    /**
     * Ottieni statistiche materiale per debug
     */
    ottieniStatisticheMateriale(tipoMateriale) {
        const prop = this.ottieniProprietaMateriale(tipoMateriale);
        return {
            tipo: tipoMateriale,
            nome: prop.nome,
            attrito: prop.attrito,
            rimbalzo: prop.rimbalzo,
            biomi: prop.biomi,
            effetti: Object.keys(prop.effettiSpeciali || {})
        };
    }
}
