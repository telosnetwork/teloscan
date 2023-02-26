import ContractFactory from 'src/lib/ContractFactory';
import { ethers } from 'ethers';
import functions_overrides from 'src/lib/abi/signature/functions_signatures_overrides.json';
import events_overrides from 'src/lib/abi/signature/events_signatures_overrides.json';
import erc20Abi from 'erc-20-abi';
import { erc721Abi, erc1155Abi } from 'src/lib/abi';
import { ERC1155_TRANSFER_SIGNATURE } from 'src/lib/abi/signature/transfer_signatures.js';
import { TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures';

export default class ContractManager {
    constructor(evmEndpoint, indexerApi) {
        this.contracts = {};
        this.factory = new ContractFactory();
        this.functionInterfaces = functions_overrides;
        this.eventInterfaces = events_overrides;
        this.evmEndpoint = evmEndpoint;
        this.indexerApi = indexerApi;
        this.ethersProvider = new ethers.providers.JsonRpcProvider(process.env.NETWORK_EVM_RPC);
    }

    getEthersProvider() {
        return this.ethersProvider;
    }

    async addEventInterface(hex, signature){
        if (Object.prototype.hasOwnProperty.call(this.eventInterfaces, hex)) {
            return;
        }
        this.eventInterfaces[hex] = signature;
    }
    async addFunctionInterface(hex, signature){
        if (Object.prototype.hasOwnProperty.call(this.functionInterfaces, hex)) {
            return;
        }
        this.functionInterfaces[hex] = signature;
    }
    async getFunctionInterface(data) {
        let prefix = data.toLowerCase().slice(0, 10);
        if(prefix === '0x'){
            return;
        }
        if (Object.prototype.hasOwnProperty.call(this.functionInterfaces, prefix)) {
            return new ethers.utils.Interface([this.functionInterfaces[prefix]]);
        }

        try {
            // TODO: replace this with ABI cache
            const abiResponse = await this.evmEndpoint.get(`/v2/evm/get_abi_signature?type=function&hex=${prefix}`);
            if (abiResponse) {
                if (!abiResponse.data || !abiResponse.data.text_signature || abiResponse.data.text_signature === '') {
                    console.error(`Unable to find function signature for sig: ${prefix}`);
                    return;
                }
                this.functionInterfaces[prefix] = `function ${abiResponse.data.text_signature}`;
                return new ethers.utils.Interface([this.functionInterfaces[prefix]]);
            }
        } catch (e) {
            console.error(`Error trying to find event signature for function ${prefix}`);
            return;
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
    async getEventIface(data) {
        let prefix = data.toLowerCase().slice(0, 10);
        if (Object.prototype.hasOwnProperty.call(this.eventInterfaces, prefix)) {
            return new ethers.utils.Interface([this.eventInterfaces[prefix]]);
        }
        if(data === '0x'){
            return;
        }
        try {
            const abiResponse = await this.evmEndpoint.get(`/v2/evm/get_abi_signature?type=event&hex=${data}`);
            if (abiResponse) {
                if (!abiResponse.data || !abiResponse.data.text_signature || abiResponse.data.text_signature === '') {
                    console.error(`Unable to find event signature for event: ${data}`);
                    return;
                }

                this.eventInterfaces[data] = `event ${abiResponse.data.text_signature}`;
                return new ethers.utils.Interface([this.eventInterfaces[data]]);
            }
        } catch (e) {
            console.error(`Error trying to find event signature for event ${data}: ${e.message}`);
            return;
        }
    }

    async addContractToCache(address, contract){
        let index = address.toString().toLowerCase();
        if(typeof this.contracts[index] === 'undefined'){
            this.contracts[index] = this.factory.buildContract(contract);
        }
    }

    async addContractsToCache(contracts){
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
            let response = await this.indexerApi.get(`/contract/${address}?full=true`);
            let contract = this.factory.buildContract(response.data.results[0]);
            this.addContractToCache(contract);
            return contract;
        } catch (e) {
            console.error(`Could not retrieve contract ${address}: ${e.message}`);
        }

        let contract = this.factory.buildEmptyContract(address);
        this.addContractToCache(address, contract);
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
            // this functionIface is an interface for a single function
            // signature as discovered via 4bytes.directory...
            const functionIface = await this.getFunctionInterface(data);
            if (functionIface) {
                return functionIface.parseTransaction({ data });
            }
        } catch (e) {
            console.error(`Failed to parse transaction data ${data} using abi for ${contract.address}`);
        }
    }

    formatLog(contract, log, parsedLog){
        if(!parsedLog.signature){
            return log;
        }
        parsedLog.function_signature = log.topics[0].substr(0, 10);
        parsedLog.isTransfer = TRANSFER_SIGNATURES.includes(parsedLog.function_signature);
        parsedLog.logIndex = log.logIndex;
        parsedLog.address = log.address;
        parsedLog.contract = contract;
        parsedLog.name = parsedLog.signature;
        return parsedLog;
    }

    async parseLog(log, contract) {
        if (contract.getInterface()) {
            let parsedLog;
            try {
                parsedLog = contract.getInterface().parseLog(log);
            } catch (e) {
                parsedLog = await this.parseEvent(contract, log);
            }
            parsedLog = this.formatLog(contract, log, parsedLog);
            if(parsedLog.name && parsedLog.eventFragment?.inputs){
                parsedLog.inputs = parsedLog.eventFragment.inputs;
            }
            return parsedLog;
        }

        let parsedLog = await this.parseEvent(contract, log);
        parsedLog = this.formatLog(contract, log, parsedLog);
        if(parsedLog.name && parsedLog.eventFragment?.inputs){
            parsedLog.inputs = parsedLog.eventFragment.inputs;
        }
        parsedLog = this.formatLog(contract, log, parsedLog);
        return parsedLog;
    }

    async parseEvent(contract, log){
        const eventIface = await this.getEventIface(log.topics[0]);
        if (eventIface) {
            try {
                let parsedLog = eventIface.parseLog(log);
                return parsedLog;
            } catch(e) {
                console.log(`Failed to parse log #${log.logIndex} from event interface: ${e.message}`);
            }
        }
        log.function_signature = log.topics[0]?.substr(0, 10);
        return log;
    }
    async getContractFromAbi(address, abi){
        return  new ethers.Contract(address, abi, this.getEthersProvider());
    }
}
