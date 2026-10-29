// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ERC-20 shares of the ALU logo: 1 ALUT = 1 of 1,000,000 shares.
contract ALULogoToken is ERC20, Ownable {
    /// @notice The total number of shares, which never changes.
    uint256 public constant TOTAL_SHARES = 1_000_000;

    /// @notice Announced every time shares are given to someone.
    event SharesDistributed(address indexed recipient, uint256 amount);

    /// @notice Creates the token and gives all 1,000,000 shares to the logo owner.
    constructor(
        address logoOwner
    ) ERC20("ALU Logo Token", "ALUT") Ownable(logoOwner) {
        _mint(logoOwner, TOTAL_SHARES);
    }

    /// @notice Uses whole shares only, instead of the default 18 decimals.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// @notice Lets the owner give some shares to another wallet.
    /// @dev Only the owner can call this, and the amount must be more than zero.
    function distributeShares(
        address recipient,
        uint256 amount
    ) public onlyOwner {
        require(amount > 0, "Amount must be greater than zero.");

        _transfer(owner(), recipient, amount);

        emit SharesDistributed(recipient, amount);
    }

    /// @notice Shows what percent of the logo a wallet owns.
    /// @dev Returns a whole number, rounded down.
    function ownershipPercentage(
        address account
    ) public view returns (uint256) {
        return (balanceOf(account) * 100) / totalSupply();
    }
}
