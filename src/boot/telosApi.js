import { boot } from 'quasar/wrappers';
import axios from 'axios';

const telosApi = axios.create({
    baseURL: process.env.TELOS_API_ENDPOINT,
});
const indexerApi = axios.create({
    baseURL: process.env.INDEXER_API_ENDPOINT,
});

export default boot(({ app }) => {
    app.config.globalProperties.$telosApi =  telosApi;
    app.config.globalProperties.$indexerApi = indexerApi;
});

export { telosApi, indexerApi };
