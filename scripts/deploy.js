const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const BillPayment = await hre.ethers.getContractFactory("BillPayment");
  const billPayment = await BillPayment.deploy(deployer.address, deployer.address);
  await billPayment.deployed();
  console.log("BillPayment deployed to:", billPayment.address);

  const NFTRewards = await hre.ethers.getContractFactory("NFTRewards");
  const nftRewards = await NFTRewards.deploy(billPayment.address);
  await nftRewards.deployed();
  console.log("NFTRewards deployed to:", nftRewards.address);

  const BillPool = await hre.ethers.getContractFactory("BillPool");
  const billPool = await BillPool.deploy(deployer.address);
  await billPool.deployed();
  console.log("BillPool deployed to:", billPool.address);

  console.log("\n✅ All contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
