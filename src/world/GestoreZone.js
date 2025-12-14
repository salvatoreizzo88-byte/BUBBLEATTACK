/**
 * BUBBLE ATTACK - Gestore Zone
 * 
 * Gestisce le zone trigger del gioco: zone gravità, zone morte,
 * zone vittoria e checkpoint. Ogni zona è un volume invisibile
 * che attiva effetti quando il giocatore entra.
 */

import { TipoGravita } from './GestoreGravita.js';

// Tipi di zone disponibili
export const TipoZona = {
    GRAVITA_LINEARE: 'ZONA_GRAVITA_LINEARE',
    GRAVITA_PUNTO: 'ZONA_GRAVITA_PUNTO',
    GRAVITA_ZERO: 'ZONA_GRAVITA_ZERO',
    PIANO_MORTE: 'PIANO_MORTE',
    ZONA_VITTORIA: 'ZONA_VITTORIA',
    CHECKPOINT: 'CHECKPOINT',
    DANNO: 'ZONA_DANNO',
    GUARIGIONE: 'ZONA_GUARIGIONE',
    TRAMPOLINO: 'TRAMPOLINO',
    TELETRASPORTO: 'TELETRASPORTO'
};

export class GestoreZone {
    constructor(scene, gestoreGravita) {
        this.scene = scene;
        this.gestoreGravita = gestoreGravita;

        // Lista di tutte le zone attive
        this.zone = new Map();  // id -> { mesh, aggregato, config }

        // Contatore per ID univoci
        this.contatoreZone = 0;

        // Zona corrente del giocatore
        this.zonaCorrente = null;

        // Ultimo checkpoint raggiunto
        this.ultimoCheckpoint = null;

        // Callbacks per eventi
        this.callbacks = {
            onMorte: null,
            onVittoria: null,
            onCheckpoint: null,
            onDanno: null
        };

        // Materiale di debug per visualizzare le zone
        this.materialeDebug = this.creaMaterialeDebug();
        this.mostraDebug = false;
    }

    /**
     * Crea il materiale di debug (semi-trasparente)
     */
    creaMaterialeDebug() {
        const materiale = new BABYLON.StandardMaterial('matZonaDebug', this.scene);
        materiale.alpha = 0.3;
        materiale.diffuseColor = new BABYLON.Color3(1, 1, 0);
        materiale.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
        materiale.wireframe = true;
        return materiale;
    }

