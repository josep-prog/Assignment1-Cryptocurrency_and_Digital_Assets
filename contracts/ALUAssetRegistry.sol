// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Registers digital assets, such as the ALU logo, as ERC-721 NFTs.
contract ALUAssetRegistry is ERC721 {
    struct AssetMetadata {
        string assetName;
        string fileType;
        bytes32 contentHash;
        address registeredBy;
        uint256 registeredAt;
    }

    mapping(uint256 => AssetMetadata) public assets;
    mapping(bytes32 => bool) public registeredHashes;

    uint256 private tokenCounter;

    event AssetRegistered(
        uint256 indexed tokenId,
        address indexed registeredBy,
        bytes32 contentHash
    );

    constructor() ERC721("ALU Asset Registry", "ALUASSET") {}

    function registerAsset(
        string memory assetName,
        string memory fileType,
        bytes32 contentHash
    ) public returns (uint256) {
        require(contentHash != bytes32(0), "Content hash cannot be empty.");
        require(
            !registeredHashes[contentHash],
            "This file is already registered."
        );

        tokenCounter++;
        uint256 tokenId = tokenCounter;

        // State is saved before _safeMint to prevent re-entrancy.
        assets[tokenId] = AssetMetadata({
            assetName: assetName,
            fileType: fileType,
            contentHash: contentHash,
            registeredBy: msg.sender,
            registeredAt: block.timestamp
        });

        registeredHashes[contentHash] = true;

        _safeMint(msg.sender, tokenId);

        emit AssetRegistered(tokenId, msg.sender, contentHash);

        return tokenId;
    }

    function verifyLogoIntegrity(
        uint256 tokenId,
        bytes32 suppliedHash
    ) public view returns (bool isAuthentic, string memory message) {
        _requireOwned(tokenId);

        if (assets[tokenId].contentHash == suppliedHash) {
            return (true, "Logo is authentic.");
        }

        return (false, "Warning: logo does not match.");
    }

    function getAsset(
        uint256 tokenId
    ) public view returns (AssetMetadata memory) {
        _requireOwned(tokenId);

        return assets[tokenId];
    }

    function totalAssets() public view returns (uint256) {
        return tokenCounter;
    }
}
