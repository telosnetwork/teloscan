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
const exportApi = axios.create({
    baseURL: process.env.EXPORT_API_ENDPOINT,
});
const hyperion = axios.create({
    baseURL: process.env.NETWORK_EVM_ENDPOINT,
});

const fragmentParser = new FragmentParser(hyperion);
let contractManager = new ContractManager(indexerApi, fragmentParser);


export default boot(({ app, store }) => {
    app.config.globalProperties.$telosApi =  telosApi;
    app.config.globalProperties.$indexerApi = indexerApi;
    app.config.globalProperties.$exportApi = exportApi;
    app.config.globalProperties.$fragmentParser = fragmentParser;
    store.$contractManager = app.config.globalProperties.$contractManager = markRaw(contractManager);
    store.$indexerApi = indexerApi;
    store.$exportApi = exportApi;
    // Intercept API answer to set contracts & abi in cache directly
    indexerApi.interceptors.response.use(function (response) {
        if(response.data?.abi?.length > 0){
            for (const [key, value] of Object.entries(response.data.abi)) {
                app.config.globalProperties.$contractManager.parser.addFunctionInterface(key, value);
                app.config.globalProperties.$fragmentParser.addFunctionInterface(key, value);
            }
        }
        if(response.data?.contracts){
            app.config.globalProperties.$contractManager.addContractsToCache(response.data.contracts);
        }
        return response;
    }, function (error) {
        return Promise.reject(error);
    });

});

export { telosApi, indexerApi, exportApi, contractManager, fragmentParser };
