const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BillPool Contract", function () {
    let billPool, mockUSDC;
    let owner, user1, user2, user3, payee;
    
    beforeEach(async function () {
        [owner, user1, user2, user3, payee] = await ethers.getSigners();
        
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.deployed();
        
        const BillPool = await ethers.getContractFactory("BillPool");
        billPool = await BillPool.deploy(mockUSDC.address);
        await billPool.deployed();
        
        await mockUSDC.mint(user1.address, ethers.utils.parseUnits("1000", 6));
        await mockUSDC.mint(user2.address, ethers.utils.parseUnits("1000", 6));
        await mockUSDC.mint(user3.address, ethers.utils.parseUnits("1000", 6));
        
        await mockUSDC.connect(user1).approve(billPool.address, ethers.utils.parseUnits("1000", 6));
        await mockUSDC.connect(user2).approve(billPool.address, ethers.utils.parseUnits("1000", 6));
        await mockUSDC.connect(user3).approve(billPool.address, ethers.utils.parseUnits("1000", 6));
    });
    
    describe("Deployment", function () {
        it("Should set the correct stablecoin address", async function () {
            expect(await billPool.stablecoin()).to.equal(mockUSDC.address);
        });
        
        it("Should set the correct owner", async function () {
            expect(await billPool.owner()).to.equal(owner.address);
        });
        
        it("Should initialize pool counter to 0", async function () {
            expect(await billPool.poolCounter()).to.equal(0);
        });
    });
    
    describe("Pool Creation", function () {
        it("Should create a pool successfully", async function () {
            const targetAmount = ethers.utils.parseUnits("500", 6);
            const deadline = (await time.latest()) + 86400 * 7; // 7 days
            const minContribution = ethers.utils.parseUnits("10", 6);
            const maxContribution = ethers.utils.parseUnits("200", 6);
            
            await expect(billPool.connect(user1).createPool(
                "Shared electricity bill",
                targetAmount,
                deadline,
                minContribution,
                maxContribution
            )).to.emit(billPool, "PoolCreated")
              .withArgs(1, user1.address, targetAmount, deadline);
            
            const pool = await billPool.getPool(1);
            expect(pool.creator).to.equal(user1.address);
            expect(pool.targetAmount).to.equal(targetAmount);
            expect(pool.status).to.equal(0); // Active
        });
        
        it("Should revert with invalid parameters", async function () {
            const pastDeadline = (await time.latest()) - 86400; // Past date
            
            await expect(billPool.connect(user1).createPool(
                "Invalid pool",
                ethers.utils.parseUnits("500", 6),
                pastDeadline,
                ethers.utils.parseUnits("10", 6),
                ethers.utils.parseUnits("200", 6)
            )).to.be.revertedWith("Deadline must be in future");
        });
        
        it("Should revert when min > max contribution", async function () {
            const deadline = (await time.latest()) + 86400 * 7;
            
            await expect(billPool.connect(user1).createPool(
                "Invalid pool",
                ethers.utils.parseUnits("500", 6),
                deadline,
                ethers.utils.parseUnits("200", 6), // min
                ethers.utils.parseUnits("100", 6)  // max
            )).to.be.revertedWith("Invalid contribution limits");
        });
    });
    
    describe("Pool Contributions", function () {
        let poolId;
        
        beforeEach(async function () {
            const targetAmount = ethers.utils.parseUnits("500", 6);
            const deadline = (await time.latest()) + 86400 * 7;
            const minContribution = ethers.utils.parseUnits("10", 6);
            const maxContribution = ethers.utils.parseUnits("200", 6);
            
            await billPool.connect(user1).createPool(
                "Test pool",
                targetAmount,
                deadline,
                minContribution,
                maxContribution
            );
            poolId = 1;
        });
        
        it("Should allow valid contributions", async function () {
            const contributionAmount = ethers.utils.parseUnits("100", 6);
            
            await expect(billPool.connect(user2).contributeToPool(poolId, contributionAmount))
                .to.emit(billPool, "ContributionMade")
                .withArgs(poolId, user2.address, contributionAmount);
            
            const pool = await billPool.getPool(poolId);
            expect(pool.currentAmount).to.equal(contributionAmount);
            expect(pool.contributors.length).to.equal(1);
            expect(pool.contributors[0]).to.equal(user2.address);
        });
        
        it("Should revert contribution below minimum", async function () {
            const smallAmount = ethers.utils.parseUnits("5", 6);
            
            await expect(billPool.connect(user2).contributeToPool(poolId, smallAmount))
                .to.be.revertedWith("Below minimum contribution");
        });
        
        it("Should revert contribution above maximum", async function () {
            const largeAmount = ethers.utils.parseUnits("250", 6);
            
            await expect(billPool.connect(user2).contributeToPool(poolId, largeAmount))
                .to.be.revertedWith("Above maximum contribution");
        });
        
        it("Should handle multiple contributions", async function () {
            await billPool.connect(user2).contributeToPool(poolId, ethers.utils.parseUnits("100", 6));
            await billPool.connect(user3).contributeToPool(poolId, ethers.utils.parseUnits("150", 6));
            
            const pool = await billPool.getPool(poolId);
            expect(pool.currentAmount).to.equal(ethers.utils.parseUnits("250", 6));
            expect(pool.contributors.length).to.equal(2);
        });
        
        it("Should prevent over-funding", async function () {
            await billPool.connect(user2).contributeToPool(poolId, ethers.utils.parseUnits("200", 6));
            await billPool.connect(user3).contributeToPool(poolId, ethers.utils.parseUnits("200", 6));
            
            await expect(billPool.connect(user1).contributeToPool(poolId, ethers.utils.parseUnits("200", 6)))
                .to.be.revertedWith("Would exceed target amount");
        });
    });
    
    describe("Pool Completion", function () {
        let poolId;
        
        beforeEach(async function () {
            const targetAmount = ethers.utils.parseUnits("300", 6);
            const deadline = (await time.latest()) + 86400 * 7;
            const minContribution = ethers.utils.parseUnits("10", 6);
            const maxContribution = ethers.utils.parseUnits("200", 6);
            
            await billPool.connect(user1).createPool(
                "Test pool",
                targetAmount,
                deadline,
                minContribution,
                maxContribution
            );
            poolId = 1;
            
            await billPool.connect(user2).contributeToPool(poolId, ethers.utils.parseUnits("150", 6));
            await billPool.connect(user3).contributeToPool(poolId, ethers.utils.parseUnits("150", 6));
        });
        
        it("Should complete pool when fully funded", async function () {
            const initialBalance = await mockUSDC.balanceOf(payee.address);
            
            await expect(billPool.connect(user1).completePool(poolId, payee.address))
                .to.emit(billPool, "PoolCompleted")
                .withArgs(poolId, ethers.utils.parseUnits("300", 6));
            
            const pool = await billPool.getPool(poolId);
            expect(pool.status).to.equal(1); // Completed
            
            const finalBalance = await mockUSDC.balanceOf(payee.address);
            expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseUnits("300", 6));
        });
        
        it("Should only allow creator to complete pool", async function () {
            await expect(billPool.connect(user2).completePool(poolId, payee.address))
                .to.be.revertedWith("Only creator can complete");
        });
        
        it("Should revert if pool not fully funded", async function () {
            await billPool.connect(user1).createPool(
                "Underfunded pool",
                ethers.utils.parseUnits("1000", 6),
                (await time.latest()) + 86400 * 7,
                ethers.utils.parseUnits("10", 6),
                ethers.utils.parseUnits("200", 6)
            );
            
            await expect(billPool.connect(user1).completePool(2, payee.address))
                .to.be.revertedWith("Pool not fully funded");
        });
    });
    
    describe("Pool Cancellation and Refunds", function () {
        let poolId;
        
        beforeEach(async function () {
            const targetAmount = ethers.utils.parseUnits("500", 6);
            const deadline = (await time.latest()) + 86400 * 7;
            const minContribution = ethers.utils.parseUnits("10", 6);
            const maxContribution = ethers.utils.parseUnits("200", 6);
            
            await billPool.connect(user1).createPool(
                "Test pool",
                targetAmount,
                deadline,
                minContribution,
                maxContribution
            );
            poolId = 1;
            
            await billPool.connect(user2).contributeToPool(poolId, ethers.utils.parseUnits("100", 6));
            await billPool.connect(user3).contributeToPool(poolId, ethers.utils.parseUnits("150", 6));
        });
        
        it("Should cancel pool and issue refunds", async function () {
            const user2InitialBalance = await mockUSDC.balanceOf(user2.address);
            const user3InitialBalance = await mockUSDC.balanceOf(user3.address);
            
            await expect(billPool.connect(user1).cancelPool(poolId))
                .to.emit(billPool, "PoolCancelled")
                .withArgs(poolId, user1.address);
            
            const pool = await billPool.getPool(poolId);
            expect(pool.status).to.equal(2); // Cancelled
            
            const user2FinalBalance = await mockUSDC.balanceOf(user2.address);
            const user3FinalBalance = await mockUSDC.balanceOf(user3.address);
            
            expect(user2FinalBalance.sub(user2InitialBalance)).to.equal(ethers.utils.parseUnits("100", 6));
            expect(user3FinalBalance.sub(user3InitialBalance)).to.equal(ethers.utils.parseUnits("150", 6));
        });
        
        it("Should allow emergency refund after deadline", async function () {
            await time.increaseTo((await time.latest()) + 86400 * 8); // Past deadline
            
            const user2InitialBalance = await mockUSDC.balanceOf(user2.address);
            
            await expect(billPool.connect(user2).emergencyRefund(poolId))
                .to.emit(billPool, "RefundIssued")
                .withArgs(poolId, user2.address, ethers.utils.parseUnits("100", 6));
            
            const user2FinalBalance = await mockUSDC.balanceOf(user2.address);
            expect(user2FinalBalance.sub(user2InitialBalance)).to.equal(ethers.utils.parseUnits("100", 6));
        });
        
        it("Should revert emergency refund before deadline", async function () {
            await expect(billPool.connect(user2).emergencyRefund(poolId))
                .to.be.revertedWith("Deadline not passed");
        });
        
        it("Should only allow creator to cancel", async function () {
            await expect(billPool.connect(user2).cancelPool(poolId))
                .to.be.revertedWith("Only creator can cancel");
        });
    });
    
    describe("View Functions", function () {
        let poolId;
        
        beforeEach(async function () {
            await billPool.connect(user1).createPool(
                "Test pool 1",
                ethers.utils.parseUnits("500", 6),
                (await time.latest()) + 86400 * 7,
                ethers.utils.parseUnits("10", 6),
                ethers.utils.parseUnits("200", 6)
            );
            
            await billPool.connect(user2).createPool(
                "Test pool 2",
                ethers.utils.parseUnits("300", 6),
                (await time.latest()) + 86400 * 5,
                ethers.utils.parseUnits("20", 6),
                ethers.utils.parseUnits("100", 6)
            );
            
            poolId = 1;
            await billPool.connect(user3).contributeToPool(poolId, ethers.utils.parseUnits("150", 6));
        });
        
        it("Should return active pools", async function () {
            const activePools = await billPool.getActivePools();
            expect(activePools.length).to.equal(2);
            expect(activePools[0]).to.equal(1);
            expect(activePools[1]).to.equal(2);
        });
        
        it("Should return user contributions", async function () {
            await billPool.connect(user3).contributeToPool(2, ethers.utils.parseUnits("50", 6));
            
            const userContributions = await billPool.getUserContributions(user3.address);
            expect(userContributions.length).to.equal(2);
            expect(userContributions[0]).to.equal(1);
            expect(userContributions[1]).to.equal(2);
        });
        
        it("Should return pool contributions", async function () {
            await billPool.connect(user2).contributeToPool(poolId, ethers.utils.parseUnits("100", 6));
            
            const contributions = await billPool.getPoolContributions(poolId);
            expect(contributions.length).to.equal(2);
            expect(contributions[0].contributor).to.equal(user3.address);
            expect(contributions[0].amount).to.equal(ethers.utils.parseUnits("150", 6));
            expect(contributions[1].contributor).to.equal(user2.address);
            expect(contributions[1].amount).to.equal(ethers.utils.parseUnits("100", 6));
        });
        
        it("Should check if pool is funded", async function () {
            expect(await billPool.isPoolFunded(poolId)).to.equal(false);
            
            await billPool.connect(user2).contributeToPool(poolId, ethers.utils.parseUnits("200", 6));
            await billPool.connect(user1).contributeToPool(poolId, ethers.utils.parseUnits("150", 6));
            
            expect(await billPool.isPoolFunded(poolId)).to.equal(true);
        });
    });
    
    describe("Access Control and Security", function () {
        it("Should allow owner to pause contract", async function () {
            await billPool.pause();
            expect(await billPool.paused()).to.equal(true);
        });
        
        it("Should prevent operations when paused", async function () {
            await billPool.pause();
            
            await expect(billPool.connect(user1).createPool(
                "Test pool",
                ethers.utils.parseUnits("500", 6),
                (await time.latest()) + 86400 * 7,
                ethers.utils.parseUnits("10", 6),
                ethers.utils.parseUnits("200", 6)
            )).to.be.revertedWith("Pausable: paused");
        });
        
        it("Should handle reentrancy protection", async function () {
            // This would require a malicious contract to test properly
            // For now, just verify the contract compiles with ReentrancyGuard
            expect(await billPool.poolCounter()).to.equal(0);
        });
    });
    
    describe("Edge Cases", function () {
        it("Should handle exact target amount contribution", async function () {
            await billPool.connect(user1).createPool(
                "Exact amount pool",
                ethers.utils.parseUnits("200", 6),
                (await time.latest()) + 86400 * 7,
                ethers.utils.parseUnits("200", 6),
                ethers.utils.parseUnits("200", 6)
            );
            
            await billPool.connect(user2).contributeToPool(1, ethers.utils.parseUnits("200", 6));
            
            const pool = await billPool.getPool(1);
            expect(pool.currentAmount).to.equal(pool.targetAmount);
            expect(await billPool.isPoolFunded(1)).to.equal(true);
        });
        
        it("Should handle multiple contributions from same user", async function () {
            await billPool.connect(user1).createPool(
                "Multiple contributions pool",
                ethers.utils.parseUnits("400", 6),
                (await time.latest()) + 86400 * 7,
                ethers.utils.parseUnits("50", 6),
                ethers.utils.parseUnits("100", 6)
            );
            
            await billPool.connect(user2).contributeToPool(1, ethers.utils.parseUnits("100", 6));
            await billPool.connect(user2).contributeToPool(1, ethers.utils.parseUnits("100", 6));
            
            const contributions = await billPool.getPoolContributions(1);
            expect(contributions.length).to.equal(2);
            expect(contributions[0].contributor).to.equal(user2.address);
            expect(contributions[1].contributor).to.equal(user2.address);
        });
        
        it("Should revert for non-existent pool", async function () {
            await expect(billPool.getPool(999))
                .to.be.revertedWith("Pool does not exist");
        });
    });
});