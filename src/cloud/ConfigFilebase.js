/**
 * BUBBLE ATTACK - Configurazione Filebase
 * 
 * Questo file contiene le credenziali per il bucket Filebase.
 * NON COMMITTARE questo file! Usa ConfigFilebase.local.js per le credenziali reali.
 * 
 * Filebase usa un'API compatibile S3, quindi possiamo usare
 * gli stessi metodi di AWS S3.
 */

// Configurazione template (sostituire con valori reali)
export const FILEBASE_CONFIG = {
    // Endpoint Filebase S3-compatibile
    endpoint: 'https://s3.filebase.com',

    // Regione (sempre us-east-1 per Filebase)
    region: 'us-east-1',

    // Nome del bucket per i livelli
    bucket: 'INSERISCI_NOME_BUCKET',

    // Credenziali (da inserire)
    credentials: {
        accessKeyId: 'INSERISCI_ACCESS_KEY',
        secretAccessKey: 'INSERISCI_SECRET_KEY'
    },

    // Percorsi nel bucket
    paths: {
        livelli: 'livelli/',
        assets: 'assets/',
        salvataggi: 'salvataggi/'
    },

    // URL pubblico per accesso diretto (opzionale)
    publicUrl: null  // es. 'https://mio-bucket.s3.filebase.com'
};

/**
 * Verifica se le credenziali sono state configurate
 */
export function isConfigurato() {
    return FILEBASE_CONFIG.credentials.accessKeyId !== 'INSERISCI_ACCESS_KEY' &&
        FILEBASE_CONFIG.bucket !== 'INSERISCI_NOME_BUCKET';
}

/**
 * Ottieni URL completo per un file nel bucket
 */
export function getFileUrl(percorso) {
    if (FILEBASE_CONFIG.publicUrl) {
        return `${FILEBASE_CONFIG.publicUrl}/${percorso}`;
    }
    return `${FILEBASE_CONFIG.endpoint}/${FILEBASE_CONFIG.bucket}/${percorso}`;
}
