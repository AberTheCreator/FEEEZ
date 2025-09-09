const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    const feeCollector = deployer.address;
    
    console.log("\n1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();
    console.log("MockUSDC deployed to:", mockUSDC.address);
    
    console.log("\n2. Deploying BillPayment...");
    const BillPayment = await ethers.getContractFactory("BillPayment");
    const billPayment = await BillPayment.deploy(feeCollector);
    await billPayment.deployed();
    console.log("BillPayment deployed to:", billPayment.address);
    
    console.log("\n3. Deploying NFTRewards...");
    const NFTRewards = await ethers.getContractFactory("NFTRewards");
    const nftRewards = await NFTRewards.deploy(billPayment.address);
    await nftRewards.deployed();
    console.log("NFTRewards deployed to:", nftRewards.address);
    
    console.log("\n4. Deploying BillPool...");
    const BillPool = await ethers.getContractFactory("BillPool");
    const billPool = await BillPool.deploy(feeCollector);
    await billPool.deployed();
    console.log("BillPool deployed to:", billPool.address);
    
    console.log("\n5. Minting test tokens...");
    await mockUSDC.mint(deployer.address, ethers.utils.parseUnits("100000", 6));
    console.log("Minted 100,000 USDC to deployer");
    
    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("Network:", network.name);
    console.log("MockUSDC:", mockUSDC.address);
    console.log("BillPayment:", billPayment.address);
    console.log("NFTRewards:", nftRewards.address);
    console.log("BillPool:", billPool.address);
    console.log("Fee Collector:", feeCollector);
    
    const contractAddresses = {
        network: network.name,
        mockUSDC: mockUSDC.address,
        billPayment: billPayment.address,
        nftRewards: nftRewards.address,
        billPool: billPool.address,
        feeCollector: feeCollector
    };
    
    console.log("\nContract addresses JSON:");
    console.log(JSON.stringify(contractAddresses, null, 2));
    
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("\nWaiting for block confirmations...");
        await mockUSDC.deployTransaction.wait(5);
        await billPayment.deployTransaction.wait(5);
        await nftRewards.deployTransaction.wait(5);
        await billPool.deployTransaction.wait(5);
        
        console.log("\nVerifying contracts on Etherscan...");
        
        try {
            await hre.run("verify:verify", {
                address: mockUSDC.address,
                constructorArguments: [],
            });
        } catch (error) {
            console.log("MockUSDC verification failed:", error.message);
        }
        
        try {
            await hre.run("verify:verify", {
                address: billPayment.address,
                constructorArguments: [feeCollector],
            });
        } catch (error) {
            console.log("BillPayment verification failed:", error.message);
        }
        
        try {
            await hre.run("verify:verify", {
                address: nftRewards.address,
                constructorArguments: [billPayment.address],
            });
        } catch (error) {
            console.log("NFTRewards verification failed:", error.message);
        }
        
        try {
            await hre.run("verify:verify", {
                address: billPool.address,
                constructorArguments: [feeCollector],
            });
        } catch (error) {
            console.log("BillPool verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });