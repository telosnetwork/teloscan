# <img src="https://user-images.githubusercontent.com/6848910/200481962-86642269-3190-4e0a-8afb-52df3912a50b.png" width="25" height="25"/>  Teloscan

Main Net: [teloscan.io](https://www.teloscan.io/) [![Netlify Status](https://api.netlify.com/api/v1/badges/1a750b68-90d9-4e80-8ac9-74084bc475ae/deploy-status)](https://app.netlify.com/sites/teloscan/deploys)

Test Net: [testnet.teloscan.io](https://testnet.teloscan.io/) [![Netlify Status](https://api.netlify.com/api/v1/badges/21a714ec-2847-458f-880e-67ffaf31b89a/deploy-status)](https://app.netlify.com/sites/testnet-teloscan/deploys)

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/telosnetwork/teloscan?url=https://github.com/telosnetwork/teloscan/releases/latest&style=for-the-badge)](https://github.com/telosnetwork/teloscan/releases/latest)

![License](https://img.shields.io/github/license/telosnetwork/teloscan?style=for-the-badge)

## About
Teloscan is the official Telos EVM block explorer. Explore accounts, transactions, and blocks. View and interact with verified contract ABIs. Connect MetaMask wallet to stake TLOS for sTLOS.

## Recent Contributions

![Alt](https://repobeats.axiom.co/api/embed/fbc67fae1abc36c6eff5d717f3840280afd1a109.svg "Repobeats analytics image")


## Installation

### Install yarn package manager
Follow the installation instructions at [classic.yarnpkg.com](https://classic.yarnpkg.com/en/)

### Add Vue and Quasar packages
```bash
yarn global add @vue/cli
yarn global add @quasar/cli
```

### Note regarding Node version from [quasar docs](https://quasar.dev/quasar-cli/installation)

Do not use uneven versions of Node i.e. 13, 15, etc. These versions are not tested with Quasar and often cause issues due to their experimental nature. We highly recommend always using the LTS version of Node.

It is recommended to use Node version 16 if you experience issues running the application with other versions.

Using nvm: `nvm use 16`

### Clone repo
```bash
git clone https://github.com/telosnetwork/teloscan
```

### Install the dependencies
```bash
cd teloscan && yarn
```

### Restore .env file
```bash
cp .env.example .env
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
yarn dev
```

### Lint the files
```bash
yarn lint
```

### Build the app for production
```bash
yarn build
cd dist/ss
quasar serve
```

## Documentation
Testing - [Teloscan Unit Testing](./docs/Testing.md)

Telos - [docs.telos.net](https://docs.telos.net)

Quasar - [quasar.dev](https://quasar.dev/)

Quasar Configuration - [quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js)
