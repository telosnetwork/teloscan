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
    app.config.globalProperties.$telosApi =  telosApi;
    app.config.globalProperties.$indexerApi = indexerApi;
    app.config.globalProperties.$fragmentParser = fragmentParser;
    store.$contractManager = app.config.globalProperties.$contractManager = markRaw(contractManager);
});

export { telosApi, indexerApi };
