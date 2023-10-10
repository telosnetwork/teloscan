import Contract from 'src/lib/Contract';
import { ethers } from 'ethers';
import functions_overrides from 'src/lib/abi/signature/functions_signatures_overrides.json';
import events_overrides from 'src/lib/abi/signature/events_signatures_overrides.json';
import { Web3 } from 'web3';
import axios from 'axios';
import erc20Abi from 'erc-20-abi';
import { erc721Abi, erc1155Abi, erc721MetadataAbi, supportsInterfaceAbi } from 'src/lib/abi';
import { toChecksumAddress } from 'src/lib/utils';
import { ERC1155_TRANSFER_SIGNATURE } from 'src/lib/abi/signature/transfer_signatures.js';

const contractsBucket = axios.create({
    baseURL: `https://${process.env.VERIFIED_CONTRACTS_BUCKET}.s3.amazonaws.com`,
});

const tokenList = 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';
export default class ContractManager {

    constructor(evmEndpoint) {
        this.tokenList = null;
        this.contracts = {};
        this.functionInterfaces = functions_overrides;
        this.eventInterfaces = events_overrides;
        this.evmEndpoint = evmEndpoint;
        this.web3 = new Web3(process.env.NETWORK_EVM_RPC);
        this.ethersProvider = new ethers.providers.JsonRpcProvider(process.env.NETWORK_EVM_RPC);
    }

    async init() {
        await this.loadTokenList();
    }

    getWeb3Provider() {
        return this.web3;
    }

