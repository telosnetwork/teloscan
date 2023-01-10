export default {
    pages: {
        staking: {
            note_unstaking_period: 'Please note that there is an unstaking period of {period}',
            claim_tlos: 'Claim TLOS',
            add_stlos_to_metamask: 'Launch MetaMask dialog to add sTLOS',
            metamask_fox_logo: 'MetaMask fox logo',
            cancel: 'Cancel',
            stake_tlos_confirm: 'Continuing will stake TLOS in exchange for sTLOS. ' +
            'TLOS can be redeemed for TLOS at any time using the Unstake tab.',
            stake_tlos_confirm_2a: 'After TLOS has been unstaked, it will be locked for a period of', /* unstakePeriodPretty...*/
            stake_tlos_confirm_2b: /*...unstakePeriodPretty */ 'after which it can be withdrawn to your account from the Claim tab.',
            stake_tlos_confirm_3: 'Would you like to proceed?',
            stake_tlos: 'Stake TLOS',
            stake_tlos_subheader: 'Staking your TLOS to sTLOS grants you access to a steady income and various DeFi applications, ' +
            'further increasing yield. As the reward pool increases, the TLOS to sTLOS conversion rate will change ' +
            'over time. Therefore, the amount of sTLOS received is smaller than the staked TLOS. Rewards will be ' +
            'auto-compounded. No further action is required.',
            receive_stlos: 'Receive sTLOS',
            available: '{balanceTlos} Available',
            insufficient_tlos_balance: 'Insufficient TLOS balance to stake',
            login_using_an_evm_wallet: 'Login using an EVM wallet',
            wallet_not_connected: 'Wallet not connected',
            click_to_input_full_wallet_balance: 'Click to input full wallet balance\n\n' +
            'Balance displayed is reduced by 1 TLOS to keep your account actionable.\n' +
            'Precise balance (less approximate gas fees):\n' +
            '{prettyBalance} TLOS',
            loading: 'Loading...',
            get_more_tlos: 'Get more TLOS',
            connect_wallet: 'Connect Wallet',
            minutes: 'minutes',
            hours: 'hours',
            days: 'days',
            unstake: 'Unstake',
            stake: 'Stake',
            withdraw: 'Withdraw',
            telos_evm_staking: 'Telos EVM Staking',
            stake_tlos_earn_interest: 'Stake TLOS for sTLOS to earn interest from the staking rewards pool',
            tooltip_1: 'APY: Annual Percentage Yield\n\nThe annual rate of return after taking compound interest into account.\n\n' +
            'Interest is compounded approximately every 30 minutes. The percentage rate is not fixed, meaning that ' +
            'it will change over time with the total amount of TLOS staked across Telos EVM and Native. ' +
            'Rewards are disbursed from a community rewards pool into the sTLOS contract.',
            tooltip_2: 'TVL: Total Value Locked\n\nThe current value, in TLOS, of all assets held in the sTLOS ' +
            '(Staked TLOS) smart contract, i.e. the sum of all TLOS staked on the Telos EVM at this moment.',
            tooltip_3: 'Staked\n\n' +
            'The total staked amount associated with the logged-in account, i.e. ' +
            'your sTLOS token balance, along with its value in TLOS',
            tooltip_4: 'Unstaked\n\n' + 
            'The total value of TLOS which you have unstaked, both locked and unlocked.\n\n' +
            'When you unstake\u2014i.e. redeem\u2014some value of sTLOS, the equivalent amount of ' +
            'TLOS is sent into escrow ("locked") for {unlockPeriod}; during this time, ' +
            'you cannot interact with this TLOS.\n\n' +
            'After the unlock period has elapsed, you can claim your unlocked TLOS from the Claim tab ' +
            'on this page, at which point it will be added to your account TLOS balance.',
            confirm_unstake_1a: 'Continuing will redeem sTLOS in exchange for TLOS. ' +
            'Unstaked TLOS will remain locked for a period of', /* unstakePeriodPretty...*/
            confirm_unstake_1b: /*...unstakePeriodPretty */ 'after which it can be withdrawn to your account from the Claim tab',
            confirm_unstake_2a: 'Heads up, you may unstake ', /* remainingDeposits...*/
            confirm_unstake_2b: /*...remainingDeposits */ 'more times before ' +
            'you reach the maximum concurrent unstake actions. When you reach the maximum, you will need to claim' +
            'unlocked TLOS to continue unstaking. If you don\'t have any claimable TLOS at that time, you must' +
            'wait until the lock duration has elapsed before you can claim unlocked TLOS and unstake more sTLOS. -',
            unstake_stlos_for_tlos: 'Unstake sTLOS in exchange for TLOS',
            unstake_stlos: 'Unstake sTLOS',
            receive_tlos: 'Receive TLOS',
            amount: 'Amount',
            time_remaining: 'Time Remaining',
            full_staked_balance_tooltip: 'Click to input full staked balance\n\n' +
            'Precise balance (less approximate gas fees):\n' +
            '{prettyBalance} sTLOS',
            login_using_evm_wallet: 'Login using an EVM wallet',
            max_unstake_transactions_reached: 'You have reached the maximum number of pending unstake transactions, ' +
            'please claim available TLOS or wait for pending unstaked TLOS to become claimable before making another deposit.',
            click_to_change_time_format: 'Click to change time format',
            unstaking: 'Unstaking',
            available_to_withdraw: 'Available to withdraw',
            withdraw_tlos: 'Withdraw TLOS',
            withdraw_successful: 'Withdraw successful! View Transaction:',
        },
        explore_transactions: 'Explore Transactions',
        recent_transactions: 'Recent transactions',
        telos_evm_explorer: 'Telos EVM Explorer',
        rpc_endpoints: 'RPC Endpoints',
        monitor: 'Monitor',
        oops: 'Oops. Nothing here...',
        go_home: 'Go Home',
        select_sol_file: 'Select .sol contract file for upload',
        select_json_file: 'Select standard JSON input object file for upload',
        paste_contract_contents: 'you must select a file for upload or toggle input to paste contract contents',
        contract_address: 'Contract Address',
        enter_contract_address: 'Please enter contract address \'0x0123...\'',
        invalid_address_format: 'invalid address format',
        select_compiler_version: 'select compiler version',
        contract_file_directory_path: 'Contract File(s) Directory Path (leave blank if none)',
        invalid_path_format: 'path must end with a forward slash /',
        upload_file: 'upload file',
        text_input: 'text input',
        runs_value_for_optimization: 'Runs value for optimization',
        constructor_arguments: 'Constructor Arguments',
        comma_seperated_values: 'comma seperated values e.g., Bob,123,0x12345...',
        no_trailing_commas: 'no trailing commas',
        paste_contract_code_here: 'copy & paste contract code here...',
        enter_contract_text: 'enter or paste contract text',
        verify_contract: 'Verify Contract',
        reset: 'Reset',
        gas_used: 'Gas used',
        transactions: 'Transactions',
        account: 'Account',
        contract: 'Contract',
        erc20_transfers: 'ERC20 Transfers',
        erc721_transfers: 'ERC721 Transfers',
        erc1155_transfers: 'ERC1155 Transfers',



    },
    components: {
        verify_contract: 'Verify Contract',
        search_evm_address_failed: 'Search for EVM address linked to { accountName } native account failed. You can create one at wallet.telos.net',
        connect_wallet: 'Connect Wallet',
        view_address: 'View Address',
        disconnect: 'Disconnect',
        evm_wallets: 'EVM Wallets',
        advanced: 'Advanced',
        continue_on_metamask: 'Continue on Metamask',
        text1_native_wallets: 'Native wallets for',
        text2_advanced_users: 'advanced users',
        text3_or_to_recover_assets: 'or to recover assets sent to a native-linked address',
        copy_to_clipboard: 'Copy { text } to clipboard',
        latest_block: 'Latest Block',
        tlos_price: 'TLOS Price',
        click_to_expand: 'Click to expand the function signature',
        search_evm_failed: 'Search for EVM address linked to { search_term } native account failed.',
        search_failed: 'Search failed, please enter a valid search term.',
        add_to_metamask: 'Add { symbol } to MetaMask',
        tx_hash: 'Tx Hash',
        block: 'Block',
        date: 'Date',
        method: 'Method',
        from: 'From',
        to: 'To',
        to_interacted_with: 'To / Interacted With',
        value_transfer: 'Value / Transfer',
        value: 'Value',
        token: 'Token',
        unknown_precision: 'Unknown Precision',
        click_to_change_format: 'Click to change format',
        func_exed_based_on_dec_data: 'Function executed based on decoded data',
        transaction: {
            form_from: 'From : ',
            form_to: 'To : ',
            form_token: 'Token : ',
            consult_collection: 'Consult collection',
            consult_metadata: 'Consult metadata',
            consult_media: 'Consult media',
            show_total: 'Show total',
            show_wei: 'Show wei',
            value_uint256: 'Value (uint256) : ',
            tlos_transfer: 'TLOS Transfer',
            unknown: 'Unknown',
            contract_deployment: 'Contract Deployment',
            no_internal_trxs_found: 'No internal transactions found',
            human_readable: 'Human Readable',
            no_logs_found: 'No logs found',
            verify_related_contract: 'Verify the related contract for each log to see its human readable version',

        }
    }
};