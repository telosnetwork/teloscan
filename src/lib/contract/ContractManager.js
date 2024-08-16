import ContractFactory from 'src/lib/contract/ContractFactory';
import { ethers } from 'ethers';
import axios from 'axios';
import { getTopicHash } from 'src/lib/utils';
import { ERC1155_TRANSFER_SIGNATURE, TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures.js';
import { erc1155Abi, erc721MetadataAbi } from 'src/lib/abi';
import { useChainStore } from 'src/antelope/mocks/ChainStore';
const tokenList = 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';
const systemContractList =
    'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.systemcontractlist.json';

class AddressCacheManager {
    constructor() {
        this.addressesByNetwork = {};
        this.contractInfoByNetwork = {};
        this.maxAddresses = 1000;
        this.loadFromLocalStorage();
    }

    getCurrentNetwork() {
        return useChainStore().currentChain.settings.getNetwork();
    }

    loadFromLocalStorage() {
        const storedAddresses = localStorage.getItem('noContractAddressesByNetwork');
        const storedContractInfo = localStorage.getItem('contractInfoByNetwork');
        if (storedAddresses) {
            this.addressesByNetwork = JSON.parse(storedAddresses);
        }
        if (storedContractInfo) {
            this.contractInfoByNetwork = JSON.parse(storedContractInfo);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('noContractAddressesByNetwork', JSON.stringify(this.addressesByNetwork));
        localStorage.setItem('contractInfoByNetwork', JSON.stringify(this.contractInfoByNetwork));
    }

    addNullAddress(address) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        const network = this.getCurrentNetwork();
        if (!this.addressesByNetwork[network]) {
            this.addressesByNetwork[network] = [];
        }

        if (!this.exists(addressLower)) {
            this.addressesByNetwork[network].push(addressLower);
            if (this.addressesByNetwork[network].length > this.maxAddresses) {
                this.addressesByNetwork[network] = this.addressesByNetwork[network].slice(-this.maxAddresses);
            }
            this.saveToLocalStorage();
        }
    }

    addContractInfo(address, name, symbol = null) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        const network = this.getCurrentNetwork();
        if (!this.contractInfoByNetwork[network]) {
            this.contractInfoByNetwork[network] = {};
        }

        const cached = this.contractInfoByNetwork[network][addressLower];
        if (!cached || !cached.name) {
            const info = symbol ? { name, symbol } : { name };
            this.contractInfoByNetwork[network][addressLower] = info;
            this.saveToLocalStorage();
        }
    }

    exists(address) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        const network = this.getCurrentNetwork();
        return this.addressesByNetwork[network] && this.addressesByNetwork[network].includes(addressLower);
    }

    existsContract(address) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        const network = this.getCurrentNetwork();
        return this.contractInfoByNetwork[network] && this.contractInfoByNetwork[network][addressLower];
    }

    removeAddress(address) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        const network = this.getCurrentNetwork();
        if (this.addressesByNetwork[network]) {
            const index = this.addressesByNetwork[network].indexOf(addressLower);
            if (index !== -1) {
                this.addressesByNetwork[network].splice(index, 1);
                this.saveToLocalStorage();
            }
        }
    }

    getAddresses() {
        const network = this.getCurrentNetwork();
        return this.addressesByNetwork[network] ? [...this.addressesByNetwork[network]] : [];
    }

    getContractInfo(address) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        const network = this.getCurrentNetwork();
        return this.contractInfoByNetwork[network] ? this.contractInfoByNetwork[network][addressLower] : null;
    }

    clearAddresses() {
        const network = this.getCurrentNetwork();
        if (this.addressesByNetwork[network]) {
            this.addressesByNetwork[network] = [];
            this.saveToLocalStorage();
        }
    }

    clearContractInfo() {
        const network = this.getCurrentNetwork();
        if (this.contractInfoByNetwork[network]) {
            this.contractInfoByNetwork[network] = {};
            this.saveToLocalStorage();
        }
    }
}


export default class ContractManager {
    constructor(indexerApi, parser) {
        this.nullContractsManager = new AddressCacheManager();
        this.contracts = {};
        this.processing = [];
        this.parser = parser;
        this.factory = new ContractFactory();
        this.indexerApi = indexerApi;
        this.systemContractList = false;
        this.tokenList = false;
        this.ethersProvider = new ethers.providers.JsonRpcProvider(process.env.NETWORK_EVM_RPC);
    }

    getNetworkContract(address) {
        const network = useChainStore().currentChain.settings.getNetwork();
        if (!this.contracts[network]) {
            this.contracts[network] = {};
        }
        if (this.nullContractsManager.exists(address)) {
            return null;
        }
        return this.contracts[network][address.toLowerCase()];
    }

