// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract SimpleCounterManager {
    uint256 public count;

    // Error for handling validation logic
    error NotAllowed(string message);

    // Increments count if the parameter is false. If true, emits an error.
    function checkAndIncrementCount(bool flag) public {
        if (flag) {
            revert NotAllowed("Flag is true, operation not allowed");
        } else {
            count += 1;
        }
    }

    // Verifies if msg.sender is the owner of the NFT and, if true, increments count
    function verifyOwnerAndIncrement(uint256 tokenId, address contractAddress) public {
        IERC721 nftContract = IERC721(contractAddress);
        address owner = nftContract.ownerOf(tokenId);
        if (msg.sender != owner) {
            revert NotAllowed("Caller is not the owner of the NFT");
        } else {
            count += 1;
        }
    }

    // Resets the count variable to 0
    function resetCount() public {
        count = 0;
    }
}
