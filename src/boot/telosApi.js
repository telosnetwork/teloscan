import axios from 'axios';

const telosApi = axios.create({
    baseURL: process.env.TELOS_API_ENDPOINT,
});

export default ({ Vue }) => {
    Vue.prototype.$telosApi = telosApi;
};

export { telosApi };
