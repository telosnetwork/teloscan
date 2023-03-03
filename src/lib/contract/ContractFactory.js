import Contract from 'src/lib/contract/Contract';
import erc20Abi from 'erc-20-abi';
import { erc721Abi, erc1155Abi } from 'src/lib/abi';

export default class ContractFactory {

    getTokenABI(type){
        if(type === 'erc721'){
            return erc721Abi;
        } else if(type === 'erc1155'){
            return erc1155Abi;
        }
        return erc20Abi;
    }
    buildContract(data) {
        if(!data || !data.address){
            return;
        }
        let verified = false;
        if(data.abi) {
            data.abi = JSON.parse(data.abi);
        }
        if(data.metadata) {
            let metadata = JSON.parse(data.metadata);
            data.abi = metadata.output.abi;
        }
        if(data.abi){
            verified = true;
        } else if(data.supportedInterfaces.includes('erc20')) {
            data.abi = erc20Abi;
        } else if(data.supportedInterfaces.includes('erc721')) {
            data.abi = erc721Abi;
        } else if(data.supportedInterfaces.includes('erc1155')) {
            data.abi = erc1155Abi;
        }

        let properties = (data.calldata) ? JSON.parse(data.calldata) : {};
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
        return  new Contract({
            address: data.address,
            name: data.name,
            verified: verified,
            creationInfo: {
                creator: data.creator,
                transaction: data.transaction,
                block: data.block,
            },
            supportedInterfaces: data.supportedInterfaces,
            properties: properties,
            nfts: {},
            abi: data.abi,
        });
    }
    buildEmptyContract(address) {
        const contract = new Contract({
            address: address,
            name: `0x${address.slice(0, 16)}...`,
            verified: false,
            creationInfo: {
                creator: null,
                transaction: null,
                block: null,
            },
            properties: {},
            nfts: {},
            abi: undefined,
        });
        return contract;
    }
}