    setNetworkContract(address, contract) {
        const network = useChainStore().currentChain.settings.getNetwork();
        if (!this.contracts[network]) {
            this.contracts[network] = {};
        }
        this.contracts[network][address.toLowerCase()] = contract;
        if (contract === null) {
            this.nullContractsManager.addNullAddress(address);
        } else {
            this.nullContractsManager.addContractInfo(address, contract.name, contract.properties?.symbol || null);
        }
    }

    getEthersProvider() {
        return this.ethersProvider;
    }
    async getTransfers(raw) {
        if(!raw.logs || raw.logs?.length === 0){
            return [];
        }
        const logs = (typeof raw.logs === 'string') ? JSON.parse(raw.logs) : raw.logs;
        let transfers = [];
        for(let i = 0;i < logs.length; i++){
            const log = logs[i];
            const sig = log.topics[0].slice(0, 10);
            if(TRANSFER_SIGNATURES.includes(sig)){
                const contract = await this.getNetworkContract(log.address);
                if(contract && contract.supportedInterfaces.includes('erc20')){
                    transfers.push({
                        'index': log.logIndex,
                        'address': contract.address,
                        'value': log.data,
                        'decimal': contract.properties?.decimals,
                        'to': getTopicHash(log.topics[1]),
                        'from': getTopicHash(log.topics[2]),
                        'symbol': contract.properties?.symbol,
                    });
                }
            }
        }
        transfers.sort((a, b) => a.index - b.index);
        return transfers;
    }
    async parseContractTransaction(raw, data, contract, transfers) {
        if (data === '0x' || !data || !contract) {
            return false;
        }
        if (contract.getInterface()) {
            try {
                let transaction = await contract.getInterface().parseTransaction({ data });
                if(!transfers){
                    return transaction;
                }
                transaction.transfers = await this.getTransfers(raw);
                return transaction;
            } catch (e) {
                console.warn(`Unable to parse transaction data ${data} using abi for ${contract.address}: ${e}`);
            }
        }
        try {
            const functionIface = await this.parser.getFunctionInterface(data);
            if (functionIface) {
                let transaction = functionIface.parseTransaction({ data });
                if(!transfers){
                    return transaction;
                }
                transaction.transfers = await this.getTransfers(raw);
                return transaction;
            }
        } catch (e) {
            console.warn(`Unable to parse transaction data using abi for ${contract.address}: ${e}`);
        }
    }

    async loadNFTs(contract){
        let address = contract.address.toLowerCase();
        try {
            let response = await this.indexerApi.get(`/contract/${address}/nfts`);
            if(response.data.results?.length > 0){
                for(var i = 0; i < response.data.results.length; i++){
                    let nft = response.data.results[i];
                    this.getNetworkContract(address).nfts[nft['tokenId']] = nft;
                }
                return response.data.results;
            }
        } catch (e) {
            console.info(`Could load NFTs for ${address} from indexer: ${e.message}`);
        }
    }
    async loadNFT(contract, tokenId){
        let address = contract.address.toLowerCase();
        if(!this.getNetworkContract(address)) {
            this.setNetworkContract(address, { 'nfts': [] });
        } else if(this.getNetworkContract(address).nfts[tokenId]){
            return this.getNetworkContract(address).nfts[tokenId];
        }
        try {
            // TODO: change endpoint based on contract interfaces
            let response = await this.indexerApi.get(`/contract/${address}/nfts?tokenId=${tokenId}`);
            if(response.data.results?.length > 0){
                this.getNetworkContract(address).nfts[tokenId] = response.data.results[0];
                return response.data.results[0];
            }
            console.info(`Could load NFT #${tokenId} for ${address} from indexer: no NFT found. Trying fallback...`);
        } catch (e) {
            console.info(`Could load NFT #${tokenId} for ${address} from indexer: ${e.message}, trying fallback...`);
        }

        // If indexer call failed, try a direct RPC call
        // This is to account for possible lag in indexing NFTs
        try {
            let contractInstance = await this.getContractFromAbi(contract.address, erc721MetadataAbi);
            let tokenURI = await contractInstance.tokenURI(tokenId);
            this.getNetworkContract(address).nfts[tokenId] = {
                'id': tokenId,
                'tokenUri': tokenURI,
                'metadata': null,
                'imageCache': null,
            };
            return this.getNetworkContract(address).nfts[tokenId];
        } catch (e) {
            console.error(`Could load NFT #${tokenId} for ${address} from fallback RPC calls: ${e.message}`);
        }
    }

    async loadTokenMetadata(address, token, tokenId){
        if(token.type === 'erc1155'){
            const contract = await this.getContractFromAbi(address, erc1155Abi);
            token.metadata = await contract.uri(tokenId);
        } else {
            const contract = await this.getContractFromAbi(address, erc721MetadataAbi);
            token.metadata = await contract.tokenURI(tokenId);
        }
        token.metadata = token.metadata.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');

        return token;
    }

