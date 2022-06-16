import axios from 'axios';

const telosApi = axios.create({
    baseURL: process.env.TELOS_API_ENDPOINT,
});

const teloscanApi = axios.create({
    baseURL: process.env.TELOSCAN_API_ENDPOINT,
});

export default ({ Vue }) => {
    Vue.prototype.$telosApi = telosApi;
    Vue.prototype.$teloscanApi = teloscanApi;
};

export { telosApi, teloscanApi };
