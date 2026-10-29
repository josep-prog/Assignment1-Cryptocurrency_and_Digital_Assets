const { ethers, network } = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

async function main() {
  const logoPath = path.join(__dirname, "..", "alu-logo.png");

  if (!fs.existsSync(logoPath)) {
    throw new Error(
      "Missing alu-logo.png. Add the official logo to the project folder."
    );
  }

  const logoFile = fs.readFileSync(logoPath);

  const contentHash =
    "0x" + crypto.createHash("sha256").update(logoFile).digest("hex");

  const [deployer] = await ethers.getSigners();

  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("Logo SHA-256:", contentHash);

  const Registry = await ethers.getContractFactory("ALUAssetRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const transaction = await registry.registerAsset(
    "ALU Official Logo",
    "image/png",
    contentHash
  );
  const receipt = await transaction.wait();

  // Token ID comes from the AssetRegistered event.
  const registeredEvent = receipt.logs
    .map((log) => registry.interface.parseLog(log))
    .find((parsed) => parsed && parsed.name === "AssetRegistered");
  const tokenId = registeredEvent.args.tokenId;

  const asset = await registry.getAsset(tokenId);
  const [authentic, message] = await registry.verifyLogoIntegrity(
    tokenId,
    contentHash
  );

  const LogoToken = await ethers.getContractFactory("ALULogoToken");
  const logoToken = await LogoToken.deploy(deployer.address);
  await logoToken.waitForDeployment();

  const registryAddress = await registry.getAddress();
  const logoTokenAddress = await logoToken.getAddress();

  console.log("\nDeployment complete");
  console.log("Registry address:", registryAddress);
  console.log("Registration tx:", transaction.hash);
  console.log("Logo token ID:", tokenId.toString());
  console.log("Registered name:", asset.assetName);
  console.log("Registered hash:", asset.contentHash);
  console.log("Integrity check:", authentic, "-", message);
  console.log("ALUT contract address:", logoTokenAddress);
  console.log("ALUT total supply:", (await logoToken.totalSupply()).toString());
  console.log(
    "Owner percentage:",
    (await logoToken.ownershipPercentage(deployer.address)).toString() + "%"
  );

  const outputDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, `${network.name}.json`),
    JSON.stringify(
      {
        network: network.name,
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployer: deployer.address,
        logoSha256: contentHash,
        ALUAssetRegistry: registryAddress,
        logoTokenId: tokenId.toString(),
        registrationTx: transaction.hash,
        ALULogoToken: logoTokenAddress,
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`Addresses saved to deployments/${network.name}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
