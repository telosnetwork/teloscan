import Contract from 'src/lib/Contract';
import { ethers } from 'ethers';
import functions_overrides from './abi/signature/functions_signatures_overrides.json';
import events_overrides from './abi/signature/events_signatures_overrides.json';
import Web3 from 'web3';
import axios from 'axios';
import erc20Abi from 'erc-20-abi';
import erc721Abi from './abi/erc721';
import erc721MetadataAbi from './abi/erc721Metadata';
import supportsInterfaceAbi from './abi/supportsInterface';
import { toChecksumAddress } from './utils';

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
        if (Object.prototype.hasOwnProperty.call(this.functionInterfaces, prefix))
            return new ethers.utils.Interface([this.functionInterfaces[prefix]]);

        try {
            const abiResponse = await this.evmEndpoint.get(`/v2/evm/get_abi_signature?type=function&hex=${prefix}`)
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
            console.error('Loading ERC1155 Metadata not implemented yet')
            return;
        }
        const contract = await this.getContractFromAbi(address, erc721MetadataAbi);
        token.metadata = await contract.tokenURI(tokenId);
        token.metadata = token.metadata.replace('ipfs://', 'https://ipfs.io/ipfs/')
        const response = await axios.get(token.metadata);
        if(response.status === 200){
            token.image = (response.data?.image) ?
                response.data.image.replace('ipfs://', 'https://ipfs.io/ipfs/') :
                response.data?.properties?.image?.description?.replace('ipfs://', 'https://ipfs.io/ipfs/')
            ;
        }
        return token;
    }
    async getEventIface(data) {
        let prefix = data.toLowerCase().slice(0, 10);
        if (Object.prototype.hasOwnProperty.call(this.eventInterfaces, prefix))
            return new ethers.utils.Interface([this.eventInterfaces[prefix]]);

        try {
            const abiResponse = await this.evmEndpoint.get(`/v2/evm/get_abi_signature?type=event&hex=${data}`)
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
        if (!address) return;
        try {
            const v2ContractResponse = await this.evmEndpoint.get(`/v2/evm/get_contract?contract=${address}`)
            return v2ContractResponse.data
        } catch (e) {
            console.error(e.message);
        }
    }

    // suspectedToken is so we don't try to check for ERC20 info via eth_call unless we think this is a token...
    // this is coming from the token transfer & transaction (general + logs tabs) pages where we're looking for a contract based on a token transfer event
    async getContract(address, suspectedToken) {
        if (!address) return;
        const addressLower = address.toLowerCase();

        // Get from already queried contracts, add token data if needed & not present (ie: queried beforehand w/o suspectedToken or a wrong suspectedToken)
        if (this.contracts[addressLower]) {
            if (!suspectedToken || this.contracts[addressLower].token && this.contracts[addressLower].token.type === suspectedToken) {
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
        let tokenData;
        if(token){
            tokenData = await this.getTokenData(address, suspectedType);
            tokenData.type = suspectedType;
        }
        const contract = new Contract({
            name: Object.values(metadata.settings.compilationTarget)[0],
            address,
            abi: metadata.output.abi,
            manager: this,
            token: Object.assign({
                address,
            }, tokenData),
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
            abi: tokenData.type === 'erc721' ?  erc721Abi : erc20Abi,
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
            name: `${address.slice(0, 16)}...`,
            address, creationInfo,
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
            return false;
        }
    }

    async isTokenType(address, type){
        if(type === 'erc721'){
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
            return erc721Abi
        } else if(type === 'erc1155'){
            return erc721Abi
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
            tokenData.name = await contract.name();
            if (!tokenData.name)
                return;

            tokenData.symbol = await contract.symbol();

            if (!tokenData.symbol)
                return;

            tokenData.type = type;

            if (type === 'erc20') {
                tokenData.decimals = await contract.decimals();
            } else if(type === 'erc721'){
                tokenData.iERC721Metadata = await this.supportsInterface(address, '0x5b5e139f')
                //tokenData.iERC721Enumerable = await this.supportsInterface(address, '0x780e9d63')
            }
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
        if (!this.tokenList)
            await this.loadTokenList();

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
                address, creationInfo,
                abi: this.getTokenABI(token.type),
                manager: this,
                token: Object.assign({
                    address,
                }, token),
            });
        }
    }
}
