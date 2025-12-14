/**
 * BUBBLE ATTACK - Granchio-Magma
 * 
 * Nemico anfibio che cammina su pareti e soffitti.
 * Immune alla lava, alto attrito.
 * Categoria: Camminatore
 */

import { NemicoBase, TipiNemico, CategorieNemico, StatiNemico } from '../NemicoBase.js';

export class GranchioMagma extends NemicoBase {
    constructor(scene, posizione, opzioni = {}) {
        super(scene, posizione, {
            pattuglia: true,
            rangoPatuglia: opzioni.rangoPatuglia || 6,
            rangoRilevamento: 10,
            rangoAttacco: 2,
            puntiVita: 2,
            colpiPerCattura: 2,
            dannoContatto: 2,
            velocitaMovimento: 4.0,
            puntiUccisione: 220,
            dropOro: { min: 4, max: 10 },
            dropFrutta: 'banana',
            cooldownAttacco: 1.5,
            ...opzioni
        });

        this.tipo = TipiNemico.GRANCHIO_MAGMA;
        this.categoria = CategorieNemico.CAMMINATORE;
        this.nomeVisualizzato = 'Granchio-Magma';

        // Parametri specifici
        this.massa = 1.5;
        this.attrito = 2.0;  // Alto attrito per pareti
        this.rimbalzo = 0;

        // Abilità speciali
        this.immuneLava = true;
        this.puoCamminarePareti = true;
        this.superficieCorrente = 'pavimento';  // pavimento, parete, soffitto
        this.normaleSuperficie = new BABYLON.Vector3(0, 1, 0);

        // Movimento pareti
        this.tempoSuParete = 0;
        this.durataMaxParete = 10;  // Secondi max su parete
    }

    async crea() {
        // Corpo granchio (ellissoide largo)
        this.mesh = BABYLON.MeshBuilder.CreateSphere(
            this.id,
            { diameterX: 1.2, diameterY: 0.6, diameterZ: 0.8 },
            this.scene
        );
        this.mesh.position = this.posizioneIniziale.clone();

        // Chele
        const creaChela = (lato) => {
            const chela = BABYLON.MeshBuilder.CreateBox(
                `${this.id}_chela_${lato}`,
                { width: 0.4, height: 0.3, depth: 0.6 },
                this.scene
            );
            chela.position = new BABYLON.Vector3(lato * 0.7, 0, 0.3);
            chela.rotation.y = lato * 0.3;
            chela.parent = this.mesh;
            return chela;
        };

        const chelaSx = creaChela(-1);
        const chelaDx = creaChela(1);

        // Zampe (4 per lato)
        for (let i = 0; i < 4; i++) {
            const zampaSx = BABYLON.MeshBuilder.CreateCylinder(
                `${this.id}_zampa_sx_${i}`,
                { height: 0.5, diameter: 0.1 },
                this.scene
            );
            zampaSx.position = new BABYLON.Vector3(-0.5, -0.2, -0.2 + i * 0.15);
            zampaSx.rotation.z = Math.PI / 4;
            zampaSx.parent = this.mesh;

            const zampaDx = zampaSx.clone(`${this.id}_zampa_dx_${i}`);
            zampaDx.position.x = 0.5;
            zampaDx.rotation.z = -Math.PI / 4;
            zampaDx.parent = this.mesh;
        }

        // Materiale lavico
        const materiale = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene);
        materiale.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.1);
        materiale.emissiveColor = new BABYLON.Color3(0.4, 0.15, 0.05);
        materiale.specularColor = new BABYLON.Color3(1, 0.5, 0.2);
        this.mesh.material = materiale;

        chelaSx.material = materiale;
        chelaDx.material = materiale;

        // Fisica
        this.creaFisica();

        if (this.pattuglia && this.puntiPattuglia.length === 0) {
            this.generaPuntiPattuglia();
        }

        this.mesh.metadata = {
            tipo: 'nemico',
            classe: 'GranchioMagma',
            istanza: this
        };

        console.log(`🦀 ${this.nomeVisualizzato} creato!`);

        return this;
    }

    update(deltaTime, giocatore) {
        if (!this.vivo || !this.mesh) return;

        // Timer parete
        if (this.superficieCorrente !== 'pavimento') {
            this.tempoSuParete += deltaTime;
            if (this.tempoSuParete >= this.durataMaxParete) {
                this.tornaSuPavimento();
            }
        }

        // Controlla pareti vicine per salirci
        this.controllaParetiVicine();

        super.update(deltaTime, giocatore);
    }

    controllaParetiVicine() {
        if (this.superficieCorrente !== 'pavimento') return;
        if (Math.random() > 0.01) return;  // Raramente controlla

        // Raycast laterali per trovare pareti
        const direzioni = [
            new BABYLON.Vector3(1, 0, 0),
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1)
        ];

        for (const dir of direzioni) {
            const ray = new BABYLON.Ray(this.mesh.position, dir, 1.5);
            const hit = this.scene.pickWithRay(ray, (m) =>
                m !== this.mesh && m.isPickable && !m.name.startsWith('nemico')
            );

            if (hit && hit.hit && hit.getNormal) {
                // Parete trovata! Sali
                this.saliSuParete(hit.getNormal(true, true));
                break;
            }
        }
    }

    saliSuParete(normale) {
        this.superficieCorrente = 'parete';
        this.normaleSuperficie = normale.clone();
        this.tempoSuParete = 0;

        // Ruota il granchio per aderire alla parete
        if (this.mesh) {
            const up = normale;
            const forward = BABYLON.Vector3.Cross(up, BABYLON.Vector3.Right()).normalize();

            // Calcola matrice di rotazione
            const rotMatrix = BABYLON.Matrix.LookAtLH(
                BABYLON.Vector3.Zero(),
                forward,
                up
            ).invert();

            this.mesh.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(rotMatrix);
        }

        // Modifica gravità locale (simula camminata su parete)
        if (this.aggregatoFisico) {
            this.aggregatoFisico.body.setGravityFactor(0);
        }

        console.log(`🦀 ${this.nomeVisualizzato} sale sulla parete!`);
    }

    tornaSuPavimento() {
        this.superficieCorrente = 'pavimento';
        this.normaleSuperficie = new BABYLON.Vector3(0, 1, 0);
        this.tempoSuParete = 0;

        // Ripristina orientamento
        if (this.mesh) {
            this.mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        }

        // Ripristina gravità
        if (this.aggregatoFisico) {
            this.aggregatoFisico.body.setGravityFactor(1);
        }
    }

    /**
     * Override attacco - pinza che afferra
     */
    eseguiAttacco(deltaTime, giocatore) {
        if (!giocatore || this.timerAttacco > 0) return;

        // Movimento chele (animazione semplice)
        const chele = this.mesh.getChildMeshes().filter(m => m.name.includes('chela'));

        chele.forEach(chela => {
            const rotOriginale = chela.rotation.y;

            // Chiudi chele
            chela.rotation.y += (chela.position.x > 0 ? -1 : 1) * 0.5;

            setTimeout(() => {
                if (chela) chela.rotation.y = rotOriginale;
            }, 200);
        });

        this.timerAttacco = this.cooldownAttacco;
    }
}
