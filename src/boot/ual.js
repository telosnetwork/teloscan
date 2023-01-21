import { boot } from 'quasar/wrappers';
import { UAL } from 'universal-authenticator-library';
import { Wombat } from 'ual-wombat';
import { Anchor } from 'ual-anchor';

export default boot(async({ app, store }) => {
    const chain = {
        chainId: process.env.NETWORK_CHAIN_ID,
        rpcEndpoints: [
            {
                protocol: process.env.NETWORK_PROTOCOL,
                host: process.env.NETWORK_HOST,
                port: process.env.NETWORK_PORT,
            },
        ],
    };

    const authenticators = [
        new Anchor([chain], { appName: process.env.APP_NAME }),
        new Wombat([chain], { appName: process.env.APP_NAME }),
    ];

    const ual = new UAL([chain], 'ual', authenticators);
    store['$ual'] = ual;
    app.config.globalProperties.$ual = ual;
});
