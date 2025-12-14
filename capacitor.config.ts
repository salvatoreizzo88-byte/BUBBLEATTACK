import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.bubbleattack.game',
    appName: 'Bubble Attack',
    webDir: 'www',
    server: {
        // Per development locale, commenta in produzione
        // url: 'http://localhost:3000',
        cleartext: true
    },
    ios: {
        // Configurazione specifica iOS
        contentInset: 'automatic',
        allowsLinkPreview: false,
        scrollEnabled: false,
        // Permetti fullscreen senza status bar
        preferredContentMode: 'mobile'
    },
    plugins: {
        // Configurazione plugin (da aggiungere in futuro)
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#1a0033',
            showSpinner: false
        }
    }
};

export default config;
