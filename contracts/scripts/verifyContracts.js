const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🎭 Setting up mock data for FEEEZ demo...\n");
    
    const network = hre.network.name;
    const deploymentFile = path.join(__dirname, "../deployments", `${network}.json`);
    
    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ Deployment file not found. Deploy contracts first.");
        process.exit(1);
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    const contracts = deployment.contracts;
    
    const [deployer, user1, user2, user3, payee] = await hre.ethers.getSigners();
    
    console.log("👥 Demo Accounts:");
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    console.log("User3:", user3.address);
    console.log("Payee:", payee.address, "\n");
    
    const mockUSDC = await hre.ethers.getContractAt("MockUSDC", contracts.MockUSDC);
    const billPayment = await hre.ethers.getContractAt("BillPayment", contracts.BillPayment);
    const nftRewards = await hre.ethers.getContractAt("NFTRewards", contracts.NFTRewards);
    const billPool = await hre.ethers.getContractAt("BillPool", contracts.BillPool);
    
    try {
        
        console.log("1️⃣  Minting demo tokens...");
        const mintAmount = hre.ethers.utils.parseUnits("5000", 6); // 5,000 USDC each
        
        const users = [user1, user2, user3, payee];
        for (const user of users) {
            await mockUSDC.mint(user.address, mintAmount);
            console.log(`   💰 Minted ${hre.ethers.utils.formatUnits(mintAmount, 6)} USDC to ${user.address}`);
        }
        
        console.log("\n2️⃣  Setting up token approvals...");
        const approveAmount = hre.ethers.utils.parseUnits("2500", 6);
        
        for (const user of [user1, user2, user3]) {
            await mockUSDC.connect(user).approve(billPayment.address, approveAmount);
            await mockUSDC.connect(user).approve(billPool.address, approveAmount);
            console.log(`   ✅ Approved ${hre.ethers.utils.formatUnits(approveAmount, 6)} USDC for ${user.address}`);
        }
        
        console.log("\n3️⃣  Creating sample bills...");
        
        const sampleBills = [
            {
                description: "Electricity Bill - January 2024",
                amount: hre.ethers.utils.parseUnits("120", 6),
                dueInDays: 15,
                recurring: false
            },
            {
                description: "Internet Bill - Monthly",
                amount: hre.ethers.utils.parseUnits("79.99", 6),
                dueInDays: 7,
                recurring: true,
                interval: 30 * 24 * 60 * 60 // 30 days
            },
            {
                description: "Water Bill - Q1 2024",
                amount: hre.ethers.utils.parseUnits("85", 6),
                dueInDays: 20,
                recurring: false
            },
            {
                description: "Gas Bill - Monthly",
                amount: hre.ethers.utils.parseUnits("65", 6),
                dueInDays: 10,
                recurring: true,
                interval: 30 * 24 * 60 * 60
            }
        ];
        
        const currentTime = await hre.ethers.provider.getBlock('latest').then(b => b.timestamp);
        
        for (let i = 0; i < sampleBills.length; i++) {
            const bill = sampleBills[i];
            const dueDate = currentTime + (bill.dueInDays * 24 * 60 * 60);
            
            await billPayment.connect(user1).createBill(
                payee.address,
                bill.amount,
                dueDate,
                bill.interval || 0,
                bill.recurring ? 1 : 0, // PaymentType enum
                bill.description,
                bill.recurring
            );
            
            console.log(`   📄 Created: ${bill.description} - ${hre.ethers.utils.formatUnits(bill.amount, 6)} USDC`);
        }
        
        console.log("\n4️⃣  Paying sample bills...");
        
        await billPayment.connect(user1).payBill(1);
        console.log("   💳 Paid Bill #1 (Electricity)");
        
        await billPayment.connect(user1).payBill(2);
        console.log("   💳 Paid Bill #2 (Internet)");
        
     
        console.log("   ⏳ Simulating escrow period...");
        await hre.network.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]); // 4 days
        await hre.network.provider.send("evm_mine");
        
      
        await billPayment.connect(payee).releaseEscrow(1);
        await billPayment.connect(payee).releaseEscrow(2);
        console.log("   🔓 Released escrow for paid bills");
        
        console.log("\n5️⃣  Creating sample bill pools...");
        
        const samplePools = [
            {
                description: "Shared Apartment Rent - March 2024",
                target: hre.ethers.utils.parseUnits("1200", 6),
                deadline: 14, // days
                minContrib: hre.ethers.utils.parseUnits("200", 6),
                maxContrib: hre.ethers.utils.parseUnits("600", 6)
            },
            {
                description: "Office Electricity Bill Split",
                target: hre.ethers.utils.parseUnits("350", 6),
                deadline: 10,
                minContrib: hre.ethers.utils.parseUnits("50", 6),
                maxContrib: hre.ethers.utils.parseUnits("150", 6)
            }
        ];
        
        for (const pool of samplePools) {
            const deadline = currentTime + (pool.deadline * 24 * 60 * 60);
            
            await billPool.connect(user1).createPool(
                pool.description,
                pool.target,
                deadline,
                pool.minContrib,
                pool.maxContrib
            );
            
            console.log(`   🏊 Created pool: ${pool.description} - Target: ${hre.ethers.utils.formatUnits(pool.target, 6)} USDC`);
        }
        
        console.log("\n6️⃣  Adding pool contributions...");
        
        await billPool.connect(user1).contributeToPool(1, hre.ethers.utils.parseUnits("400", 6));
        await billPool.connect(user2).contributeToPool(1, hre.ethers.utils.parseUnits("400", 6));
        await billPool.connect(user3).contributeToPool(1, hre.ethers.utils.parseUnits("400", 6));
        console.log("   💰 Pool #1 fully funded!");
        
        await billPool.connect(user2).contributeToPool(2, hre.ethers.utils.parseUnits("100", 6));
        await billPool.connect(user3).contributeToPool(2, hre.ethers.utils.parseUnits("125", 6));
        console.log("   💰 Pool #2 partially funded (225/350 USDC)");
        
        console.log("\n7️⃣  Creating payment history for NFT rewards...");
        
        const quickBills = [
            { amount: "50", desc: "Quick Bill 1" },
            { amount: "75", desc: "Quick Bill 2" },
            { amount: "100", desc: "Quick Bill 3" }
        ];
        
        for (let i = 0; i < quickBills.length; i++) {
            const bill = quickBills[i];
            const dueDate = currentTime + (7 * 24 * 60 * 60); // 1 week
            
            await billPayment.connect(user1).createBill(
                payee.address,
                hre.ethers.utils.parseUnits(bill.amount, 6),
                dueDate,
                0, 0,
                bill.desc,
                false
            );
            
            await billPayment.connect(user1).payBill(5 + i);
            console.log(`   📄 Created and paid: ${bill.desc}`);
        }
        
        await hre.network.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
        await hre.network.provider.send("evm_mine");
        
        for (let i = 5; i <= 7; i++) {
            await billPayment.connect(payee).releaseEscrow(i);
        }
        
        console.log("   🔓 Released escrow for all quick bills");
        
        console.log("\n8️⃣  Demo Setup Summary:");
        console.log

        const user1Bills = await billPayment.getUserBills(user1.address);
        const user1PaymentCount = await billPayment.getUserPaymentCount(user1.address);
        console.log(` User1 has ${user1Bills.length} bills, ${user1PaymentCount} payments made`);
        
       
        const pool1 = await billPool.getPool(1);
        const pool2 = await billPool.getPool(2);
        console.log(`Pool 1: ${hre.ethers.utils.formatUnits(pool1.currentAmount, 6)}/${hre.ethers.utils.formatUnits(pool1.targetAmount, 6)} USDC`);
        console.log(`Pool 2: ${hre.ethers.utils.formatUnits(pool2.currentAmount, 6)}/${hre.ethers.utils.formatUnits(pool2.targetAmount, 6)} USDC`);
        
        const isEligible = await nftRewards.isEligibleForReward(user1.address);
        console.log(` User1 NFT eligible: ${isEligible}`);
        
       
        const user1Balance = await mockUSDC.balanceOf(user1.address);
        const payeeBalance = await mockUSDC.balanceOf(payee.address);
        console.log(`User1 USDC balance: ${hre.ethers.utils.formatUnits(user1Balance, 6)}`);
        console.log(`Payee USDC balance: ${hre.ethers.utils.formatUnits(payeeBalance, 6)}`);
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        const demoState = {
            network: network,
            timestamp: new Date().toISOString(),
            accounts: {
                deployer: deployer.address,
                user1: user1.address,
                user2: user2.address,
                user3: user3.address,
                payee: payee.address
            },
            stats: {
                totalBills: user1Bills.length.toString(),
                paidBills: user1PaymentCount.toString(),
                activePools: 2,
                fundedPools: 1
            },
            balances: {
                user1USDC: hre.ethers.utils.formatUnits(user1Balance, 6),
                payeeUSDC: hre.ethers.utils.formatUnits(payeeBalance, 6)
            }
        };
        
        const demoFile = path.join(__dirname, "../deployments", `${network}-demo.json`);
        fs.writeFileSync(demoFile, JSON.stringify(demoState, null, 2));
        console.log(`Demo state saved: ${demoFile}`);
        
        console.log("\n🎉 Mock data setup completed successfully!");
        console.log("🚀 Your FEEEZ demo is ready!");
        
    } catch (error) {
        console.error("\n❌ Mock data setup failed:", error);
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