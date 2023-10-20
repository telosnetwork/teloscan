/* eslint-disable max-len */
import { ContractInterface, ethers } from 'ethers';
import { markRaw } from 'vue';
import {
    AntelopeError, EvmContractCalldata,
    EvmABI,
    EvmContractCreationInfo,
    EvmContractConstructorData,
    EvmContractManagerI,
    EvmFormatedLog,
    EvmLog,
    EvmLogs,
    TokenSourceInfo,
    TRANSFER_SIGNATURES,
} from 'src/antelope/types';
import { Interface } from 'ethers/lib/utils';


export default class EvmContract {
    private readonly _name: string;
    private readonly _abi?: EvmABI | null;
    private readonly _address: string;
    private readonly _creationInfo?: EvmContractCreationInfo | null;
    private readonly _interface?: ContractInterface | null;
    private readonly _supportedInterfaces: string[];
    private readonly _properties?: EvmContractCalldata;
    private readonly _manager?: EvmContractManagerI;
    private readonly _token?: TokenSourceInfo | null;

    private _verified?: boolean;

    constructor({
        name,
        abi,
        address,
        creationInfo,
        verified,
        supportedInterfaces = ['none'],
        properties,
        manager,
        token,
    }: EvmContractConstructorData) {
        this._name = name;
        this._address = address;
        this._creationInfo = creationInfo;
        this._verified = verified ?? false;
        this._properties = properties;
        this._manager = manager;

        if (abi) {
            this._abi = typeof abi === 'string' ? JSON.parse(abi) : abi;
            this._interface = markRaw(new ethers.utils.Interface(abi));
        }

        if (token) {
            this._token = token;
        }

        const indexOfNone = supportedInterfaces.indexOf('none');
        this._supportedInterfaces = [];
        for (let i = 0; i < supportedInterfaces.length; i++){
            if (i !== indexOfNone) {
                this._supportedInterfaces.push(supportedInterfaces[i]);
            }
        }
    }


    get name() {
        return this._name;
    }

    get abi() {
        return this._abi;
    }

    get address() {
        return this._address;
    }

    get creationInfo() {
        return this._creationInfo;
    }

    get iface() {
        return this._interface;
    }

    get verified() {
        return this._verified ?? false;
    }

    set verified(verified: boolean) {
        this._verified = verified;
    }

    get supportedInterfaces() {
        return this._supportedInterfaces;
    }

    get creationBlock() {
        return this._creationInfo?.block;
    }

    get creationTrx() {
        return this._creationInfo?.transaction;
    }

    get creator() {
        return this._creationInfo?.creator;
    }

    get properties() {
        return this._properties;
    }

    get token() {
        return this._token;
    }

    isNonFungible() {
        return (this._supportedInterfaces.includes('erc721'));
    }

    isToken() {
        if (this._supportedInterfaces.length === 0) {
            return false;
        }

        return (
            this._supportedInterfaces.includes('erc721') ||
            this._supportedInterfaces.includes('erc1155') ||
            this._supportedInterfaces.includes('erc20')
        );
    }

    async getContractInstance() {
        if (!this.abi){
            throw new AntelopeError('antelope.utils.error_contract_instance');
        }
        const signer = await this._manager?.getSigner();

        return new ethers.Contract(this.address, this.abi, signer);
    }

    async parseTransaction(data:string) {
        if (this.iface && this.iface instanceof Interface) {
            try {
                return await this.iface.parseTransaction({ data });
            } catch (e) {
                console.error(`Failed to parse transaction data ${data} using abi for ${this.address}`);
            }
        } else {
            try {
                // this functionIface is an interface for a single function signature as discovered via 4bytes.directory... only use it for this function
                const functionIface = await this._manager?.getFunctionIface(data);
                if (functionIface) {
                    return functionIface.parseTransaction({ data });
                }
            } catch (e) {
                console.error(`Failed to parse transaction data ${data} using abi for ${this.address}`);
            }
        }
        throw new AntelopeError('antelope.utils.error_parsing_transaction');
    }

    async parseLogs(logs: EvmLogs): Promise<EvmFormatedLog[]> {
        if (this.iface && this.iface instanceof Interface) {
            const iface = this.iface;
            const parsedArray = await Promise.all(logs.map(async (log) => {
                try {
                    const parsedLog:ethers.utils.LogDescription = iface.parseLog(log);
                    return  this.formatLog(log, parsedLog);
                } catch (e) {
                    return this.parseEvent(log);
                }
            }));
            parsedArray.forEach((parsed) => {
                if(parsed.name && parsed.eventFragment?.inputs){
                    parsed.inputs = parsed.eventFragment.inputs;
                }
            });
            return parsedArray;
        }


        return await Promise.all(logs.map(async (log) => {
            const parsedLog = await this.parseEvent(log);
            if(parsedLog.name && parsedLog.eventFragment?.inputs){
                parsedLog.inputs = parsedLog.eventFragment.inputs;
            }
            return parsedLog;
        }));
    }

    formatLog(log: EvmLog, parsedLog: ethers.utils.LogDescription): EvmFormatedLog {
        if(!parsedLog.signature) {
            console.error('No signature found for log! Check if this explodes. Returning EvmLog instead of EvmFormatedLog. ');
            return log as unknown as EvmFormatedLog;
        }
        const function_signature = log.topics[0].substring(0, 10);
        return {
            ... parsedLog,
            function_signature,
            isTransfer: TRANSFER_SIGNATURES.includes(function_signature),
            logIndex: log.logIndex,
            address: log.address,
            token: this._token,
            name: parsedLog.signature,
        } as EvmFormatedLog;
    }

    async parseEvent(log: EvmLog): Promise<EvmFormatedLog> {
        const eventIface = await this._manager?.getEventIface(log.topics[0]);
        if (eventIface) {
            try {
                const parsedLog:ethers.utils.LogDescription = eventIface.parseLog(log);
                return this.formatLog(log, parsedLog);
            } catch(e) {
                throw new AntelopeError('antelope.utils.error_parsing_log_event', log);
            }
        } else {
            throw new AntelopeError('antelope.utils.error_parsing_log_event', log);
        }
    }
}

export interface Erc20Transfer {
    index: number;
    address: string;
    value: string; // string representation of hex number
    decimals?: number;
    to: string;
    from: string;
    symbol?: string;
}
