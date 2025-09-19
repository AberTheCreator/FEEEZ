const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting FEEEZ deployment to Somnia...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    
    console.log(" Deployment Details:");
    console.log("Network:", network);
    console.log("Deployer:", deployer.address);
    console.log("Balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");
    
    const deployedContracts = {};
    
    try {
        console.log(" Deploying MockUSDC...");
        const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
        const mockUSDC = await MockUSDC.deploy();
        await mockUSDC.deployed();
        deployedContracts.MockUSDC = mockUSDC.address;
        console.log(" MockUSDC deployed to:", mockUSDC.address);
        
        console.log("\n Deploying BillPayment...");
        const BillPayment = await hre.ethers.getContractFactory("BillPayment");
        const billPayment = await BillPayment.deploy(mockUSDC.address);
        await billPayment.deployed();
        deployedContracts.BillPayment = billPayment.address;
        console.log(" BillPayment deployed to:", billPayment.address);
        
        console.log("\n  Deploying NFTRewards...");
        const NFTRewards = await hre.ethers.getContractFactory("NFTRewards");
        const nftRewards = await NFTRewards.deploy(billPayment.address);
        await nftRewards.deployed();
        deployedContracts.NFTRewards = nftRewards.address;
        console.log(" NFTRewards deployed to:", nftRewards.address);
        
        console.log("\n  Deploying BillPool...");
        const BillPool = await hre.ethers.getContractFactory("BillPool");
        const billPool = await BillPool.deploy(mockUSDC.address);
        await billPool.deployed();
        deployedContracts.BillPool = billPool.address;
        console.log(" BillPool deployed to:", billPool.address);
        
        console.log("\n  Setting up contract connections...");
        
        console.log("   Connecting BillPayment to NFTRewards...");
        const setNFTTx = await billPayment.setNFTRewardsContract(nftRewards.address);
        await setNFTTx.wait();
        console.log("    Connected!");
        
        if (network === "localhost" || network === "hardhat" || network.includes("test")) {
            console.log("\n Setting up test environment...");
            
            console.log("   💰 Minting test tokens...");
            const mintAmount = hre.ethers.utils.parseUnits("10000", 6); 
            
            const accounts = await hre.ethers.getSigners();
            for (let i = 0; i < Math.min(5, accounts.length); i++) {
                await mockUSDC.mint(accounts[i].address, mintAmount);
                console.log(`   ✅ Minted ${hre.ethers.utils.formatUnits(mintAmount, 6)} USDC to ${accounts[i].address}`);
            }
        }
        
        console.log("\n Saving deployment information...");
        
        const deploymentInfo = {
            network: network,
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            contracts: deployedContracts,
            gasUsed: {
                MockUSDC: (await mockUSDC.deployTransaction.wait()).gasUsed.toString(),
                BillPayment: (await billPayment.deployTransaction.wait()).gasUsed.toString(),
                NFTRewards: (await nftRewards.deployTransaction.wait()).gasUsed.toString(),
                BillPool: (await billPool.deployTransaction.wait()).gasUsed.toString()
            }
        };
        
        const deploymentDir = path.join(__dirname, "../deployments");
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir);
        }
        
        const deploymentFile = path.join(deploymentDir, `${network}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        
        const contractConfig = {
            chainId: network === "somnia-testnet" ? 50312 : network === "somnia" ? 2323 : 31337,
            rpcUrl: network === "somnia-testnet" ? "https://dream-rpc.somnia.network/" : 
                   network === "somnia" ? "https://rpc.somnia.network" : "http://localhost:8545",
            contracts: {
                MockUSDC: {
                    address: mockUSDC.address,
                    abi: "MockUSDC"
                },
                BillPayment: {
                    address: billPayment.address,
                    abi: "BillPayment"
                },
                NFTRewards: {
                    address: nftRewards.address,
                    abi: "NFTRewards"
                },
                BillPool: {
                    address: billPool.address,
                    abi: "BillPool"
                }
            }
        };
        
        const configFile = path.join(__dirname, "../contracts/contractConfig.js");
        const configContent = `module.exports = ${JSON.stringify(contractConfig, null, 2)};`;
        fs.writeFileSync(configFile, configContent);
        
        console.log("Deployment file saved:", deploymentFile);
        console.log(" Contract config saved:", configFile);
        
        
        console.log("\n  Deployment Summary:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📍 Network:", network);
        console.log("📍 MockUSDC:", mockUSDC.address);
        console.log("📍 BillPayment:", billPayment.address);
        console.log("📍 NFTRewards:", nftRewards.address);
        console.log("📍 BillPool:", billPool.address);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        if (network !== "localhost" && network !== "hardhat") {
            console.log("\n🔍 To verify contracts, run:");
            console.log(`npx hardhat verify --network ${network} ${mockUSDC.address}`);
            console.log(`npx hardhat verify --network ${network} ${billPayment.address} "${mockUSDC.address}"`);
            console.log(`npx hardhat verify --network ${network} ${nftRewards.address} "${billPayment.address}"`);
            console.log(`npx hardhat verify --network ${network} ${billPool.address} "${mockUSDC.address}"`);
        }
        
        console.log("\n FEEEZ deployment completed successfully!");
        
        return deployedContracts;
        
    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    }
}

async function verify(contractAddress, constructorArguments = []) {
    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArguments,
        });
        console.log(`Verified contract at ${contractAddress}`);
    } catch (error) {
        console.log(` Verification failed for ${contractAddress}:`, error.message);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;