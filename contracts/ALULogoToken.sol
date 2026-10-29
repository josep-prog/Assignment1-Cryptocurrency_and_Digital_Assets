// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ERC-20 shares of the ALU logo: 1 ALUT = 1 of 1,000,000 shares.
contract ALULogoToken is ERC20, Ownable {
    uint256 public constant TOTAL_SHARES = 1_000_000;

    event SharesDistributed(address indexed recipient, uint256 amount);

    constructor(
        address logoOwner
    ) ERC20("ALU Logo Token", "ALUT") Ownable(logoOwner) {
        _mint(logoOwner, TOTAL_SHARES);
    }

    // Whole shares only, instead of the default 18 decimals.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function distributeShares(
        address recipient,
        uint256 amount
    ) public onlyOwner {
        require(amount > 0, "Amount must be greater than zero.");

        _transfer(owner(), recipient, amount);

        emit SharesDistributed(recipient, amount);
    }

    // Whole-number percentage, rounded down.
    function ownershipPercentage(
        address account
    ) public view returns (uint256) {
        return (balanceOf(account) * 100) / totalSupply();
    }
}
