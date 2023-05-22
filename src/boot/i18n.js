import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import messages from 'src/i18n';

export default boot(({ app }) => {
    // Get user's last chosen language from local storage
    let lastChosenLanguage = localStorage.getItem('language');

    //if not present in local storage then check user browser language
    if(!lastChosenLanguage) {
        lastChosenLanguage = navigator.language.toLowerCase().split(/[_-]+/)[0];
    }
    // Check if the browser language is supported, if not, fall back to 'en-us'
    if(!Object.keys(messages).includes(lastChosenLanguage)) {
        lastChosenLanguage = 'en-us';
    }
    // Create the i18n instance
    const i18n = createI18n({
        locale: lastChosenLanguage,
        fallbackLocale: 'en-us',
        globalInjection: true,
        messages,
    });

    // Set i18n instance on app
    app.use(i18n);


    // Listen for language-changed event
    const setLocale = (newLanguage) => {
        // TODO: investigate if there is a better way to change the language not reloading the page
        i18n.locale = newLanguage;
        i18n.global.setLocaleMessage(newLanguage, messages[newLanguage]);
        app.config.globalProperties.$i18n.locale = newLanguage;
    };

    // Set setLocale and i18n reference available for global access
    app.config.globalProperties.$setLocale = setLocale;
    app.config.globalProperties.$i18n = i18n;
});
