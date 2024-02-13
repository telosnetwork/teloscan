import axios from 'axios';

const compilerVersionEndpoint =
    'https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/emscripten-wasm32/list.json';

const getCompilerOptions = async () => {
    const results = await axios.get(compilerVersionEndpoint);
    const compilerList = parseCompilerList(results.data.builds);
    return compilerList;
};

const parseCompilerList = (buildArray) => {
    const versionStringArr = [];
    for (let build of buildArray){
        versionStringArr.unshift(`v${build.longVersion}`);
    }
    return versionStringArr;
};

export { getCompilerOptions };
