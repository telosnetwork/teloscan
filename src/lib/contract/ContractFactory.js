import Contract from 'src/lib/contract/Contract';
import axios from 'axios';
import { toChecksumAddress } from 'src/lib/utils';

const contractsBucket = axios.create({
    baseURL: `https://${process.env.VERIFIED_CONTRACTS_BUCKET}.s3.amazonaws.com`,
});


export default class ContractFactory {

    async checkBucket(address) {
        let checksumAddress = toChecksumAddress(address);
        try {
            let responseData = (await contractsBucket.get(`${checksumAddress}/metadata.json`)).data;
            return JSON.parse(responseData.content);
        } catch (e) {
            // console.log(e); Don't print, it is expected files will be 404 for unverified contracts
            return false;
        }
    }
    async buildContract(data) {
        if(!data || !data.address){
            return;
        }
        let verified = false;
        data.abi = data.metadata;
        if(data.abi){
            verified = true;
        }
        let properties = JSON.parse(data.calldata);
        if(!data.name){
            if(properties?.name){
                data.name = properties.name;
            } else if(data.metadata) {
                let metadata = JSON.parse(data.metadata);
                if(metadata?.settings?.compilationTarget){
                    data.name = Object.values(metadata?.settings?.compilationTarget)[0];
                }
            }
        }
        const contract = new Contract({
            address: data.address,
            name: data.name,
            verified: verified,
            creationInfo: {
                creator: data.creator,
                transaction: data.transaction,
                block: data.block,
            },
            type: null,
            supportedInterfaces: data.supportedInterfaces,
            properties: properties,
            nfts: {},
            abi: data.abi | undefined,
        });
        return contract;
    }
    async buildEmptyContract(address) {
        const contract = new Contract({
            address: address,
            name: `0x${address.slice(0, 16)}...`,
            verified: false,
            creationInfo: {
                creator: null,
                transaction: null,
                block: null,
            },
            type: null,
            properties: {},
            nfts: {},
            abi: undefined,
        });
        return contract;
    }
}