    getTokenTypeFromLog(log){
        let sig = log.topics[0].substr(0, 10);
        let type = (log.topics.length === 4) ? 'erc721' : 'erc20';
        return (sig === ERC1155_TRANSFER_SIGNATURE) ? 'erc1155' : type;
    }

    addContractToCache(address, contractData){
        if(!address){
            return;
        }
        let index = address.toString().toLowerCase();
        if (contractData === null) {
            this.setNetworkContract(index, null);
            return;
        }
        let contract = this.factory.buildContract(contractData);
        if(
            typeof this.getNetworkContract(index) === 'undefined'
            || contract.abi?.length > 0 && !this.getNetworkContract(index).abi
            || contract.abi?.length > 0 && contract.abi.length > this.getNetworkContract(index).abi?.length
        ){
            this.setNetworkContract(index, contract);
        }
    }

    addContractsToCache(contracts){
        for(const index in contracts){
            // skipping non-real contracts
            if (contracts[index].creator) {
                this.addContractToCache(index, contracts[index]);
            }
        }
    }

    async loadTokenList() {
        const results = await axios.get(tokenList);
        const { tokens } = results.data;
        results.data.tokens = (tokens ?? []).filter(({ chainId }) => chainId === process.env.NETWORK_EVM_CHAIN_ID);

        this.tokenList = results.data || false;
    }

    async getSystemContractsList() {
        if (!this.systemContractList) {
            if (!this.processing['systemcontractlist']) {
                this.processing['systemcontractlist'] = true;
                const results = await axios.get(systemContractList);
                const { contracts } = results.data;
                results.data.contracts = (contracts ?? []).filter(
                    ({ chainId }) => chainId === process.env.NETWORK_EVM_CHAIN_ID)
                ;
                this.systemContractList = results.data || false;
                this.processing['systemcontractlist'] = false;
            } else {
                await new Promise(resolve => setTimeout(resolve, 300));
                return await this.getSystemContractsList();
            }
        }
        return this.systemContractList;
    }

    async getTokenList() {
        if (!this.tokenList) {
            if (!this.processing['tokenlist']) {
                this.processing['tokenlist'] = true;
                await this.loadTokenList();
                this.processing['tokenlist'] = false;
            } else {
                await new Promise(resolve => setTimeout(resolve, 300));
                return await this.getTokenList();
            }
        }
        return this.tokenList;
    }

    getContractInstance(contract, provider) {
        if (!contract.abi){
            console.error('Cannot create contract instance without ABI !');
            return false;
        }

        return new ethers.Contract(contract.address, contract.abi, provider ? provider : this.getEthersProvider());
    }
    async getCachedContract(address) {
        if (address === null || typeof address !== 'string') {
            return;
        }
        const addressLower = address.toLowerCase();
        if (this.contracts[addressLower]) {
            return this.contracts[addressLower];
        }
        return null;
    }
    async getContractDisplayInfo(address) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        let result;
        if (this.nullContractsManager.exists(addressLower)) {
            result = null;
        } else if (this.nullContractsManager.existsContract(addressLower)) {
            result = this.nullContractsManager.getContractInfo(addressLower);
        } else {
            result = await this.getContract(addressLower);
            if (result) {
                result = this.nullContractsManager.getContractInfo(addressLower);
            }
        }
        return result;
    }
    async getContract(address, force) {
        if (address === null || typeof address !== 'string') {
            return;
        }
        const addressLower = address.toLowerCase();

        if (!force && typeof this.getNetworkContract(addressLower) !== 'undefined') {
            return this.getNetworkContract(addressLower);
        }

        if (this.processing.includes(addressLower)) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return await this.getNetworkContract(addressLower);
        }

        this.processing.push(addressLower);
        let contract = null;
        try {
            let response = await this.indexerApi.get(`/contract/${address}?full=true&includeAbi=true`);
            if(response.data?.success && response.data.results.length > 0){
                contract = response.data.results[0];
            }
        } catch (e) {
            console.error(`Could not retrieve contract ${address}: ${e.message}`);
        }
        if(contract === null){
            let index = this.processing.indexOf(addressLower);
            if(index > -1){
                this.processing.splice(index, 1);
            }
            this.addContractToCache(address, null);
            return;
        }
        this.addContractToCache(address, contract);
        let index = this.processing.indexOf(addressLower);
        if(index > -1){
            this.processing.splice(index, 1);
        }
        return this.factory.buildContract(contract);
    }
    async getContractFromAbi(address, abi){
        return new ethers.Contract(address, abi, this.getEthersProvider());
    }
}
