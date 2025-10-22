// src/plugins/primevue.js
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import DialogService from 'primevue/dialogservice';
import ToastService from 'primevue/toastservice';
import { watch } from 'vue';
import i18n from './i18n';

import ar from '@/plugins/primevueLocale/ar.js';
import en from '@/plugins/primevueLocale/en.js';
import fr from '@/plugins/primevueLocale/fr.js';

const rawLocales = { en, fr, ar };

export function getPrimeVueLocale(locale) {
    return rawLocales[locale] || rawLocales.en;
}

// Define a brand preset based on Aura with a custom primary palette
const BrandPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#E0F7FA',
            100: '#B2EBF2',
            200: '#80DEEA',
            300: '#4DD0E1',
            400: '#26C6DA',
            500: '#00BCD4', // brand primary
            600: '#00ACC1',
            700: '#0097A7',
            800: '#00838F',
            900: '#006064',
            950: '#00363D'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.500}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.600}',
                    activeColor: '{primary.700}'
                }
            },
            dark: {
                primary: {
                    color: '{primary.400}',
                    contrastColor: '{surface.900}',
                    hoverColor: '{primary.300}',
                    activeColor: '{primary.200}'
                }
            }
        }
    }
});

export function setupPrimeVue(app) {
    app.use(PrimeVue, {
        ripple: true,
        locale: getPrimeVueLocale(i18n.global.locale.value),
        theme: {
            preset: BrandPreset,
            options: {
                darkModeSelector: '.app-dark'
            }
        }
    });

    app.use(ToastService);
    app.use(ConfirmationService);
    app.use(DialogService);

    watch(
        () => i18n.global.locale.value,
        (newLocale) => {
            app.config.globalProperties.$primevue.config.locale = getPrimeVueLocale(newLocale);
        }
    );
}
