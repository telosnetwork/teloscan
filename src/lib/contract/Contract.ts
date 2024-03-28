/* eslint-disable */
import { ethers } from 'ethers';
import { markRaw } from "vue";

interface ContractCreationInfo {
  block?: number;
  transaction?: string;
  creator?: string;
}

interface ContractProperties {
  name?: string;
  symbol?: string;
  marketcap?: string;
  price?: string;
  supply?: string;
  decimals?: number;
  holders?: any[];
}

export default class Contract {
  [key: string]: any;
  autoloadedAbi: boolean;
  address: string;
  name?: string;
  nfts: { [key: string]: any };
  abi: any[];
  supportedInterfaces: string[];
  properties: ContractProperties;
  iface?: ethers.utils.Interface;
  verified: boolean;
  sources: any[];
  creationInfo?: ContractCreationInfo;
  logoURI: string;

  constructor({ address, creationInfo, name, abi, supportedInterfaces = [], properties = {}, verified = false, nfts = {}, autoloadedAbi }: { address: string; creationInfo?: ContractCreationInfo; name?: string; abi: any[]; supportedInterfaces?: string[]; properties?: ContractProperties; verified?: boolean; nfts?: { [key: string]: any }; autoloadedAbi: boolean; }) {
    this.autoloadedAbi = autoloadedAbi;
    this.address = address;
    this.name = name || properties?.name;
    this.nfts = nfts;
    this.abi = abi;
    this.supportedInterfaces = [];
    if (supportedInterfaces?.length > 0) {
      const index = supportedInterfaces?.indexOf('none');
      for (let i = 0; i < supportedInterfaces.length; i++) {
        if (i !== index) {
          this.supportedInterfaces.push(supportedInterfaces[i]);
        }
      }
    }
    this.properties = properties;
    if (abi) {
      this.iface = markRaw(new ethers.utils.Interface(abi));
    }
    this.verified = verified;
    this.sources = [];
    this.creationInfo = creationInfo;
    this.logoURI = '';
  }

  isVerified(): boolean {
    return this.verified;
  }

  setVerified(verified: boolean): this {
    this.verified = verified;
    return this;
  }

  isNonFungible(): boolean {
    return this.supportedInterfaces.includes('erc721');
  }

  isToken(): boolean | undefined {
    if (this.supportedInterfaces === null) return;
    return this.supportedInterfaces.includes('erc721') || this.supportedInterfaces.includes('erc1155') || this.supportedInterfaces.includes('erc20');
  }

  isAutoloadedAbi(): boolean {
    return this.autoloadedAbi;
  }

  getNfts(): { [key: string]: any } {
    return this.nfts;
  }

  getInterface(): ethers.utils.Interface | undefined {
    return this.iface;
  }

  getAddress(): string {
    return this.address;
  }

  getAbi(): any[] {
    return this.abi;
  }

  getSupportedInterfaces(): string[] {
    return this.supportedInterfaces;
  }

  getProperties(): ContractProperties {
    return this.properties;
  }

  getName(): string | undefined {
    return this.name;
  }

  getCreationBlock(): number | undefined {
    return this.creationInfo?.block;
  }

  getCreationTrx(): string | undefined {
    return this.creationInfo?.transaction;
  }

  getCreator(): string | undefined {
    return this.creationInfo?.creator;
  }

}
