import { boot } from 'quasar/wrappers';
import axios from 'axios';

const hyperion = axios.create({
    baseURL: process.env.HYPERION_ENDPOINT,
});

export default boot(({ app, store }) => {
    app.config.globalProperties.$hyperion = hyperion;
    store.$hyperion = hyperion;
});

export { hyperion };
