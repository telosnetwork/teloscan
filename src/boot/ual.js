import { UAL } from "universal-authenticator-library";
import { KeycatAuthenticator } from "@telosnetwork/ual-telos-keycat";
import { Scatter } from "ual-scatter";
import { Wombat } from "ual-wombat";
import { Sqrl } from "@smontero/ual-sqrl";
import { Anchor } from "ual-anchor";

export default async ({ Vue, store }) => {
  const chain = {
    chainId: process.env.NETWORK_CHAIN_ID,
    rpcEndpoints: [
      {
        protocol: process.env.NETWORK_PROTOCOL,
        host: process.env.NETWORK_HOST,
        port: process.env.NETWORK_PORT
      }
    ]
  };

  const authenticators = [
    new KeycatAuthenticator([chain], { appName: process.env.APP_NAME }),
    new Sqrl([chain], { appName: process.env.APP_NAME }),
    new Anchor([chain], { appName: process.env.APP_NAME }),
    new Wombat([chain], { appName: process.env.APP_NAME }),
    new Scatter([chain], { appName: process.env.APP_NAME })
  ];

  const ual = new UAL([chain], "ual", authenticators);
  store["$ual"] = ual;
  Vue.prototype.$ual = ual;
};
