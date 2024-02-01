import { boot } from 'quasar/wrappers';
import axios from 'axios';
import ContractManager from 'src/lib/contract/ContractManager';
import FragmentParser from 'src/lib/contract/FragmentParser';
import { markRaw } from 'vue';

const telosApi = axios.create({
    baseURL: process.env.TELOS_API_ENDPOINT,
});
const indexerApi = axios.create({
    baseURL: process.env.INDEXER_API_ENDPOINT,
});
const hyperion = axios.create({
    baseURL: process.env.NETWORK_EVM_ENDPOINT,
});

const fragmentParser = new FragmentParser(hyperion);
const contractManager = new ContractManager(indexerApi, fragmentParser);

export default boot(({ app, store }) => {
    app.config.globalProperties.$telosApi = telosApi;
    app.config.globalProperties.$indexerApi = indexerApi;
    app.config.globalProperties.$fragmentParser = fragmentParser;
    app.config.globalProperties.$contractManager = contractManager;
    store.$contractManager = markRaw(contractManager);
    store.$indexerApi = indexerApi;
    // Intercept API answer to set contracts & abi in cache directly
    indexerApi.interceptors.response.use((response) => {
        if (response.data?.abi?.length > 0) {
            for (const [key, value] of Object.entries(response.data.abi)) {
                app.config.globalProperties.$contractManager.parser.addFunctionInterface(key, value);
                app.config.globalProperties.$fragmentParser.addFunctionInterface(key, value);
            }
        }
        if (response.data?.contracts) {
            app.config.globalProperties.$contractManager.addContractsToCache(response.data.contracts);
        }
        return response;
    }, error => Promise.reject(error));
});

export { contractManager, telosApi, indexerApi };
