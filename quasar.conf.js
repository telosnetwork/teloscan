/* eslint-disable @typescript-eslint/no-var-requires */
/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://quasar.dev/quasar-cli/quasar-conf-js
/* eslint-env node */

require('dotenv').config();
const env = require('./env');
const ESLintPlugin = require('eslint-webpack-plugin');
const nodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

module.exports = function(/* ctx */) {
    return {
        // https://quasar.dev/quasar-cli/supporting-ts
        supportTS: {
            tsCheckerConfig: {
                eslint: {
                    enabled: true,
                    files: './src/**/*.{ts,tsx,js,jsx,vue}',
                },
            },
        },

        // https://quasar.dev/quasar-cli/prefetch-feature
        // preFetch: true,

        // app boot file (/src/boot)
        // --> boot files are part of "main.js"
        // https://quasar.dev/quasar-cli/boot-files
        boot: [
            'ual',
            'hyperion',
            'i18n',
            'api',
            'errorHandling',
            'telosApi',
            'evm',
            'q-component-defaults',
            'antelope',
        ],

        // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-css
        css: ['fonts/silka/silka.css', 'app.scss'],

        // https://github.com/quasarframework/quasar/tree/dev/extras
        extras: [
            // 'ionicons-v4',
            // 'mdi-v5',
            'fontawesome-v5',
            // 'eva-icons',
            // 'themify',
            // 'line-awesome',
            // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

            'roboto-font', // optional, you are not bound to it
            'material-icons', // optional, you are not bound to it
        ],

        // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-build
        build: {
            vueRouterMode: 'history', // available values: 'hash', 'history'
            env,
            chainWebpack (chain) {
                chain.plugin('eslint-webpack-plugin')
                    .use(ESLintPlugin, [{ extensions: ['js', 'vue'] }]);
                chain.plugin('node-polyfill').use(nodePolyfillWebpackPlugin);
            },

            scssLoaderOptions: {
                additionalData: '@import "~src/css/global/global-index.scss";',
                sourceMap: false, // prevent issue where changing style in devtools breaks page styles
            },

            // transpile: false,

            // Add dependencies for transpiling with Babel (Array of string/regex)
            // (from node_modules, which are by default not transpiled).
            // Applies only if "transpile" is set to true.
            // transpileDependencies: [],

            // rtl: false, // https://quasar.dev/options/rtl-support
            // preloadChunks: true,
            // showProgress: false,
            // gzip: true,
            // analyze: true,

            // Options below are automatically set depending on the env, set them if you want to override
            // extractCSS: false,
        },

        // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-devServer
        devServer: {
            https: false,
            port: 8080,
            open: false, // opens browser window automatically
        },

        // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-framework
        framework: {
            iconSet: 'material-icons', // Quasar icon set
            lang: 'en-US', // Quasar language pack
            config: {
                brand: {
                    // brand colors
                    primary: '#8B3F98',
                    secondary: '#348DCC',
                    accent: '#73C58F',
                },
            },

            // Possible values for "importStrategy":
            // * 'auto' - (DEFAULT) Auto-import needed Quasar components & directives
            // * 'all'  - Manually specify what to import
            importStrategy: 'auto',

            // For special cases outside of where "auto" importStrategy can have an impact
            // (like functional components as one of the examples),
            // you can manually specify Quasar components/directives to be available everywhere:
            //
            // components: [],
            // directives: [],

            // Quasar plugins
            plugins: ['Notify', 'Dialog'],
        },

        // animations: 'all', // --- includes all animations
        // https://quasar.dev/options/animations
        animations: ['fadeIn', 'fadeOut'],

        // https://quasar.dev/quasar-cli/developing-ssr/configuring-ssr
        ssr: {
            pwa: false,
        },

        // https://quasar.dev/quasar-cli/developing-pwa/configuring-pwa
        pwa: {
            workboxPluginMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
            workboxOptions: {}, // only for GenerateSW
            manifest: {
                name: 'Teloscan',
                short_name: 'Teloscan',
                description: 'Telos EVM Block Explorer',
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#ffffff',
                theme_color: '#027be3',
                icons: [
                    {
                        src: 'branding/telos-scan.png',
                        sizes: '128x128',
                        type: 'image/png',
                    },
                    {
                        src: 'branding/telos-scan.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'branding/telos-scan.png',
                        sizes: '256x256',
                        type: 'image/png',
                    },
                    {
                        src: 'branding/telos-scan.png',
                        sizes: '384x384',
                        type: 'image/png',
                    },
                    {
                        src: 'branding/telos-scan.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
        },

        // Full list of options: https://quasar.dev/quasar-cli/developing-cordova-apps/configuring-cordova
        cordova: {
            // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
        },

        // Full list of options: https://quasar.dev/quasar-cli/developing-capacitor-apps/configuring-capacitor
        capacitor: {
            hideSplashscreen: true,
        },

        // Full list of options: https://quasar.dev/quasar-cli/developing-electron-apps/configuring-electron
        electron: {
            bundler: 'packager', // 'packager' or 'builder'

            packager: {
                // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
                // OS X / Mac App Store
                // appBundleId: '',
                // appCategoryType: '',
                // osxSign: '',
                // protocol: 'myapp://path',
                // Windows only
                // win32metadata: { ... }
            },

            builder: {
                // https://www.electron.build/configuration/configuration

                appId: 'telos-template',
            },

            // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
            nodeIntegration: true,

            extendWebpack(/* cfg */) {
                // do something with Electron main process Webpack cfg
                // chainWebpack also available besides this extendWebpack
            },
        },
    };
};
