/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
// EVMAuthenticator class

import { SendTransactionResult, WriteContractResult } from '@wagmi/core';
import { BigNumber, ethers } from 'ethers';
import { createTraceFunction } from 'src/antelope/mocks/FeedbackStore';
import { CURRENT_CONTEXT, getAntelope, useAccountStore, useContractStore } from 'src/antelope/mocks';
import { EVMChainSettings } from 'src/antelope/mocks';
import { useChainStore } from 'src/antelope/mocks';
import { useEVMStore } from 'src/antelope/mocks';
import { isTracingAll, useFeedbackStore } from 'src/antelope/mocks/FeedbackStore';
import { usePlatformStore } from 'src/antelope/mocks';
import { AntelopeError, ERC1155_TYPE, ERC721_TYPE, EvmABI, EvmABIEntry, EvmFunctionParam, EvmTransactionResponse, ExceptionError, NftTokenInterface, TokenClass, addressString, erc1155Abi, erc20Abi, erc721Abi, escrowAbiWithdraw, stlosAbiDeposit, stlosAbiWithdraw, wtlosAbiDeposit, wtlosAbiWithdraw } from 'src/antelope/types';

export abstract class EVMAuthenticator {

    readonly label: string;
    readonly trace: (message: string, ...args: unknown[]) => void;

    constructor(label: string) {
        this.label = label;
        const name = `${this.getName()}(${label})`;
        this.trace = createTraceFunction(name);
        useFeedbackStore().setDebug(name, isTracingAll());
    }

    /**
     * This method should be redefined on the derived class to perform any logout action if needed.
     */
    async logout(): Promise<void> {
        this.trace('logout');
    }

    /**
     * This method MUST be implemented on the derived class to perform any login action if needed.
     * However, the subclass may call this super class implementation to ensure the chain to connect to
     * is the same as the one the used wallet is connected to.
     * @param network network to connect to
     * @returns the account address of the user
     */
    async login(network: string): Promise<addressString | null> {
        this.trace('login', network);
        const chain = useChainStore();
        try {
            chain.setChain(CURRENT_CONTEXT, network);

            const checkProvider = await this.ensureCorrectChain() as ethers.providers.Web3Provider;

            const accounts = await checkProvider.listAccounts();
            if (accounts.length > 0) {
                return accounts[0] as addressString;
            } else {
                if (!checkProvider.provider.request) {
                    throw new AntelopeError('antelope.evm.error_support_provider_request');
                }
                const accessGranted = await checkProvider.provider.request({ method: 'eth_requestAccounts' });
                if (accessGranted.length < 1) {
                    return null;
                }
                return accessGranted[0] as addressString;
            }
        } catch (error) {
            if ((error as unknown as ExceptionError).code === 4001) {
                throw new AntelopeError('antelope.evm.error_connect_rejected');
            } else {
                console.error('Error:', error);
                throw new AntelopeError('antelope.evm.error_login');
            }
        }
    }

    async ensureCorrectChain(): Promise<ethers.providers.Web3Provider> {
        this.trace('ensureCorrectChain');
        if (usePlatformStore().isMobile) {
            // we don't have tools to check the chain on mobile
            return useEVMStore().ensureCorrectChain(this);
        } else {
            const showSwitchNotification = !(await this.isConnectedToCorrectChain());
            return useEVMStore().ensureCorrectChain(this).then((result) => {
                if (showSwitchNotification) {
                    const ant = getAntelope();
                    const networkName = useChainStore().getChain(this.label).settings.getDisplay();
                    ant.config.notifyNeutralMessageHandler(
                        ant.config.localizationHandler('antelope.wallets.network_switch_success', { networkName }),
                    );
                }
                return result;
            });
        }
    }

    isConnectedToCorrectChain(): Promise<boolean> {
        const correctChainId = useChainStore().getChain(this.label).settings.getChainId();
        return this.isConnectedTo(correctChainId);
    }

    /**
     * This method should be used to create a new instance of the same authenticator type but with a different label/context.
     * @param label new label/context for the new instance which identifies the account and the connected network
     */
    abstract newInstance(label: string): EVMAuthenticator;

    // ----- getters -----
    abstract getName(): string;

