import functions_overrides from 'src/lib/abi/signature/functions_signatures_overrides.json';
import events_overrides from 'src/lib/abi/signature/events_signatures_overrides.json';
import { TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures';
import { ethers } from 'ethers';
import axios from 'axios';

export default class FragmentParser {
    constructor(evmEndpoint) {
        this.functionInterfaces = functions_overrides;
        this.eventInterfaces = events_overrides;
        this.processing = [];
        this.evmEndpoint = evmEndpoint;
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
        if(this.processing.includes(data)){
            await new Promise(resolve => setTimeout(resolve, 300));
            let result = await this.getFunctionInterface(data);
            return result;
        }
        this.processing.push(data);

        try {
            const abiResponse = await this.evmEndpoint.get(`/v2/evm/get_abi_signature?type=function&hex=${prefix}`);
            if (abiResponse) {
                if (!abiResponse.data || !abiResponse.data.text_signature || abiResponse.data.text_signature === '') {
                    console.error(`Unable to find function signature for sig: ${prefix}`);
                    this.functionInterfaces[prefix] = '';
                    return false;
                }
                this.functionInterfaces[prefix] = `function ${abiResponse.data.text_signature}`;
                return new ethers.utils.Interface([this.functionInterfaces[prefix]]);
            }
        } catch (e) {
            console.error(`Error trying to find event signature for function ${prefix}`);
            this.functionInterfaces[prefix] = '';
            return false;
        }
    }
    async getEventInterface(data) {
        if(data === '0x'){
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(this.eventInterfaces, data)) {
            return new ethers.utils.Interface([this.eventInterfaces[data]]);
        }
        if(this.processing.includes(data)){
            await new Promise(resolve => setTimeout(resolve, 300));
            return await this.getEventInterface(data);
        }
        this.processing.push(data);

        try {
            const url = `https://cdn.statically.io/gh/telosnetwork/topic0/main/with_parameter_names/${data.substr(2)}`;
            const response = await axios.get(url);
            if(response.data){
                this.eventInterfaces[data] = `event ${response.data}`;
                return new ethers.utils.Interface([this.eventInterfaces[data]]);
            }
        } catch (e) {
            console.debug(e);
        }

        try {
            const abiResponse = await this.evmEndpoint.get(`/v2/evm/get_abi_signature?type=event&hex=${data}`);
            if (abiResponse) {
                if (!abiResponse.data || !abiResponse.data.text_signature || abiResponse.data.text_signature === '') {
                    console.error(`Unable to find event signature for event: ${data}`);
                    return false;
                }
                this.eventInterfaces[data] = `event ${abiResponse.data.text_signature}`;
                return new ethers.utils.Interface([this.eventInterfaces[data]]);
            }
        } catch (e) {
            console.error(`Error trying to find event signature for event ${data}: ${e.message}`);
            return false;
        }
        this.eventInterfaces[data] = '';
        return false;
    }

    formatLog(contract, log, parsedLog){
        if(!parsedLog.signature){
            return log;
        }
        parsedLog.function_signature = log.topics[0].slice(0, 10);
        parsedLog.isTransfer = TRANSFER_SIGNATURES.includes(parsedLog.function_signature);
        parsedLog.address = log.address;
        parsedLog.logIndex = log.logIndex;
        parsedLog.contract = contract;
        parsedLog.value = log.action?.value;
        parsedLog.name = parsedLog.signature;
        return parsedLog;
    }

    async parseLog(log, contract) {
        log.transactionHash = log.transaction_hash;
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
        const eventInterface = await this.getEventInterface(log.topics[0]);
        if (eventInterface) {
            try {
                let parsedLog = eventInterface.parseLog(log);
                return parsedLog;
            } catch(e) {
                console.error(`Failed to parse log #${log.logIndex} from event interface. Please check the ABI.`);
            }
        }
        log.function_signature = log.topics[0]?.slice(0, 10);
        return log;
    }
}
