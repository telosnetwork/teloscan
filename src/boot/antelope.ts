import { boot } from 'quasar/wrappers';
import { initAntelope } from 'src/antelope/wallets/init';


export default boot(({ app }) => {
    initAntelope(app);
});



