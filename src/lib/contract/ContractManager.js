import ContractFactory from 'src/lib/contract/ContractFactory';
import { ethers } from 'ethers';
import erc20Abi from 'erc-20-abi';
import { erc721Abi, erc1155Abi } from 'src/lib/abi';
import { ERC1155_TRANSFER_SIGNATURE } from 'src/lib/abi/signature/transfer_signatures.js';

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
    async parseContractTransaction(data, contract) {
        if (data === '0x' || data === null) {
            return false;
        }
        if (contract.getInterface()) {
            try {
                return await contract.getInterface().parseTransaction({ data });
            } catch (e) {
                console.log(`Failed to parse transaction data ${data} using abi for ${contract.address}`);
            }
        }
        try {
            const functionIface = await this.parser.getFunctionInterface(data);
            if (functionIface) {
                return functionIface.parseTransaction({ data });
            }
        } catch (e) {
            console.error(`Failed to parse transaction data ${data} using abi for ${contract.address}`);
        }
    }

    async loadNFT(contract, tokenId){
        let address = contract.address.toLowerCase();
        if(this.contracts[address]?.nfts[tokenId]){
            return this.contracts[address].nfts[tokenId];
        }
        try {
            let response = await this.indexerApi.get(`/contract/${address}/nfts?tokenId=${tokenId}`);
            if(this.contracts[address]){
                this.contracts[address].nfts[tokenId] = response.data.results[0];
            }
            return response.data.results[0];
        } catch (e) {
            console.error(`Could load NFT #${tokenId} for ${address}: ${e.message}`);
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
        for(const [key, contract] in contracts){
            this.addContractToCache(key, contract);
        }
    }

    async getContract(address) {
        if (!address || typeof address !== 'string') {
            return;
        }
        const addressLower = address.toLowerCase();

        // Get from cache
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

        let contract = await this.factory.buildEmptyContract(address);
        await this.addContractToCache(address, contract);
        return contract;
    }

    getTokenABI(type){
        if(type === 'erc721'){
            return erc721Abi;
        } else if(type === 'erc1155'){
            return erc1155Abi;
        }
        return erc20Abi;
    }
    async getContractFromAbi(address, abi){
        return  new ethers.Contract(address, abi, this.getEthersProvider());
    }
}
