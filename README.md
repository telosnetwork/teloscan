# Telos EVM Explorer

Main Net: [![Netlify Status](https://api.netlify.com/api/v1/badges/1a750b68-90d9-4e80-8ac9-74084bc475ae/deploy-status)](https://app.netlify.com/sites/teloscan/deploys) [https://www.teloscan.io/](https://www.teloscan.io/)  

Test Net: [![Netlify Status](https://api.netlify.com/api/v1/badges/21a714ec-2847-458f-880e-67ffaf31b89a/deploy-status)](https://app.netlify.com/sites/testnet-teloscan/deploys) [https://testnet.teloscan.io/](https://testnet.teloscan.io/)

## Install the dependencies

### Install yarn package manager
Follow the installation instructions at:
https://classic.yarnpkg.com/en/

### Add Vue and Quasar packages
```bash
yarn global add @vue/cli
yarn global add @quasar/cli
```
### Clone this repo to your local machine
### Copy the example .env file to .env
```bash
cp .env.example .env
```
## Prep the environment
From within the ui-template folder:
```bash
yarn
```

## Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

## Lint the files
```bash
yarn run lint
```

## Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).

### More Information
See  [https://quasar.dev](https://quasar.dev/).
