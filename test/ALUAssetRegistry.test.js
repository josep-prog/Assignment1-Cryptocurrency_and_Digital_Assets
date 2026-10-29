const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

describe("ALU Logo Project", function () {
  let registry;
  let logoToken;
  let owner;
  let recipient;
  let logoHash;

  before(function () {
    const logoPath = path.join(__dirname, "..", "alu-logo.png");
    const logoFile = fs.readFileSync(logoPath);

    logoHash =
      "0x" + crypto.createHash("sha256").update(logoFile).digest("hex");
  });

  beforeEach(async function () {
    [owner, recipient] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("ALUAssetRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    const LogoToken = await ethers.getContractFactory("ALULogoToken");
    logoToken = await LogoToken.deploy(owner.address);
    await logoToken.waitForDeployment();
  });

  describe("Logo registration", function () {
    it("1. Registers the logo and returns a token ID", async function () {
      const tokenId = await registry.registerAsset.staticCall(
        "ALU Official Logo",
        "image/png",
        logoHash
      );

      expect(tokenId).to.equal(1n);

      await expect(
        registry.registerAsset("ALU Official Logo", "image/png", logoHash)
      )
        .to.emit(registry, "AssetRegistered")
        .withArgs(tokenId, owner.address, logoHash);

      expect(await registry.ownerOf(tokenId)).to.equal(owner.address);
      expect(await registry.registeredHashes(logoHash)).to.equal(true);
    });

    it("2. Rejects a duplicate file hash", async function () {
      await (
        await registry.registerAsset(
          "ALU Official Logo",
          "image/png",
          logoHash
        )
      ).wait();

      await expect(
        registry.registerAsset("Duplicate Logo", "image/png", logoHash)
      ).to.be.revertedWith("This file is already registered.");
    });

    it("3. Accepts the correct logo hash", async function () {
      await (
        await registry.registerAsset(
          "ALU Official Logo",
          "image/png",
          logoHash
        )
      ).wait();

      const [authentic, message] = await registry.verifyLogoIntegrity(
        1,
        logoHash
      );

      expect(authentic).to.equal(true);
      expect(message).to.equal("Logo is authentic.");
    });

    it("4. Rejects an incorrect logo hash", async function () {
      await (
        await registry.registerAsset(
          "ALU Official Logo",
          "image/png",
          logoHash
        )
      ).wait();

      // Flip one bit to get a different hash.
      const incorrectHash = ethers.toBeHex(BigInt(logoHash) ^ 1n, 32);

      const [authentic, message] = await registry.verifyLogoIntegrity(
        1,
        incorrectHash
      );

      expect(authentic).to.equal(false);
      expect(message).to.equal("Warning: logo does not match.");
    });

    it("5. Returns the correct asset metadata", async function () {
      await (
        await registry.registerAsset(
          "ALU Official Logo",
          "image/png",
          logoHash
        )
      ).wait();

      const asset = await registry.getAsset(1);

      expect(asset.assetName).to.equal("ALU Official Logo");
      expect(asset.fileType).to.equal("image/png");
      expect(asset.contentHash).to.equal(logoHash);
      expect(asset.registeredBy).to.equal(owner.address);
      expect(asset.registeredAt).to.be.greaterThan(0n);
    });
  });

  describe("Ownership shares", function () {
    it("6. Mints all 1,000,000 tokens to the logo owner", async function () {
      expect(await logoToken.name()).to.equal("ALU Logo Token");
      expect(await logoToken.symbol()).to.equal("ALUT");
      expect(await logoToken.totalSupply()).to.equal(1_000_000n);
      expect(await logoToken.balanceOf(owner.address)).to.equal(1_000_000n);
      expect(await logoToken.owner()).to.equal(owner.address);
    });

    it("7. Lets only the owner distribute a positive amount", async function () {
      await expect(
        logoToken.connect(recipient).distributeShares(owner.address, 100)
      )
        .to.be.revertedWithCustomError(logoToken, "OwnableUnauthorizedAccount")
        .withArgs(recipient.address);

      await expect(
        logoToken.distributeShares(recipient.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero.");

      await (
        await logoToken.distributeShares(recipient.address, 100_000)
      ).wait();

      expect(await logoToken.balanceOf(recipient.address)).to.equal(100_000n);
      expect(await logoToken.balanceOf(owner.address)).to.equal(900_000n);
      expect(await logoToken.totalSupply()).to.equal(1_000_000n);
    });

    it("8. Calculates ownership percentages correctly", async function () {
      await (
        await logoToken.distributeShares(recipient.address, 500_000)
      ).wait();

      expect(
        await logoToken.ownershipPercentage(recipient.address)
      ).to.equal(50n);

      expect(
        await logoToken.ownershipPercentage(owner.address)
      ).to.equal(50n);
    });
  });
});
