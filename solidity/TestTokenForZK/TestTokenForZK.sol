// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestTokenForZK
 * @dev ERC20 token called TESTZK with additional functionality for purchasing with ETH,
 * transferring the contract's balances to the owner, and managing contract ownership.
 */
contract TestTokenForZK is ERC20, Ownable {
    uint256 public constant TOKENS_PER_ETH = 1000; // Exchange rate of 1000 TESTZK per 1 ETH

    /**
     * @dev Constructor that initializes the TESTZK token with an initial supply of 0,
     * sets the token name as "Test Token ZK" and the symbol as "TESTZK", 
     * and assigns ownership to the contract deployer.
     */
    constructor() ERC20("Test Token ZK", "TESTZK") Ownable() {
        // Initial supply is 0, no need for initial minting in the constructor
    }

    /**
     * @notice Allows users to buy TESTZK tokens by sending ETH to the contract.
     * @dev For every ETH sent, the buyer will receive 1000 TESTZK.
     * The tokens are minted to the buyer in the transaction.
     */
    function buyTokens() external payable {
        require(msg.value > 0, "You must send some ETH to buy tokens.");
        uint256 amountToMint = msg.value * TOKENS_PER_ETH;
        _mint(msg.sender, amountToMint); // Mint the calculated amount of TESTZK tokens to the buyer
    }

    /**
     * @notice Returns the ETH balance held by the contract.
     * @return The ETH balance in wei.
     */
    function getContractEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Returns the TESTZK token balance held by the contract.
     * @return The TESTZK token balance in the contract.
     */
    function getContractTokenBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }

    /**
     * @notice Transfers the entire ETH balance from the contract to the owner.
     * @dev Can only be executed by the owner of the contract.
     */
    function withdrawAllEth() external onlyOwner {
        uint256 contractEthBalance = address(this).balance;
        require(contractEthBalance > 0, "No ETH to withdraw.");
        payable(owner()).transfer(contractEthBalance);
    }

    /**
     * @notice Transfers the entire TESTZK token balance from the contract to the owner.
     * @dev Can only be executed by the owner of the contract.
     */
    function withdrawAllTokens() external onlyOwner {
        uint256 contractTokenBalance = balanceOf(address(this));
        require(contractTokenBalance > 0, "No TESTZK tokens to withdraw.");
        _transfer(address(this), owner(), contractTokenBalance);
    }

    /**
     * @notice Allows the owner to transfer the contract's ownership to a new address.
     * @param newOwner The address of the new owner.
     * @dev Can only be executed by the current owner.
     */
    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner address cannot be the zero address.");
        transferOwnership(newOwner);
    }
}