    getEthersProvider() {
        return this.ethersProvider;
    }
    async getFunctionIface(data) {
        let prefix = data.toLowerCase().slice(0, 10);
        if (Object.prototype.hasOwnProperty.call(this.functionInterfaces, prefix)) {
            return new ethers.utils.Interface([this.functionInterfaces[prefix]]);
        }

        try {
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
    async getEventIface(data) {
        let prefix = data.toLowerCase().slice(0, 10);
        if (Object.prototype.hasOwnProperty.call(this.eventInterfaces, prefix)) {
            return new ethers.utils.Interface([this.eventInterfaces[prefix]]);
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

    async getContractCreation(address) {
        if (!address) {
            return;
        }
        try {
            const v2ContractResponse = await this.evmEndpoint.get(`/v2/evm/get_contract?contract=${address}`);
            return v2ContractResponse.data;
        } catch (e) {
            console.error(e.message);
        }
    }

    // suspectedToken is so we don't try to check for ERC20 info via eth_call unless we think this is a token...
    // this is coming from the token transfer, transactions table & transaction (general + logs tabs) pages where we're
    // looking for a contract based on a token transfer event
    // handles erc721 & erc20 (w/ stubs for erc1155)
    async getContract(address, suspectedToken) {
        if (!address) {
            return;
        }
        const addressLower = address.toLowerCase();

        // Get from already queried contracts, add token data if needed & not present
        // (ie: queried beforehand w/o suspectedToken or a wrong suspectedToken)
        if (this.contracts[addressLower]) {
            if (
                !suspectedToken ||
                this.contracts[addressLower].token && this.contracts[addressLower].token.type === suspectedToken
            ) {
                return this.contracts[addressLower];
            }
        }

        const creationInfo = await this.getContractCreation(addressLower);

        const metadata = await this.checkBucket(address);
        if (metadata) {
            return await this.getVerifiedContract(addressLower, metadata, creationInfo, suspectedToken);
        }

        // TODO: there's some in this list that are not ERC20... they have extra stuff like the Swapin method
        const contract = await this.getContractFromTokenList(address, creationInfo, suspectedToken);
        if (contract) {
            this.contracts[addressLower] = contract;
            return contract;
        }

        if (suspectedToken) {
            const tokenData = await this.getTokenData(address, suspectedToken);
            if (tokenData) {
                return await this.getTokenContract(addressLower, tokenData, creationInfo);
            }
        }

        return await this.getEmptyContract(addressLower, creationInfo);
    }

    async checkBucket(address) {
        let checksumAddress = toChecksumAddress(address);
        try {
            let responseData = (await contractsBucket.get(`${checksumAddress}/metadata.json`)).data;
            return JSON.parse(responseData.content);
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async getVerifiedContract(address, metadata, creationInfo, suspectedType) {
        let token = await this.getToken(address, suspectedType);
        if(token){
            token.type = suspectedType;
            token.address = address;
        }

        const contract = new Contract({
            name: Object.values(metadata.settings.compilationTarget)[0],
            address,
            abi: metadata.output.abi,
            manager: this,
            token: token,
            creationInfo,
            verified: true,
        });
        this.contracts[address] = contract;
        return contract;
    }

    async getTokenContract(address, tokenData, creationInfo) {
        const contract = new Contract({
            name: tokenData.symbol ? `${tokenData.name} (${tokenData.symbol})` : tokenData.name,
            address,
            abi: this.getTokenABI(tokenData.type),
            manager: this,
            creationInfo,
            token: Object.assign({
                address,
            }, tokenData),
        });

        this.contracts[address] = contract;
        return contract;
    }

    async getEmptyContract(address, creationInfo) {
        const contract = new Contract({
            name: `0x${address.slice(0, 16)}...`,
            address,
            creationInfo,
            abi: undefined,
            manager: this,
        });
        this.contracts[address] = contract;
        return contract;
    }

    async supportsInterface(address, iface){
        const contract = new ethers.Contract(address, supportsInterfaceAbi, this.getEthersProvider());
        try {
            return await contract.supportsInterface(iface);
        } catch (e) {
            // Contract does not support interface, not necessarly an error
            return false;
        }
    }

    async isTokenType(address, type){
        if(typeof type === 'undefined'){
            return false;
        } else if(type === 'erc721'){
            if(!await this.supportsInterface(address, '0x80ac58cd')){
                return false;
            }
        } else if(type === 'erc1155') {
            if(!await this.supportsInterface(address, '0xd9b67a26')){
                return false;
            }
        }
        return type;
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

    async getTokenData(address, suspectedType) {
        const type = await this.isTokenType(address, suspectedType);
        if(type === false){
            return;
        }
        const contract = new ethers.Contract(address, this.getTokenABI(type), this.getEthersProvider());
        try {
            let tokenData = {};
            if (type === 'erc20') {
                tokenData.symbol = await contract.symbol();
                tokenData.name = await contract.name();
                tokenData.decimals = await contract.decimals();
            } else if(type === 'erc721'){
                tokenData.symbol = await contract.symbol();
                tokenData.name = await contract.name();
                tokenData.extensions = {
                    metadata: await this.supportsInterface(address, '0x5b5e139f'),
                };
            } else if(type === 'erc1155'){
                tokenData.name = contract.name || contract.address;
                tokenData.extensions = {
                    metadata: await this.supportsInterface(address, '0x0e89341c'),
                };
            }

            tokenData.type = type;
            return tokenData;
        } catch (e) {
            return;
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

    async getToken(address, suspectedType) {
        if (!this.tokenList) {
            await this.loadTokenList();
        }

        let i = this.tokenList.tokens.length;
        while (i--) {
            if (this.tokenList.tokens[i].address.toLowerCase() === address.toLowerCase()) {
                return this.tokenList.tokens[i];
            }
        }
        return await this.getTokenData(address, suspectedType);
    }

    async getContractFromTokenList(address, creationInfo, suspectedType) {
        const token = await this.getToken(address, suspectedType);
        if (token) {
            return new Contract({
                name: `${token.name} (${token.symbol})`,
                address,
                creationInfo,
                abi: this.getTokenABI(token.type),
                manager: this,
                token: Object.assign({
                    address,
                }, token),
            });
        }
    }
}
