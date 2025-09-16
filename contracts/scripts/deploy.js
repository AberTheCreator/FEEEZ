const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Starting FEEEZ deployment...\n");
    
    const [deployer] = await ethers.getSigners();
    const network = hre.network.name;
    
    console.log("📋 Deployment Details:");
    console.log("Network:", network);
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");
    
    const feeCollector = deployer.address;
    const deployedContracts = {};
    
    try {
        console.log(" Deploying MockUSDC...");
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        const mockUSDC = await MockUSDC.deploy();
        await mockUSDC.deployed();
        deployedContracts.MockUSDC = mockUSDC.address;
        console.log("✅ MockUSDC deployed to:", mockUSDC.address);
        
        console.log("\n  Deploying BillPayment...");
        const BillPayment = await ethers.getContractFactory("BillPayment");
        const billPayment = await BillPayment.deploy(deployer.address, feeCollector);
        await billPayment.deployed();
        deployedContracts.BillPayment = billPayment.address;
        console.log("✅ BillPayment deployed to:", billPayment.address);
        
        console.log("\n Deploying NFTRewards...");
        const NFTRewards = await ethers.getContractFactory("NFTRewards");
        const nftRewards = await NFTRewards.deploy(billPayment.address);
        await nftRewards.deployed();
        deployedContracts.NFTRewards = nftRewards.address;
        console.log("✅ NFTRewards deployed to:", nftRewards.address);
        
        console.log("\n Deploying BillPool...");
        const BillPool = await ethers.getContractFactory("BillPool");
        const billPool = await BillPool.deploy(feeCollector);
        await billPool.deployed();
        deployedContracts.BillPool = billPool.address;
        console.log("✅ BillPool deployed to:", billPool.address);
        
        if (network === "localhost" || network === "hardhat" || network.includes("test")) {
            console.log("\n Setting up test environment...");
            
            const mintAmount = ethers.utils.parseUnits("10000", 6); // 10,000 USDC
            await mockUSDC.mint(deployer.address, mintAmount);
            console.log(` Minted ${ethers.utils.formatUnits(mintAmount, 6)} USDC to deployer`);
        }
        
        console.log("\n6️⃣  Updating environment configuration...");
        
        const envContent = `# Smart Contract Addresses - Updated ${new Date().toISOString()}
REACT_APP_BILL_PAYMENT_ADDRESS=${billPayment.address}
REACT_APP_NFT_REWARDS_ADDRESS=${nftRewards.address}
REACT_APP_BILL_POOL_ADDRESS=${billPool.address}
REACT_APP_MOCK_USDC_ADDRESS=${mockUSDC.address}

# Network Configuration
REACT_APP_NETWORK_NAME=${network === 'localhost' || network === 'hardhat' ? 'Hardhat Local' : 'Somnia Testnet'}
REACT_APP_CHAIN_ID=${network === 'localhost' || network === 'hardhat' ? '31337' : '50311'}
REACT_APP_RPC_URL=${network === 'localhost' || network === 'hardhat' ? 'http://127.0.0.1:8545' : 'https://testnet-rpc.somnia.network'}

# AI Service Configuration (Optional)
REACT_APP_GEMINI_API_KEY=
REACT_APP_GEMINI_MODEL=gemini-pro

# Application Configuration
REACT_APP_APP_NAME=FEEEZ
REACT_APP_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true`;

        const projectRoot = path.join(__dirname, '../..');
        const envPath = path.join(projectRoot, '.env');
        const envLocalPath = path.join(projectRoot, '.env.local');
        
        fs.writeFileSync(envPath, envContent);
        fs.writeFileSync(envLocalPath, envContent);
        console.log("   ✅ Updated .env and .env.local files");
        
        const deploymentInfo = {
            network: network,
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            contracts: deployedContracts,
            chainId: network === 'localhost' || network === 'hardhat' ? 31337 : 50311,
            rpcUrl: network === 'localhost' || network === 'hardhat' ? 'http://127.0.0.1:8545' : 'https://testnet-rpc.somnia.network'
        };
        
        const deploymentDir = path.join(__dirname, "../deployments");
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        const deploymentFile = path.join(deploymentDir, `${network}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log("   ✅ Saved deployment info to:", deploymentFile);
        
        const contractsConstantContent = `// src/constants/contractAddresses.js - Auto-generated
export const CONTRACT_ADDRESSES = {
  billPayment: "${billPayment.address}",
  nftRewards: "${nftRewards.address}",
  billPool: "${billPool.address}",
  mockUSDC: "${mockUSDC.address}"
};

export const NETWORK_CONFIG = {
  chainId: ${network === 'localhost' || network === 'hardhat' ? 31337 : 50311},
  name: "${network === 'localhost' || network === 'hardhat' ? 'Hardhat Local' : 'Somnia Testnet'}",
  rpcUrl: "${network === 'localhost' || network === 'hardhat' ? 'http://127.0.0.1:8545' : 'https://testnet-rpc.somnia.network'}",
  isTestnet: true
};

export const getContractAddress = (contractName) => {
  return CONTRACT_ADDRESSES[contractName] || null;
};`;

        const contractsConstantPath = path.join(projectRoot, 'src/constants/contractAddresses.js');
        fs.writeFileSync(contractsConstantPath, contractsConstantContent);
        console.log("   ✅ Updated contract addresses constants");
        
        console.log("\n=== 🎉 DEPLOYMENT SUMMARY ===");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📍 Network:", network);
        console.log("📍 MockUSDC:", mockUSDC.address);
        console.log("📍 BillPayment:", billPayment.address);
        console.log("📍 NFTRewards:", nftRewards.address);
        console.log("📍 BillPool:", billPool.address);
        console.log("📍 Fee Collector:", feeCollector);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        console.log("\n✨ Next Steps:");
        console.log("1. Start your React app: npm start");
        console.log("2. Connect your wallet to the app");
        console.log("3. Start creating and managing bills!");
        
        if (network !== "hardhat" && network !== "localhost") {
            console.log("\n🔍 To verify contracts on block explorer:");
            console.log(`npx hardhat verify --network ${network} ${mockUSDC.address}`);
            console.log(`npx hardhat verify --network ${network} ${billPayment.address} "${deployer.address}" "${feeCollector}"`);
            console.log(`npx hardhat verify --network ${network} ${nftRewards.address} "${billPayment.address}"`);
            console.log(`npx hardhat verify --network ${network} ${billPool.address} "${feeCollector}"`);
        }
        
        console.log("\n🚀 FEEEZ deployment completed successfully!");
        
        return deployedContracts;
        
    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
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