    /**
     * This method returns the balance of the system token for the given address using the authenticator's provider.
     * The authenticator may reimplement this method to use a different provider if needed.
     * @param address address of the account to get the balance of
     * @returns the balance of the system token for the given address
     */
    async getSystemTokenBalance(address: addressString | string): Promise<ethers.BigNumber> {
        this.trace('getSystemTokenBalance', address);
        try {
            const provider = await this.web3Provider();
            if (provider) {
                return provider.getBalance(address);
            } else {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
        } catch (e) {
            console.error('getSystemTokenBalance', e, address);
            throw e;
        }
    }

    /**
     * This method returns the balance of the given ERC20 token for the given address using the authenticator's provider.
     * The authenticator may reimplement this method to use a different provider if needed.
     * @param address address of the account to get the balance of
     * @param token address of the ERC20 token to get the balance of
     * @returns the balance of the given ERC20 token for the given address
     */
    async getERC20TokenBalance(address: addressString | string, token: addressString): Promise<ethers.BigNumber> {
        this.trace('getERC20TokenBalance', [address, token]);
        try {
            const provider = await this.web3Provider();
            if (provider) {
                const erc20Contract = new ethers.Contract(token, erc20Abi, provider);
                const balance = await erc20Contract.balanceOf(address);
                return balance;
            } else {
                throw new AntelopeError('antelope.evm.error_no_provider');
            }
        } catch (e) {
            console.error('getERC20TokenBalance', e, address, token);
            throw e;
        }
    }

    abstract isConnectedTo(chainId: string): Promise<boolean>;
    abstract externalProvider(): Promise<ethers.providers.ExternalProvider>;
    abstract web3Provider(): Promise<ethers.providers.Web3Provider>;

    async getSigner(): Promise<ethers.Signer> {
        const web3Provider = await this.web3Provider();
        return web3Provider.getSigner();
    }

    // Common auxiliary functions -----

    /**
     * This is a simple getter for the associated account address according to the label
     * @returns the account address
     */
    getAccountAddress(): addressString {
        return useAccountStore().getAccount(this.label).account as addressString;
    }

    /**
     * This is a simple getter for the associated chain settings according to the label
     */
    getChainSettings(): EVMChainSettings {
        return (useChainStore().getChain(this.label).settings as EVMChainSettings);
    }

    // Support for wagmi particularities ---

    /**
     * This method prepares the token for transfer.
     * TODO: This is only needed for WalletConnect. We need to refactor this implementation to remove this particularity.
     * @param token identifier of the token to transfer
     * @param amount amount of tokens to transfer
     * @param to address of the recipient
     */
    async prepareTokenForTransfer(token: TokenClass | null, amount: ethers.BigNumber, to: string): Promise<void> {
        this.trace('prepareTokenForTransfer', [token], amount, to);
    }

    /**
     * This method indicates the authenticator is ready to transfer tokens.
     * TODO: This is only needed for WalletConnect. We need to refactor this implementation to remove this particularity.
     */
    readyForTransfer(): boolean {
        return true;
    }

    // ----- Signing transactions -----
    /**
     * This is the main method to sign any transaction and MUST be implemented on the derived class.
     * @param contract address of the contract to be called
     * @param abi ABI of the specific function on the contract to be called
     * @param parameters list of parameters to be passed to the function
     * @param value amount of system tokens to send with the transaction if any
     */
    abstract signCustomTransaction(contract: string, abi: EvmABI, parameters: EvmFunctionParam[], value?: BigNumber): Promise<EvmTransactionResponse | WriteContractResult>;

    /**
     * This method is used to send system tokens and MUST be implemented on the derived class since it depends on the authenticator.
     * @param to address of the recipient
     * @param value amount of system tokens to send
     */
    abstract sendSystemToken(to: string, value: ethers.BigNumber): Promise<EvmTransactionResponse | SendTransactionResult | WriteContractResult>;

    /**
     * This method creates a Transaction to transfer (system of ERC20) tokens
     * @param token identifier of the token to transfer
     * @param amount amount of tokens to transfer
     * @param to address of the recipient
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async transferTokens(token: TokenClass, amount: ethers.BigNumber, to: addressString): Promise<ethers.providers.TransactionResponse | WriteContractResult | SendTransactionResult> {
        this.trace('transferTokens', token, amount, to);

        // prepare variables
        const value = amount.toHexString();
        const transferAbi = erc20Abi.filter(abi => abi.name === 'transfer');

        if (token.isSystem) {
            return await this.sendSystemToken(to, amount);
        } else {
            return this.signCustomTransaction(
                token.address,
                transferAbi,
                [to, value],
            );
        }
    }

    /**
     * This method transfers NFTs between accounts
     * @param contractAddress collection address
     * @param tokenId id of the nft in collection
     * @param type type of token, 721 or 1155
     * @param from address of sender
     * @param to address of receiving account
     * @param quantity optional value for 1155, default 1 for 721
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async transferNft(contractAddress: string, tokenId: string, type: NftTokenInterface, from: addressString, to: addressString, quantity = 1): Promise<EvmTransactionResponse | WriteContractResult | undefined> {
        this.trace('transferNft', contractAddress, tokenId, type, from, to);
        const contract = await useContractStore().getContract(this.label, contractAddress);

        if (contract) {
            if (type === ERC721_TYPE){
                const transferAbi = erc721Abi.filter((abi:EvmABIEntry) => abi.name === 'safeTransferFrom');
                return this.signCustomTransaction(contractAddress, [transferAbi[0]], [from, to, tokenId]);
            }else if (type === ERC1155_TYPE) {
                const transferAbi = erc1155Abi.filter((abi: EvmABIEntry) => abi.name === 'safeTransferFrom');
                return this.signCustomTransaction(contractAddress, [transferAbi[0]], [from, to, tokenId, quantity, '0x0']);
            }
        } else {
            throw new AntelopeError('antelope.balances.error_token_contract_not_found', { address: contractAddress });
        }
    }

    /**
     * This method creates a Transaction to wrap system tokens into ERC20 tokens
     * @param amount amount of system tokens to wrap
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async wrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse | WriteContractResult> {
        this.trace('wrapSystemToken', amount);

        // prepare variables
        const chainSettings = this.getChainSettings();
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address as addressString;

        return this.signCustomTransaction(
            wrappedSystemTokenContractAddress,
            wtlosAbiDeposit,
            [],
            amount,
        ).catch((error) => {
            throw this.handleCatchError(error as never);
        });
    }

    /**
     * This method creates a Transaction to unwrap ERC20 tokens into system tokens
     * @param amount amount of system tokens to unwrap
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async unwrapSystemToken(amount: BigNumber): Promise<EvmTransactionResponse | WriteContractResult> {
        this.trace('unwrapSystemToken', amount.toString());

        // prepare variables
        const chainSettings = this.getChainSettings();
        const wrappedSystemTokenContractAddress = chainSettings.getWrappedSystemToken().address as addressString;
        const value = amount.toHexString();

        return this.signCustomTransaction(
            wrappedSystemTokenContractAddress,
            wtlosAbiWithdraw,
            [value],
        ).catch((error) => {
            throw this.handleCatchError(error as never);
        });
    }

    /**
     * This method creates a Transaction to stake system tokens
     * @param amount amount of system tokens to stake
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async stakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse | WriteContractResult> {
        this.trace('stakeSystemTokens', amount.toString());

        // prepare variables
        const chainSettings = this.getChainSettings();
        const stakedSystemTokenContractAddress = chainSettings.getStakedSystemToken().address as addressString;

        return this.signCustomTransaction(
            stakedSystemTokenContractAddress,
            stlosAbiDeposit,
            [],
            amount,
        ).catch((error) => {
            throw this.handleCatchError(error as never);
        });
    }

    /**
     * This method creates a Transaction to unstake system tokens
     * @param amount amount of system tokens to unstake
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async unstakeSystemTokens(amount: BigNumber): Promise<EvmTransactionResponse | WriteContractResult> {
        this.trace('unstakeSystemTokens', amount.toString());

        // prepare variables
        const chainSettings = this.getChainSettings();
        const stakedSystemTokenContractAddress = chainSettings.getStakedSystemToken().address as addressString;
        const value = amount.toHexString();
        const from = this.getAccountAddress();

        return this.signCustomTransaction(
            stakedSystemTokenContractAddress,
            stlosAbiWithdraw,
            [value, from, from],
        ).catch((error) => {
            throw this.handleCatchError(error as never);
        });
    }

    /**
     * This method creates a Transaction to withdraw all unblocked staked tokens
     * @returns transaction response with the hash and a wait() method to wait confirmation
     */
    async withdrawUnstakedTokens() : Promise<EvmTransactionResponse | WriteContractResult> {
        this.trace('withdrawUnstakedTokens');

        // prepare variables
        const chainSettings = this.getChainSettings();
        const escrowContractAddress = chainSettings.getEscrowContractAddress();

        return this.signCustomTransaction(
            escrowContractAddress,
            escrowAbiWithdraw,
            [],
        ).catch((error) => {
            throw this.handleCatchError(error as never);
        });
    }

    /**
     * This method creates and throws an AntelopeError with the corresponding message.
     * It is useful to handle specific error codes that may indicate a particular known error situation.
     * Also is useful to detect when the user cancelled the transaction, which should be handled as a rejection instead of an error.
     * @param error catch error to be handled
     */
    abstract handleCatchError(error: never): AntelopeError;


}