    /**
     * Crea una zona trigger generica
     */
    creaZona(tipo, posizione, dimensioni, configExtra = {}) {
        const id = `zona_${tipo}_${++this.contatoreZone}`;

        // Crea mesh box invisibile
        const mesh = BABYLON.MeshBuilder.CreateBox(
            id,
            {
                width: dimensioni.x || dimensioni.larghezza || 5,
                height: dimensioni.y || dimensioni.altezza || 5,
                depth: dimensioni.z || dimensioni.profondita || 5
            },
            this.scene
        );

        mesh.position = new BABYLON.Vector3(
            posizione.x || 0,
            posizione.y || 0,
            posizione.z || 0
        );

        mesh.isVisible = this.mostraDebug;
        mesh.isPickable = false;

        if (this.mostraDebug) {
            mesh.material = this.getMaterialePerTipo(tipo);
        }

        // Crea trigger fisico
        const aggregato = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0, isTrigger: true },
            this.scene
        );

        // Abilita callback collisioni
        aggregato.body.setCollisionCallbackEnabled(true);

        // Configurazione della zona
        const config = {
            tipo: tipo,
            ...configExtra
        };

        // Salva metadata sulla mesh
        mesh.metadata = {
            idZona: id,
            tipoZona: tipo,
            config: config
        };

        // Salva nella mappa
        this.zone.set(id, { mesh, aggregato, config });

        console.log(`📍 Zona creata: ${tipo} in (${posizione.x}, ${posizione.y}, ${posizione.z})`);

        return id;
    }

    /**
     * Ottieni materiale colorato per tipo di zona (debug)
     */
    getMaterialePerTipo(tipo) {
        const materiale = new BABYLON.StandardMaterial(`mat_${tipo}`, this.scene);
        materiale.alpha = 0.3;
        materiale.wireframe = true;

        switch (tipo) {
            case TipoZona.GRAVITA_LINEARE:
            case TipoZona.GRAVITA_PUNTO:
            case TipoZona.GRAVITA_ZERO:
                materiale.diffuseColor = new BABYLON.Color3(0, 1, 1);
                materiale.emissiveColor = new BABYLON.Color3(0, 0.5, 0.5);
                break;
            case TipoZona.PIANO_MORTE:
            case TipoZona.DANNO:
                materiale.diffuseColor = new BABYLON.Color3(1, 0, 0);
                materiale.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
                break;
            case TipoZona.ZONA_VITTORIA:
                materiale.diffuseColor = new BABYLON.Color3(0, 1, 0);
                materiale.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
                break;
            case TipoZona.CHECKPOINT:
                materiale.diffuseColor = new BABYLON.Color3(1, 1, 0);
                materiale.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
                break;
            case TipoZona.TRAMPOLINO:
                materiale.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
                materiale.emissiveColor = new BABYLON.Color3(0.5, 0.25, 0);
                break;
            case TipoZona.TELETRASPORTO:
                materiale.diffuseColor = new BABYLON.Color3(1, 0, 1);
                materiale.emissiveColor = new BABYLON.Color3(0.5, 0, 0.5);
                break;
            case TipoZona.GUARIGIONE:
                materiale.diffuseColor = new BABYLON.Color3(0.5, 1, 0.5);
                materiale.emissiveColor = new BABYLON.Color3(0.25, 0.5, 0.25);
                break;
            default:
                materiale.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        }

        return materiale;
    }

    // ==================== CREATORI SPECIFICI ====================

    /**
     * Crea zona che cambia la gravità (lineare)
     */
    creaZonaGravitaLineare(posizione, dimensioni, vettoreGravita, istantanea = false) {
        return this.creaZona(TipoZona.GRAVITA_LINEARE, posizione, dimensioni, {
            vettoreGravita: vettoreGravita,
            istantanea: istantanea
        });
    }

    /**
     * Crea zona con gravità puntiforme (pianeta)
     */
    creaZonaGravitaPunto(posizione, dimensioni, centroGravita, magnitudine = 9.81) {
        return this.creaZona(TipoZona.GRAVITA_PUNTO, posizione, dimensioni, {
            centroGravita: centroGravita,
            magnitudine: magnitudine
        });
    }

    /**
     * Crea zona a gravità zero
     */
    creaZonaGravitaZero(posizione, dimensioni) {
        return this.creaZona(TipoZona.GRAVITA_ZERO, posizione, dimensioni, {});
    }

    /**
     * Crea piano di morte (respawn immediato)
     */
    creaPianoMorte(posizione, dimensioni) {
        return this.creaZona(TipoZona.PIANO_MORTE, posizione, dimensioni, {});
    }

    /**
     * Crea zona vittoria (fine livello)
     */
    creaZonaVittoria(posizione, dimensioni, prossimoLivello = null) {
        return this.creaZona(TipoZona.ZONA_VITTORIA, posizione, dimensioni, {
            prossimoLivello: prossimoLivello
        });
    }

    /**
     * Crea checkpoint
     */
    creaCheckpoint(posizione, dimensioni, idCheckpoint) {
        return this.creaZona(TipoZona.CHECKPOINT, posizione, dimensioni, {
            idCheckpoint: idCheckpoint,
            posizioneRespawn: posizione
        });
    }

    /**
     * Crea zona danno (lava, spine, etc.)
     */
    creaZonaDanno(posizione, dimensioni, dannoPerSecondo, tipoDanno = 'generico') {
        return this.creaZona(TipoZona.DANNO, posizione, dimensioni, {
            dannoPerSecondo: dannoPerSecondo,
            tipoDanno: tipoDanno
        });
    }

    /**
     * Crea zona guarigione
     */
    creaZonaGuarigione(posizione, dimensioni, curaPerSecondo) {
        return this.creaZona(TipoZona.GUARIGIONE, posizione, dimensioni, {
            curaPerSecondo: curaPerSecondo
        });
    }

    /**
     * Crea trampolino (super salto)
     */
    creaTrampolino(posizione, dimensioni, forzaRimbalzo = 20) {
        return this.creaZona(TipoZona.TRAMPOLINO, posizione, dimensioni, {
            forzaRimbalzo: forzaRimbalzo
        });
    }

    /**
     * Crea zona teletrasporto
     */
    creaTeletrasporto(posizione, dimensioni, destinazione) {
        return this.creaZona(TipoZona.TELETRASPORTO, posizione, dimensioni, {
            destinazione: destinazione
        });
    }

    // ==================== GESTIONE EVENTI ====================

    /**
     * Chiamato quando il giocatore entra in una zona
     */
    gestisciEntrataZona(idZona) {
        const zona = this.zone.get(idZona);
        if (!zona) return;

        const { config } = zona;
        this.zonaCorrente = idZona;

        console.log(`🚪 Entrata in zona: ${config.tipo}`);

        switch (config.tipo) {
            case TipoZona.GRAVITA_LINEARE:
                this.gestoreGravita.impostaGravitaLineare(
                    new BABYLON.Vector3(
                        config.vettoreGravita.x,
                        config.vettoreGravita.y,
                        config.vettoreGravita.z
                    ),
                    config.istantanea
                );
                break;

            case TipoZona.GRAVITA_PUNTO:
                this.gestoreGravita.impostaGravitaPunto(
                    new BABYLON.Vector3(
                        config.centroGravita.x,
                        config.centroGravita.y,
                        config.centroGravita.z
                    ),
                    config.magnitudine
                );
                break;

            case TipoZona.GRAVITA_ZERO:
                this.gestoreGravita.impostaGravitaZero();
                break;

            case TipoZona.PIANO_MORTE:
                this.gestisciMorte();
                break;

            case TipoZona.ZONA_VITTORIA:
                this.gestisciVittoria(config.prossimoLivello);
                break;

            case TipoZona.CHECKPOINT:
                this.gestisciCheckpoint(config);
                break;

            case TipoZona.TRAMPOLINO:
                this.gestisciTrampolino(config.forzaRimbalzo);
                break;

            case TipoZona.TELETRASPORTO:
                this.gestisciTeletrasporto(config.destinazione);
                break;
        }
    }

    /**
     * Chiamato quando il giocatore rimane in una zona (per danni/cure continue)
     */
    gestisciPermanenzaZona(idZona, deltaTime) {
        const zona = this.zone.get(idZona);
        if (!zona) return;

        const { config } = zona;

        switch (config.tipo) {
            case TipoZona.DANNO:
                const danno = config.dannoPerSecondo * deltaTime;
                if (this.callbacks.onDanno) {
                    this.callbacks.onDanno(danno, config.tipoDanno);
                }
                break;

            case TipoZona.GUARIGIONE:
                const cura = config.curaPerSecondo * deltaTime;
                if (this.callbacks.onGuarigione) {
                    this.callbacks.onGuarigione(cura);
                }
                break;
        }
    }

    /**
     * Chiamato quando il giocatore esce da una zona
     */
    gestisciUscitaZona(idZona) {
        const zona = this.zone.get(idZona);
        if (!zona) return;

        console.log(`🚪 Uscita da zona: ${zona.config.tipo}`);

        if (this.zonaCorrente === idZona) {
            this.zonaCorrente = null;
        }
    }

    /**
     * Gestisce la morte del giocatore
     */
    gestisciMorte() {
        console.log('💀 MORTE!');

        if (this.callbacks.onMorte) {
            this.callbacks.onMorte(this.ultimoCheckpoint);
        }
    }

    /**
     * Gestisce la vittoria (fine livello)
     */
    gestisciVittoria(prossimoLivello) {
        console.log('🏆 VITTORIA!');

        if (this.callbacks.onVittoria) {
            this.callbacks.onVittoria(prossimoLivello);
        }
    }

    /**
     * Gestisce il checkpoint
     */
    gestisciCheckpoint(config) {
        this.ultimoCheckpoint = {
            id: config.idCheckpoint,
            posizione: config.posizioneRespawn
        };

        console.log(`💾 Checkpoint salvato: ${config.idCheckpoint}`);

        if (this.callbacks.onCheckpoint) {
            this.callbacks.onCheckpoint(config.idCheckpoint);
        }
    }

    /**
     * Gestisce il trampolino (super salto)
     */
    gestisciTrampolino(forza) {
        if (!window.gioco?.controllerDrago) return;

        const drago = window.gioco.controllerDrago;
        const direzioneSu = this.gestoreGravita.ottieniDirezioneSu();

        // Applica impulso verso l'alto
        drago.applicaImpulso(direzioneSu.scale(forza));

        console.log(`🚀 Trampolino! Forza: ${forza}`);
    }

    /**
     * Gestisce il teletrasporto
     */
    gestisciTeletrasporto(destinazione) {
        if (!window.gioco?.controllerDrago) return;

        const drago = window.gioco.controllerDrago;

        // Teletrasporta il giocatore
        drago.teletrasporta(new BABYLON.Vector3(
            destinazione.x,
            destinazione.y,
            destinazione.z
        ));

        console.log(`✨ Teletrasporto a (${destinazione.x}, ${destinazione.y}, ${destinazione.z})`);
    }

    // ==================== UTILITÀ ====================

    /**
     * Imposta callback per eventi
     */
    impostaCallback(tipo, callback) {
        if (this.callbacks.hasOwnProperty(tipo)) {
            this.callbacks[tipo] = callback;
        }
    }

    /**
     * Abilita/disabilita visualizzazione debug
     */
    impostaDebug(attivo) {
        this.mostraDebug = attivo;

        for (const [id, zona] of this.zone) {
            zona.mesh.isVisible = attivo;
            if (attivo) {
                zona.mesh.material = this.getMaterialePerTipo(zona.config.tipo);
            }
        }
    }

    /**
     * Rimuove una zona
     */
    rimuoviZona(idZona) {
        const zona = this.zone.get(idZona);
        if (!zona) return;

        zona.aggregato.dispose();
        zona.mesh.dispose();
        this.zone.delete(idZona);

        console.log(`🗑️ Zona rimossa: ${idZona}`);
    }

    /**
     * Rimuove tutte le zone
     */
    pulisciTutte() {
        for (const [id, zona] of this.zone) {
            zona.aggregato.dispose();
            zona.mesh.dispose();
        }
        this.zone.clear();
        this.zonaCorrente = null;
        this.contatoreZone = 0;

        console.log('🧹 Tutte le zone rimosse');
    }

    /**
     * Ottieni posizione di respawn
     */
    ottieniPosizioneRespawn() {
        if (this.ultimoCheckpoint) {
            return new BABYLON.Vector3(
                this.ultimoCheckpoint.posizione.x,
                this.ultimoCheckpoint.posizione.y + 1,  // Un po' sopra
                this.ultimoCheckpoint.posizione.z
            );
        }

        // Posizione default se nessun checkpoint
        return new BABYLON.Vector3(0, 2, 0);
    }

    /**
     * Controlla se il giocatore è in una zona specifica
     */
    giocatoreInZona(tipoZona) {
        if (!this.zonaCorrente) return false;

        const zona = this.zone.get(this.zonaCorrente);
        return zona && zona.config.tipo === tipoZona;
    }
}
