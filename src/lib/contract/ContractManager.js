import ContractFactory from 'src/lib/contract/ContractFactory';
import { ethers } from 'ethers';
import axios from 'axios';
import { formatWei, getTopicHash } from 'src/lib/utils';
import { ERC1155_TRANSFER_SIGNATURE, TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures.js';
import { erc721MetadataAbi } from 'src/lib/abi';
const tokenList = 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';

export default class ContractManager {
    constructor(indexerApi, parser) {
        this.contracts = {};
        this.parser = parser;
        this.factory = new ContractFactory();
        this.indexerApi = indexerApi;
        this.ethersProvider = new ethers.providers.JsonRpcProvider(process.env.NETWORK_EVM_RPC);
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
                const contract = await this.getCachedContract(log.address);
                if(contract && contract.supportedInterfaces.includes('erc20')){
                    transfers.push({
                        'value': `${formatWei(log.data, contract.properties?.decimals || 18)}`,
                        'to': getTopicHash(log.topics[1]),
                        'from': getTopicHash(log.topics[2]),
                        'symbol': contract.properties?.symbol,
                    });
                }
            }
        }
        return transfers;
    }
    async parseContractTransaction(raw, data, contract, transfers) {
        if (data === '0x' || data === null || typeof contract === 'undefined') {
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
                console.log(`Failed to parse transaction data ${data} using abi for ${contract.address}: ${e}`);
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
            console.error(`Failed to parse transaction data ${data} using abi for ${contract.address}: ${e}`);
        }
    }

    async loadNFT(contract, tokenId){
        let address = contract.address.toLowerCase();
        if(!this.contracts[address]) {
            this.contracts[address] = { 'nfts': [] };
        } else if(this.contracts[address].nfts[tokenId]){
            return this.contracts[address].nfts[tokenId];
        }
        try {
            let response = await this.indexerApi.get(`/contract/${address}/nfts?tokenId=${tokenId}`);
            if(response.data.results?.length > 0){
                this.contracts[address].nfts[tokenId] = response.data.results[0];
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
            this.contracts[address].nfts[tokenId] = {
                'id': tokenId,
                'tokenUri': tokenURI,
                'metadata': null,
                'imageCache': null,
            };
            return this.contracts[address].nfts[tokenId];
        } catch (e) {
            console.error(`Could load NFT #${tokenId} for ${address} from fallback RPC calls: ${e.message}`);
        }
    }

    getTokenTypeFromLog(log){
        let sig = log.topics[0].substr(0, 10);
        let type = (log.topics.length === 4) ? 'erc721' : 'erc20';
        return (sig === ERC1155_TRANSFER_SIGNATURE) ? 'erc1155' : type;
    }

    addContractToCache(address, contract){
        if(!address){
            return;
        }
        let index = address.toString().toLowerCase();
        if(typeof this.contracts[index] === 'undefined'){
            this.contracts[index] = this.factory.buildContract(contract);
        }
    }

    addContractsToCache(contracts){
        for(const index in contracts){
            this.addContractToCache(index, contracts[index]);
        }
    }

    async loadTokenList() {
        const results = await axios.get(tokenList);
        const { tokens } = results.data;
        results.data.tokens = (tokens ?? []).filter(({ chainId }) => chainId === +process.env.NETWORK_EVM_CHAIN_ID);

        this.tokenList = results.data;
    }

    async getTokenList() {
        if (!this.tokenList) {
            await this.loadTokenList();
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
        const addressLower = address.toLowerCase();
        if (this.contracts[addressLower]) {
            return this.contracts[addressLower];
        }
        return null;
    }
    async getContract(address) {
        if (!address || typeof address !== 'string') {
            return;
        }
        const addressLower = address.toLowerCase();

        if (this.contracts[addressLower]) {
            return this.contracts[addressLower];
        }

        try {
            let response = await this.indexerApi.get(`/contract/${address}?full=true&includeAbi=true`);
            let contract = (response.data?.success) ?
                this.factory.buildContract(response.data.results[0]) :
                this.factory.buildEmptyContract(address)
            ;
            this.addContractToCache(address, contract);
            return contract;
        } catch (e) {
            console.error(`Could not retrieve contract ${address}: ${e.message}`);
        }

        let contract = this.factory.buildEmptyContract(address);
        this.addContractToCache(address, contract);
        return contract;
    }
    async getContractFromAbi(address, abi){
        return new ethers.Contract(address, abi, this.getEthersProvider());
    }
}
