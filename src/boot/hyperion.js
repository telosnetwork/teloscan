import axios from "axios";

const hyperion = axios.create({
  baseURL: process.env.HYPERION_ENDPOINT
});

export default ({ Vue, store }) => {
  Vue.prototype.$hyperion = hyperion;
  store.$hyperion = hyperion;
};

export { hyperion };
