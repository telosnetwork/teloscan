/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://quasar.dev/quasar-cli/quasar-conf-js
/* eslint-env node */

require('dotenv').config();
const { nodePolyfills } = require('vite-plugin-node-polyfills');
//const { viteCommonjs } = require('@originjs/vite-plugin-commonjs');
//import esmodule from "vite-plugin-esmodule";
//const esmodule = require('vite-plugin-esmodule');
const commonjs = require('vite-plugin-commonjs');
const env = require('./public/env')(process);


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
        boot: ['ual', 'hyperion', 'i18n', 'api', 'telosApi', 'evm', 'q-component-defaults'],

        // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-css
        css: ['fonts/silka/silka.css', 'app.sass'],

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
            extendViteConf(viteConf) {
                if (!viteConf.build.commonjsOptions) {
                    viteConf.build.commonjsOptions = {};
                }

                viteConf.optimizeDeps = {
                    disabled: false,
                };

                viteConf.build.commonjsOptions.include = [];
                viteConf.build.commonjsOptions.transformMixedEsModules = true;
            },
            vitePlugins: [
                //viteCommonjs(),
                //esmodule([]),
                commonjs(),
                nodePolyfills({
                    // To exclude specific polyfills, add them to this list.
                    exclude: [
                        'fs', // Excludes the polyfill for `fs` and `node:fs`.
                    ],
                    // Whether to polyfill specific globals.
                    globals: {
                        Buffer: true, // can also be 'build', 'dev', or false
                        global: true,
                        process: true,
                    },
                    // Whether to polyfill `node:` protocol imports.
                    protocolImports: true,
                }),
            ],
            // vueRouterBase,
            // vueDevtools,
            // vueOptionsAPI: false,

            // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

            // publicPath: '/',
            // analyze: true,
            // env: {},
            // rawDefine: {}
            // ignorePublicFolder: true,
            // minify: false,
            // polyfillModulePreload: true,
            // distDir

            // extendViteConf (viteConf) {},
            // viteVuePluginOptions: {},

            // vitePlugins: [
            //   [ 'package-name', { ..options.. } ]
            // ]
        },

        // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-devServer
        devServer: {
            https: false,
            open: false, // opens browser window automatically
        },

        // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-framework
        framework: {
            iconSet: 'material-icons', // Quasar icon set
            lang: 'en-US', // Quasar language pack
            config: {},

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
            plugins: ['Notify'],
        },

        // animations: 'all', // --- includes all animations
        // https://quasar.dev/options/animations
        animations: [],

        // https://quasar.dev/quasar-cli/developing-ssr/configuring-ssr
        ssr: {
            pwa: false,
        },

        // https://quasar.dev/quasar-cli/developing-pwa/configuring-pwa
        pwa: {
            workboxMode: 'generateSW', // or 'injectManifest'
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
                        src: 'icons/icon-128x128.png',
                        sizes: '128x128',
                        type: 'image/png',
                    },
                    {
                        src: 'icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'icons/icon-256x256.png',
                        sizes: '256x256',
                        type: 'image/png',
                    },
                    {
                        src: 'icons/icon-384x384.png',
                        sizes: '384x384',
                        type: 'image/png',
                    },
                    {
                        src: 'icons/icon-512x512.png',
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
