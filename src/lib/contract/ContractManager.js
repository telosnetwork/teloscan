import ContractFactory from 'src/lib/contract/ContractFactory';
import { ethers } from 'ethers';
import axios from 'axios';
import { getTopicHash } from 'src/lib/utils';
import { ERC1155_TRANSFER_SIGNATURE, TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures.js';
import { erc1155Abi, erc721MetadataAbi } from 'src/lib/abi';
import { getCore, useChainStore } from 'src/core';
// const tokenList = 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';
const systemContractList =
    'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.systemcontractlist.json';


class AddressCacheManager {
    constructor() {
        this.contractInfoByNetwork = {};
        this.loadFromLocalStorage();
    }

    getCurrentNetwork() {
        return useChainStore().currentChain.settings.getNetwork();
    }

    loadFromLocalStorage() {
        const storedContractInfo = localStorage.getItem('contractInfoByNetwork');
        if (storedContractInfo) {
            this.contractInfoByNetwork = JSON.parse(storedContractInfo);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('contractInfoByNetwork', JSON.stringify(this.contractInfoByNetwork));
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

    existsContract(address) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        const network = this.getCurrentNetwork();
        return this.contractInfoByNetwork[network] && this.contractInfoByNetwork[network][addressLower];
    }

    getContractInfo(address) {
        const addressLower = typeof address === 'string' ? address.toLowerCase() : '';
        const network = this.getCurrentNetwork();
        return this.contractInfoByNetwork[network] ? this.contractInfoByNetwork[network][addressLower] : null;
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
    }

    getNetworkContract(address) {
        const network = useChainStore().currentChain.settings.getNetwork();
        if (!this.contracts[network]) {
            this.contracts[network] = {};
        }
        return this.contracts[network][address.toLowerCase()] || null;
    }

    getTokenListUrl() {
        return useChainStore().currentChain.settings.getTokenListUrl();
    }

    getSystemContractsListUrl() {
        return useChainStore().currentChain.settings.getSystemContractsListUrl();
    }

    setNetworkContract(address, contract) {
        const network = useChainStore().currentChain.settings.getNetwork();
        if (!this.contracts[network]) {
            this.contracts[network] = {};
        }
        this.contracts[network][address.toLowerCase()] = contract;
        if (contract) {
            this.nullContractsManager.addContractInfo(address, contract.name, contract.properties?.symbol || null);
        }
    }

    async getEthersProvider() {
        return getCore().wallets.getWeb3Provider();
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
            let response = await this.indexerApi.get(`/v1/contract/${address}/nfts`);
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
            let response = await this.indexerApi.get(`/v1/contract/${address}/nfts?tokenId=${tokenId}`);
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
            !this.getNetworkContract(index) && contract?.name
            || contract.abi?.length > 0 && !this.getNetworkContract(index)?.abi
            || contract.abi?.length > 0 && contract.abi.length > (this.getNetworkContract(index)?.abi?.length || 0)
            || !!contract.creationInfo?.creator
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
        const results = await axios.get(this.getTokenListUrl());
        const { tokens } = results.data;
        results.data.tokens = (tokens ?? []).filter(({ chainId }) => +chainId === +useChainStore().currentChain.settings.getChainId());

        this.tokenList = results.data || false;
    }

    async getSystemContractsList() {
        if (!this.systemContractList) {
            if (!this.processing['systemcontractlist']) {
                this.processing['systemcontractlist'] = true;
                const results = await axios.get(systemContractList);
                const { contracts } = results.data;
                results.data.contracts = (contracts ?? []).filter(
                    ({ chainId }) => +chainId === +useChainStore().currentChain.settings.getChainId())
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

    async getContractInstance(contract, provider) {
        if (!contract.abi){
            console.error('Cannot create contract instance without ABI !');
            return false;
        }

        const _provider = provider ? provider : await this.getEthersProvider();
        console.assert(_provider, 'No provider available to create contract instance');
        console.assert(_provider.connection, 'Provider connection not available to create contract instance');
        console.assert(typeof _provider.connection.url === 'string', 'Provider connection url not available to create contract instance');
        return new ethers.Contract(contract.address, contract.abi, _provider);
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
        if (this.nullContractsManager.existsContract(addressLower)) {
            return this.nullContractsManager.getContractInfo(addressLower);
        } else {
            // We are going to always assume that if the address is a contract, it is already in the cache
            // Because the indexer API should always return all involved contracts in a query response
            return null;
        }
    }
    async getContractForced(address) {
        if (address === null || typeof address !== 'string') {
            return;
        }
        const addressLower = address.toLowerCase();

        // if this function is repeatedly called for the same address, wait for the first call to finish
        if (this.processing.includes(addressLower)) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return await this.getNetworkContract(addressLower);
        }

        this.processing.push(addressLower);
        let contract = null;
        try {
            let response = await this.indexerApi.get(`/v1/contract/${address}?full=true&includeAbi=true`);
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
        return this.getContract(address);
    }

    async getContract(address, force) {
        if (address === null || typeof address !== 'string') {
            return null;
        }

        if (force) {
            return await this.getContractForced(address);
        }

        const addressLower = address.toLowerCase();

        const cashedContract = this.getNetworkContract(addressLower);
        if (!force && cashedContract) {
            return cashedContract;
        }

        return null;
    }

    async getContractFromAbi(address, abi){
        return new ethers.Contract(address, abi, await this.getEthersProvider());
    }
}
