/* eslint-disable max-len */

export default {
    locale: {
        current_language_name: 'Español',
    },
    pages: {
        staking: {
            note_unstaking_period: 'Tenga en cuenta que hay un período de recuperación de {period}',
            claim_tlos: 'Reclamar TLOS',
            add_stlos_to_metamask: 'Iniciar el cuadro de diálogo MetaMask para agregar sTLOS',
            metamask_fox_logo: 'Logotipo de la zorra de MetaMask',
            stake_tlos_confirm: 'continuar significa bloquer TLOS a cambio de sTLOS. ' +
            'sTLOS se puede canjear por TLOS en cualquier momento usando la pestaña Desbloquear.',
            cancel: 'Cancelar',
            stake_tlos_confirm_2a: 'Después de que se reclamen los TLOS, éstos estarán bloqueados durante un período de', /* unstakePeriodPretty...*/
            stake_tlos_confirm_2b: /*...unstakePeriodPretty */ 'después de lo cual se puede retirar a su cuenta desde la pestaña Reclamar.',
            stake_tlos_confirm_3: '¿Le gustaría proceder?',
            stake_tlos: 'Bloquar TLOS',
            stake_tlos_subheader: 'Su bloqueo de TLOS a sTLOS le otorga acceso a una renta constante y varias aplicaciones DeFi, ' +
            'aumentando aún más la rentabilidad. A medida que aumenta la cantidad de recompensas, la tasa de conversión de TLOS a sTLOS cambiará ' +
            'con el tiempo. Por lo tanto, la cantidad de sTLOS recibida es menor que la cantidad de TLOS bloqueada. Las recompensas se ' +
            'auto-compensarán. No se requiere ninguna acción adicional.',
            receive_stlos: 'Recibir sTLOS',
            available: '{balanceTlos} Disponible',
            insufficient_tlos_balance: 'Saldo de TLOS insuficiente para apostar',
            login_using_an_evm_wallet: 'Iniciar sesión usando una billetera EVM',
            wallet_not_connected: 'Billetera no conectada',
            click_to_input_full_wallet_balance: 'Haga clic para ingresar el saldo completo de la billetera\n\n' +
            'El saldo mostrado se reduce en 1 TLOS para mantener su cuenta operativa.\n' +
            'Saldo preciso (menos las tarifas de gas aproximadas):\n' +
            '{prettyBalance} TLOS',
            loading: 'Cargando...',
            get_more_tlos: 'Obtener más TLOS',
            connect_wallet: 'Conectar billetera',
            minutes: 'minutos',
            hours: 'horas',
            days: 'días',
            unstake: 'Desbloquear',
            stake: 'Bloquear',
            withdraw: 'Retirar',
            telos_evm_staking: 'Bloqueo de TLOS en EVM',
            stake_tlos_earn_interest: 'Bloquear TLOS para obtener sTLOS y ganar intereses de la recompensa de bloqueo',
            staked: 'Bloqueado',
            unstaked: 'Desbloqueado',
            tooltip_1: 'TAE: Tasa Anual Efectiva (APY en Inglés)\n\nLa tasa de retorno anual después de tomar en cuenta el interés compuesto.\n\n' +
            'El interés se compone aproximadamente cada 30 minutos. La tasa porcentual no es fija, lo que significa que ' +
            'cambiará con el tiempo con la cantidad total de TLOS bloqueado en Telos EVM y Telos nativo. ' +
            'Las recompensas se pagan desde un fondo de recompensas de la comunidad al contrato de sTLOS.',
            tooltip_2: 'VTB: Valor Total Bloqueado (TVL en Inglés)\n\nEl valor actual, en TLOS, de todos los activos en el contrato inteligente de sTLOS ' +
            '(TLOS bloqueado), es decir, la suma de todo el TLOS bloqueado en Telos EVM en este momento.',
            tooltip_3: 'Bloqueado\n\n' +
            'La cantidad total bloqueada asociada con la cuenta iniciada, es decir, ' +
            'su saldo de sTLOS, junto con su valor en TLOS',
            tooltip_4: 'Desbloqueado\n\n' +
            'El valor total de TLOS que ha desbloqueado, tanto bloqueado como desbloqueado.\n\n' +
            'Cuando desbloquea\u2014es decir, canjea\u2014algun valor de sTLOS, la cantidad equivalente de ' +
            'TLOS se envía en garantía ("bloqueado") por {unlockPeriod}; durante este tiempo, ' +
            'no puede interactuar con este TLOS.\n\n' +
            'Después de que transcurra el período de desbloqueo, puede reclamar su TLOS desbloqueado desde la pestaña Reclamar ' +
            'en esta página, momento en el que se agregará a su saldo de TLOS de su cuenta.',
            confirm_unstake_1a: 'Continuará canjeando sTLOS a cambio de TLOS. ' +
            'El TLOS desbloqueado permanecerá bloqueado por un período de', /* unstakePeriodPretty...*/
            confirm_unstake_1b: /*...unstakePeriodPretty */ 'después del cual se puede retirar a su cuenta desde la pestaña Reclamar',
            confirm_unstake_2a: 'Ten en cuenta, puede desbloquear ', /* remainingDeposits...*/
            confirm_unstake_2b: /*...remainingDeposits */ 'más veces antes ' +
            'de alcanzar el máximo de acciones de desbloqueo concurrentes. Cuando llegue al máximo, deberá reclamar ' +
            'el TLOS desbloqueado para continuar desbloqueando sTLOS. Si no tiene ningún TLOS reclamable en ese momento, debe ' +
            'espear hasta que transcurra el período de bloqueo antes de que pueda reclamar el TLOS reclamado y desbloquear más sTLOS. -',
            unstake_stlos_for_tlos: 'Desbloquear sTLOS a cambio de TLOS',
            unstake_stlos: 'Desbloquear sTLOS',
            receive_tlos: 'Recibir TLOS',
            amount: 'Cantidad',
            time_remaining: 'Tiempo restante',
            full_staked_balance_tooltip: 'Haga clic para ingresar el saldo total bloqueado\n\n' +
            'Saldo preciso (menos las tarifas de gas aproximadas):\n' +
            '{prettyBalance} sTLOS',
            login_using_evm_wallet: 'Inicie sesión usando una billetera EVM',
            max_unstake_transactions_reached: 'Ha alcanzado el número máximo de transacciones de desbloqueo pendientes, ' +
            'por favor reclame el TLOS disponible o espere a que el TLOS desbloqueado pendiente se convierta en reclamable antes de realizar otro depósito.',
            click_to_change_time_format: 'Haga clic para cambiar el formato de tiempo',
            unstaking: 'Desbloqueando',
            available_to_withdraw: 'Disponible para retirar',
            withdraw_tlos: 'Retirar TLOS',
            withdraw_successful: 'Retiro exitoso! Ver transacción:',
            no_withdrawable_positions: 'No hay posiciones disponibles para retirar',
            you_have_unlocked_tlos: '¡Ha desbloqueado TLOS!',
            stake_tlos_success: '¡Bloqueo exitoso! Ver transacción:',
            unstake_stlos_success: '¡Desbloqueo exitoso! Ver transacción:',
            deposit_failed: 'Error al depositar TLOS: { message }',
            redeem_failed: 'No se puede convertir sTLOS a TLOS: { message }',
            fetch_balance_error: 'Error al buscar cuenta: { message }',
            fetch_stlos_balance_error: 'Error al buscar el saldo de sTLOS de la cuenta: { message }',
            fetch_stlos_value_error: 'Error al buscar el valor del saldo de sTLOS de la cuenta: { message }',
            fetch_unstaked_balance_error: 'Error al buscar el saldo total de TLOS no bloqueado: { message }',
            fetch_unlocked_balance_error: 'Error al buscar el saldo de sTLOS desbloqueado: { message }',
            fetch_escrow_deposits_error: 'Error al buscar depósitos de custodia: { message }',
            fetch_conversion_rate_error: 'Error al buscar la tasa de conversión TLOS->sTLOS: { message }',
            fetch_stlos_contract_error: 'Error al obtener el contrato sTLOS: { message }',
            fetch_escrow_contract_error: 'Error al obtener el contrato sTLOS: { message }',
            fetch_unstake_period_error: 'Error al recuperar el período de desbloqueo: { message }',
            fetch_account_error: 'Error al buscar cuenta: { message }',
            fetch_stlos_tvl_error: 'Error al buscar el TVL de sTLOS: { message }',
            fetch_stlos_apy_error: 'Error al buscar el APY de sTLOS: { message }',
            fetch_max_deposits_error: 'Error al buscar depósitos máximos del contrato de custodia { message }',
            convert_tlos_to_stlos_error: 'No se puede convertir TLOS a sTLOS { message }',
            convert_stlos_to_tlos_error: 'No se puede convertir sTLOS a TLOS { message }',
            unstake_stlos_error: 'Error al desbloquear sTLOS { message }',
            withdraw_failed: 'Error al retirar TLOS desbloqueado: { message }',
        },
        explore_transactions: 'Explorar transacciones',
        recent_transactions: 'Transacciones recientes',
        telos_evm_explorer: 'Explorador Telos EVM',
        rpc_endpoints: 'Puntos de entrada RPC',
        monitor: 'Monitor',
        oops: 'Ups. Nada por aquí...',
        go_home: 'Ir a inicio',
        select_sol_file: 'Seleccione el archivo de contrato .sol para cargar',
        select_json_file: 'Seleccione el archivo de objeto de entrada JSON estándar para cargar',
        paste_contract_contents: 'debe seleccionar un archivo para cargar o alternar la entrada para pegar el contenido del contrato',
        contract_address: 'Dirección del contrato',
        enter_contract_address: 'Por favor ingrese la dirección del contrato \'0x0123...\'',
        invalid_address_format: 'formato de dirección no válido',
        compiler_version: 'Versión del compilador',
        select_compiler_version: 'seleccione la versión del compilador',
        eg_contracts: 'por ejemplo, \'contratos/\'',
        contract_file_directory_path: 'Ruta del directorio de archivos de contrato (dejar en blanco si no hay ninguno)',
        invalid_path_format: 'la ruta debe terminar con una barra inclinada /',
        upload_file: 'cargar archivo',
        text_input: 'entrada de texto',
        runs_value_for_optimization: 'Valor de ejecuciones para la optimización',
        constructor_arguments: 'Argumentos del constructor',
        comma_seperated_values: 'valores separados por comas, por ejemplo, Bob,123,0x12345...',
        no_trailing_commas: 'sin comas finales',
        paste_contract_code_here: 'copie y pegue el código del contrato aquí...',
        enter_contract_text: 'ingrese o pegue el texto del contrato',
        verify_contract: 'Verificar contrato',
        reset: 'Reiniciar',
        gas_used: 'Gas usado',
        transactions: 'Transacciones',
        account: 'Cuenta',
        contract: 'Contrato',
        erc20_transfers: 'Transferencias ERC20',
        erc721_transfers: 'Transferencias ERC721',
        erc1155_transfers: 'Transferencias ERC1155',
        tokens: 'Tokens',
        created_at_trx: 'Creada en la Trx',
        by_address: 'Por la dirección',
        number_used_once: 'Número usado una vez (nonce)',
        native_account: 'Cuenta nativa',
        balance: 'Balance',
        view_source_prompt: 'Este contrato ha sido verificado. Puede ver el código fuente y los metadatos en la pestaña \'contrato\'',
        account_url: '{ domain }/account/{ account }',
        tlos_balance: '{ balance } TLOS',
        couldnt_retreive_metadata_for_address: 'No se pudo recuperar los metadatos para { address }: { message }',
        transaction_details: 'Detalles de la transacción',
        transaction_not_found: 'No encontrado: { hash }',
        general: 'General',
        details: 'Detalles',
        logs: 'Registros',
        internal_txns: 'Transacciones internas',
        transaction_hash: 'Hash de transacción',
        click_to_change_date_format: 'Haga clic para cambiar el formato de fecha',
        block_number: 'Número de bloque',
        from: 'De',
        to: 'A',
        date: 'Fecha',
        success: 'Éxito',
        failure: 'Fracaso',
        status: 'Estado',
        balance_gwei: '{ amount } GWEI',
        balance_tlos: '{ amount } TLOS',
        error_message: 'Mensaje de error',
        contract_function: 'Función de contrato',
        function_parameters: 'Parámetros de función',
        deployed_contract: 'Contrato desplegado',
        click_to_show_in_wei: 'Haga clic para mostrar en wei',
        gas_price_charged: 'Precio del gas cargado',
        gas_fee: 'Tarifa de gas',
        gas_limit: 'Límite de gas',
        nonce: 'Nonce',
        input: 'Entrada',
        output: 'Salida',
        value: 'Valor',
    },
    components: {
        internal_txns: 'Transacciones internas',
        n_internal_txns: '{ amount } transacciones internas',
        none: 'Ninguno',
        verify_prompt: 'Este contrato no ha sido verificado. ¿Le gustaría cargar el (los) contrato (s) y los metadatos para verificar el código fuente ahora?',
        verify_contract: 'Verificar contrato',
        search_evm_address_failed: 'La búsqueda de la dirección EVM vinculada a la cuenta nativa { accountName } falló. Puede crear una en wallet.telos.net',
        unknown_web3_login_type: 'Tipo de inicio de sesión web3 desconocido: { provider }',
        connect_wallet: 'Conectar billetera',
        view_address: 'Ver dirección',
        disconnect: 'Desconectar',
        disable_wallet_extensions: 'Desactive los monederos de extensión o establezca Brave Wallet como predeterminado en la configuración del monedero del navegador para utilizar Brave Wallet.',
        enable_wallet_extensions: 'Habilite la extensión MetaMask y establezca por defecto `preferir extensiones` en la configuración del monedero del navegador para utilizar el monedero MetaMask.',
        evm_wallets: 'Billeteras EVM',
        advanced: 'Avanzado',
        continue_on_metamask: 'Continuar en Metamask',
        text1_native_wallets: 'Billeteras nativas para',
        text2_advanced_users: 'usuarios avanzados',
        text3_or_to_recover_assets: 'o para recuperar activos enviados a una dirección vinculada nativa',
        copy_to_clipboard: 'Copiar { text } al portapapeles',
        latest_block: 'Último bloque',
        tlos_price: 'Precio TLOS',
        gas_price: 'Precio del gas',
        click_to_expand: 'Haga clic para expandir la firma de la función',
        search_evm_failed: 'La búsqueda de la dirección EVM vinculada a la cuenta nativa { search_term } falló.',
        search_failed: 'La búsqueda falló, ingrese un término de búsqueda válido.',
        add_to_metamask: 'Agregar { symbol } a MetaMask',
        tx_hash: 'Tx Hash',
        block: 'Bloque',
        date: 'Fecha',
        method: 'Método',
        to_interacted_with: 'A / Interactuado con',
        value_transfer: 'Valor / Transferencia',
        value: 'Valor',
        token: 'Token',
        unknown_precision: 'Precisión desconocida',
        click_to_change_format: 'Haga clic para cambiar el formato',
        func_exed_based_on_dec_data: 'Función ejecutada en función de los datos decodificados',
        balance: 'Balance',
        error_fetching_balance: 'error al recuperar el saldo',
        launch_metamask_dialog_to_add: 'Lanzar diálogo MetaMask para agregar { symbol }',
        search_hints: 'Transacción,Dirección,Bloque',
        no_provider_found: 'Se encontró más de un proveedor, desactive los proveedores adicionales o el proveedor actual de la billetera EVM no es compatible.',
        copied: 'Copiado',
        copy_to_clipboard_failed: 'Error al copiar al portapapeles',
        gwei: 'Gwei',
        failed_to_parse_transaction: 'No se pudo analizar los datos de la transacción, el error fue: { message }',
        executed_based_on_decoded_data: 'Función ejecutada en función de los datos decodificados. Para la función no identificada, se muestra el ID de método en su lugar.',
        unsupported_token_type: 'Tipo de token no compatible: { tokenType }',
        token_id: 'Id #{ tokenId }',
        success: 'Éxito',
        nonce: 'Nonce',
        from: 'De',
        to: 'A',
        transaction: {
            form_from: 'De : ',
            form_to: 'A : ',
            form_token: 'Token : ',
            consult_collection: 'Consultar colección',
            consult_metadata: 'Consultar metadatos',
            consult_media: 'Consultar medios',
            show_total: 'Mostrar total',
            show_wei: 'Mostrar wei',
            value_uint256: 'Valor (uint256) : ',
            tlos_transfer: 'Transferencia TLOS',
            unknown: 'Desconocido',
            contract_deployment: 'Despliegue de contrato',
            no_internal_trxs_found: 'No se encontraron transacciones internas',
            human_readable: 'Lectura humana',
            no_logs_found: 'No se encontraron registros',
            verify_related_contract: 'Verifique el contrato relacionado para cada registro para ver su versión legible por humanos',
            failed_to_retrieve_contract: 'No se pudo recuperar el contrato con la dirección { address }',
        },
        inputs: {
            incorrect_address_array_length: 'Debe haber { size } direcciones en la matriz',
            incorrect_booleans_array_length: 'Debe haber { size } booleanos en la matriz',
            incorrect_bytes_array_length: 'Debe haber { size } bytes en la matriz',
            incorrect_sigint_array_length: 'Debe haber { size } enteros firmados en la matriz',
            incorrect_strings_array_length: 'Debe haber { size } cadenas en la matriz',
            incorrect_unsigint_array_length: 'Debe haber { size } enteros sin firmar en la matriz',

            invalid_address_array_string: 'El valor ingresado no representa una matriz de direcciones',
            invalid_booleans_array_string: 'El valor ingresado no representa una matriz de bool',
            invalid_bytes_array_string: 'El valor ingresado no representa una matriz de bytes',
            invalid_sigint_array_string: 'El valor ingresado no representa una matriz de enteros firmados',
            invalid_strings_array_string: 'El valor ingresado no representa una matriz de cadenas',
            invalid_unsigint_array_string: 'El valor ingresado no representa una matriz de enteros sin firmar',

            invalid_address_length: 'Una dirección debe tener exactamente 40 caracteres, sin incluir "0x"',
            invalid_address_start: 'Una dirección debe comenzar con 0x',
            invalid_address_characters: 'La entrada contiene caracteres no válidos',
            readonly: 'Este campo es de solo lectura',
            required: 'Este campo es obligatorio',
            too_large: 'El valor máximo para int{ size } es { max }',
            too_small: 'El valor mínimo para int{ size } es { max }',
            too_large_pow2: 'El valor máximo para uint{ size } es 2^{ size } - 1',
            too_small_pow2: 'El valor mínimo para int{ size } es -(2^{ size }) + 1',
            too_large_unsigint: 'El valor máximo para uint{ size } es 2^{ size } - 1',
            no_negative_unsigint: 'El valor para uint{ size } no debe ser negativo',
            invalid_signed_integer: 'Entero firmado no válido',
            invalid_unsigint: 'La entrada debe ser un entero sin firmar válido',
            str_input_placeholder: '["algún valor", ... , "valor final"]',
            str_input_hint: 'Las comillas dobles en las cadenas deben escaparse (\\")',
            address_placeholder: 'Dirección que comienza con 0x',
            address_label: '{ label } (address)',
            boolean_array_label: '{ label } (bool[{ size }])',
        },
        health: {
            status: 'Estado',
            checked_at: 'Verificado en',
            task: 'Tarea',
            message: 'Mensaje',
            block_height: 'Altura del bloque',
            latency: 'Latencia',
            click_to_change_format: 'Haga clic para cambiar el formato',
        },
        contract_tab: {
            copy_abi_to_clipboard: 'Copiar el JSON del ABI del contrato al portapapeles',
            enter_amount: 'Seleccione el número de decimales y escriba una cantidad, esto se ingresará para usted en el parámetro de función como uint256',
            result: 'Resultado',
            view_transaction: 'Ver transacción',
            code: 'Código',
            read: 'Leer',
            write: 'Escribir',
            amount: 'Cantidad',
            value: 'Valor',
            custom_decimals: 'Decimales personalizados',
            custom: 'Personalizado',
            unverified_contract_source: 'El código fuente de este contrato no ha sido verificado.',
            click_here: 'Haga clic aquí',
            upload_source_files: 'para cargar archivos de código fuente y verificar este contrato. ' +
                'Alternativamente, puede interactuar con el contrato usando un ABI arbitrario:',
            use_erc20_abi: 'Usar ABI ERC20',
            use_erc721_abi: 'Usar ABI ERC721',
            abi_from_json: 'ABI desde JSON',
            paste_abi_json_here: 'Pegue el JSON ABI aquí',
            abi_json_preview: 'Vista previa del JSON ABI',
            provided_abi_invalid: 'ABI proporcionado no válido',
            provided_json_invalid: 'JSON proporcionado no válido',
            read_functions: 'Funciones de lectura',
            write_functions: 'Funciones de escritura',
            unverified_contract: 'Contrato no verificado',
        },
        header: {
            sign_in: 'Iniciar sesión',
            sign_out: 'Cerrar sesión',
            liq_staking: 'Bloqueado líquido',
            goto_staking: 'Ir a Bloqueado',
            goto_health_monitor: 'ir a la página de monitoreo de salud',
            goto_mainnet: 'Ir a Mainnet',
            goto_testnet: 'Ir a Testnet',
            health_monitor: 'Monitoreo de salud',
            health_status: 'Estado de la salud',
            advanced: 'Avanzado',
            light_mode: 'Modo claro',
            dark_mode: 'Modo oscuro',
            address_not_found: 'La búsqueda de la dirección EVM vinculada a la cuenta nativa { account } falló.',
            search_failed: 'La búsqueda falló, ingrese un término de búsqueda válido.',
            goto_address_details: 'Ir a los detalles de la dirección',
            copy_address: 'Copiar dirección',
            address_copied: 'Dirección copiada al portapapeles',
            search_placeholder: 'Dirección, Tx, Bloque',
            select_language: 'Seleccionar idioma',
        },
    },
    global: {
        language: 'Idioma',
        ok: 'Ok',
        cancel: 'Cancelar',
        dismiss: 'Descartar',
    },
    layouts: {
        health_status: 'Estado de la salud',
        stake_telos: 'Stake TLOS',
        teloscan_mainnet: 'Teloscan Mainnet',
        teloscan_testnet: 'Teloscan Testnet',
    },
};
