import { ConfigCtrlState, ThemeCtrlState } from '@web3modal/core';

export type Web3ModalConfig = Omit<ConfigCtrlState, 'enableStandaloneMode' |
 'standaloneChains' | 'walletConnectVersion'> & ThemeCtrlState;
