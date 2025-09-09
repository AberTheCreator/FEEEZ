const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const network = hre.network.name;
    console.log(`🔍 Verifying FEEEZ contracts on ${network}...\n`);
    
    const deploymentFile = path.join(__dirname, "../deployments", `${network}.json`);
    
    if (!fs.existsSync(deploymentFile)) {
        console.error(" Deployment file not found. Deploy contracts first.");
        process.exit(1);
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    const contracts = deployment.contracts;
    
    console.log(" Contracts to verify:");
    Object.entries(contracts).forEach(([name, address]) => {
        console.log(`   ${name}: ${address}`);
    });
    console.log();
    
    try {
        
        console.log(" Verifying MockUSDC...");
        await verifyContract(contracts.MockUSDC, []);
        
        
        console.log(" Verifying BillPayment...");
        await verifyContract(contracts.BillPayment, [contracts.MockUSDC]);
        
        
        console.log(" Verifying NFTRewards...");
        await verifyContract(contracts.NFTRewards, [contracts.BillPayment]);
        
        
        console.log(" Verifying BillPool...");
        await verifyContract(contracts.BillPool, [contracts.MockUSDC]);
        
        console.log("\n All contracts verified successfully!");
        
    } catch (error) {
        console.error("\n Verification process failed:", error);
        process.exit(1);
    }
}

async function verifyContract(address, constructorArgs) {
    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArgs,
        });
        console.log(`  Verified: ${address}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log(`  Already verified: ${address}`);
        } else if (error.message.includes("does not have bytecode")) {
            console.log(`  Contract not found: ${address}`);
        } else {
            console.log(`  Failed to verify ${address}: ${error.message}`);
        }
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