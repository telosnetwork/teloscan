/* eslint-disable max-len */
import { erc1155Abi, erc20Abi, erc721Abi } from 'src/antelope/wallets/utils/abi';
import EvmContract from 'src/antelope/wallets/utils/contracts/EvmContract';
import { AntelopeError, EvmContractCalldata, EvmContractMetadata, EvmContractFactoryData } from 'src/antelope/types';

export default class EvmContractFactory {
    buildContract(data: EvmContractFactoryData): EvmContract {
        if (!data || !data.address) {
            throw new AntelopeError('antelope.contracts.contract_data_required');
        }

        let verified = false;
        if (typeof data.abi !== 'undefined' && data.abi.length > 0) {
            data.abi = (typeof data.abi === 'string') ? JSON.parse(data.abi) : data.abi;
        } else if (typeof data.metadata !== 'undefined' && data.metadata?.length > 0) {
            const metadata: EvmContractMetadata = JSON.parse(data.metadata);
            data.abi = metadata?.output?.abi;
        }
        if (data.abi) {
            verified = true;
        } else if (data.supportedInterfaces && data.supportedInterfaces.includes('erc20')) {
            data.abi = erc20Abi;
        } else if (data.supportedInterfaces && data.supportedInterfaces.includes('erc721')) {
            data.abi = erc721Abi;
        } else if (data.supportedInterfaces && data.supportedInterfaces.includes('erc1155')) {
            data.abi = erc1155Abi;
        }

        const properties: EvmContractCalldata = (data.calldata) ? JSON.parse(data.calldata) : {};

        if (!data.name) {
            if (properties?.name){
                data.name = properties.name;
            } else if (data.metadata) {
                const metadata: EvmContractMetadata = JSON.parse(data.metadata);

                if(metadata?.settings?.compilationTarget){
                    data.name = Object.values(metadata?.settings?.compilationTarget)[0];
                }
            }
        }
        const abi = typeof data.abi === 'string' ? JSON.parse(data.abi) : data.abi;

        return new EvmContract({
            address: data.address,
            name: data.name ?? '',
            verified: verified,
            creationInfo: {
                creator: data.creator,
                transaction: data.transaction ?? '',
                creation_trx: data.transaction ?? '',
                block: data.block,
                block_num: data.block,
                timestamp: data.timestamp ?? '',
                abi: data.abi,
            },
            supportedInterfaces: data.supportedInterfaces ?? [],
            abi,
            properties,
            manager: data.manager,
        });
    }
}
