// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Registers digital assets, such as the ALU logo, as ERC-721 NFTs.
contract ALUAssetRegistry is ERC721 {
    /// @notice The details saved for each registered file.
    struct AssetMetadata {
        string assetName;
        string fileType;
        bytes32 contentHash;
        address registeredBy;
        uint256 registeredAt;
    }

    /// @notice Finds the saved details of a file by its token ID.
    mapping(uint256 => AssetMetadata) public assets;
    /// @notice Remembers which file hashes are already registered.
    mapping(bytes32 => bool) public registeredHashes;

    uint256 private tokenCounter;

    /// @notice Announced every time a new file is registered.
    event AssetRegistered(
        uint256 indexed tokenId,
        address indexed registeredBy,
        bytes32 contentHash
    );

    /// @notice Creates the registry and gives its NFTs a name and symbol.
    constructor() ERC721("ALU Asset Registry", "ALUASSET") {}

    /// @notice Registers a new file as an NFT and saves its details.
    /// @dev Stops if the hash is empty or the file is already registered.
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

    /// @notice Checks if a file's hash matches the one saved for a token.
    /// @dev Free to call because it only reads data.
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

    /// @notice Returns all saved details for a token.
    function getAsset(
        uint256 tokenId
    ) public view returns (AssetMetadata memory) {
        _requireOwned(tokenId);

        return assets[tokenId];
    }

    /// @notice Returns how many files have been registered so far.
    function totalAssets() public view returns (uint256) {
        return tokenCounter;
    }
}
