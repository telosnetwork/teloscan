
We have deployed several versions of the WTLOS contract. However, there's only one official contract of which we do not have the source code so it was not verified yet.

I searched among the other deployments and tried to verify their source against the official's bytecode and I found a partial match.

Currently, the official contract shows as verified but it has a significant difference from the actual bytecode:

The name is not "Wrapped TLOS" but "Wrapped Ether" and the symbol is not "WTLOS" but "WETH"


https://testnet.teloscan.io/address/0xaE85Bf723A9e74d6c663dd226996AC1b8d075AA9?tab=contract official
https://testnet.teloscan.io/address/0x550B277A919B8306aF57F89B6E0DC7FE7A355AB2?tab=contract
https://testnet.teloscan.io/address/0x74B694262C857F0589910fbF962b7c3141563264?tab=contract
https://testnet.teloscan.io/address/0xc8aEE400af228e72f15202543a0A832F9d58F5f0?tab=contract partial match
https://testnet.teloscan.io/address/0xF5Dd4A1fCE57D9aCd7a4fEF03709402014b56813?tab=contract
https://testnet.teloscan.io/address/0xBB84051943e609e8f78a1cdc0d98EFB8A97e77F4?tab=contract

