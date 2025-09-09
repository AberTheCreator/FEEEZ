const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTRewards Contract", function () {
    let nftRewards, billPayment, mockUSDC;
    let owner, user1, user2, user3;
    
    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();
        
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.deployed();
        
        const BillPayment = await ethers.getContractFactory("BillPayment");
        billPayment = await BillPayment.deploy(mockUSDC.address);
        await billPayment.deployed();
        
        const NFTRewards = await ethers.getContractFactory("NFTRewards");
        nftRewards = await NFTRewards.deploy(billPayment.address);
        await nftRewards.deployed();
        
        await billPayment.setNFTRewardsContract(nftRewards.address);
    });
    
    describe("Deployment", function () {
        it("Should set the correct bill payment contract", async function () {
            expect(await nftRewards.billPaymentContract()).to.equal(billPayment.address);
        });
        
        it("Should set the correct owner", async function () {
            expect(await nftRewards.owner()).to.equal(owner.address);
        });
        
        it("Should have correct name and symbol", async function () {
            expect(await nftRewards.name()).to.equal("FEEEZ Loyalty Rewards");
            expect(await nftRewards.symbol()).to.equal("FLR");
        });
    });
    
    describe("Reward Tier Calculation", function () {
        it("Should return Bronze for 1-4 payments", async function () {
            expect(await nftRewards.getRewardTier(3, ethers.utils.parseUnits("150", 6))).to.equal(0); // Bronze
        });
        
        it("Should return Silver for 5-9 payments", async function () {
            expect(await nftRewards.getRewardTier(7, ethers.utils.parseUnits("350", 6))).to.equal(1); // Silver
        });
        
        it("Should return Gold for 10-19 payments", async function () {
            expect(await nftRewards.getRewardTier(15, ethers.utils.parseUnits("750", 6))).to.equal(2); // Gold
        });
        
        it("Should return Platinum for 20-49 payments", async function () {
            expect(await nftRewards.getRewardTier(25, ethers.utils.parseUnits("1250", 6))).to.equal(3); // Platinum
        });
        
        it("Should return Diamond for 50+ payments", async function () {
            expect(await nftRewards.getRewardTier(60, ethers.utils.parseUnits("3000", 6))).to.equal(4); // Diamond
        });
    });
    
    describe("NFT Minting", function () {
        it("Should mint Bronze NFT for eligible user", async function () {
            const paymentsCount = 5;
            const totalPaid = ethers.utils.parseUnits("250", 6);
            
            await expect(nftRewards.connect(billPayment.signer).mintRewardNFT(user1.address, paymentsCount, totalPaid))
                .to.emit(nftRewards, "NFTMinted")
                .withArgs(1, user1.address, 1, paymentsCount); // Silver tier
                
            expect(await nftRewards.balanceOf(user1.address)).to.equal(1);
            expect(await nftRewards.ownerOf(1)).to.equal(user1.address);
        });
        
        it("Should only allow bill payment contract to mint", async function () {
            await expect(nftRewards.connect(user1).mintRewardNFT(user1.address, 5, 250))
                .to.be.revertedWith("Only bill payment contract");
        });
        
        it("Should track user NFTs correctly", async function () {
            await nftRewards.connect(billPayment.signer).mintRewardNFT(user1.address, 5, ethers.utils.parseUnits("250", 6));
            await nftRewards.connect(billPayment.signer).mintRewardNFT(user1.address, 10, ethers.utils.parseUnits("500", 6));
            
            const userNFTs = await nftRewards.getUserNFTs(user1.address);
            expect(userNFTs.length).to.equal(2);
            expect(userNFTs[0]).to.equal(1);
            expect(userNFTs[1]).to.equal(2);
        });
    });
    
    describe("NFT Upgrading", function () {
        beforeEach(async function () {
            await nftRewards.connect(billPayment.signer).mintRewardNFT(user1.address, 5, ethers.utils.parseUnits("250", 6));
        });
        
        it("Should upgrade NFT tier when eligible", async function () {
            await expect(nftRewards.connect(billPayment.signer).upgradeNFTTier(1))
                .to.emit(nftRewards, "TierUpgraded");
        });
        
        it("Should only allow bill payment contract to upgrade", async function () {
            await expect(nftRewards.connect(user1).upgradeNFTTier(1))
                .to.be.revertedWith("Only bill payment contract");
        });
    });
    
    describe("Reward Claiming", function () {
        it("Should check eligibility correctly", async function () {
            expect(await nftRewards.isEligibleForReward(user1.address)).to.equal(false);
        });
        
        it("Should allow eligible users to claim rewards", async function () {
            await nftRewards.connect(billPayment.signer).mintRewardNFT(user1.address, 5, ethers.utils.parseUnits("250", 6));
            
            const tokenId = await nftRewards.claimReward(user1.address);
            expect(tokenId).to.equal(1);
        });
    });
    
    describe("Metadata and URI", function () {
        beforeEach(async function () {
            await nftRewards.connect(billPayment.signer).mintRewardNFT(user1.address, 5, ethers.utils.parseUnits("250", 6));
        });
        
        it("Should return correct token URI", async function () {
            const tokenURI = await nftRewards.tokenURI(1);
            expect(tokenURI).to.include("Silver");
        });
        
        it("Should update base URI", async function () {
            const newBaseURI = "https://api.feeez.com/metadata/";
            await nftRewards.setBaseURI(newBaseURI);
            expect(await nftRewards.baseURI()).to.equal(newBaseURI);
        });
    });
    
    describe("Access Control", function () {
        it("Should allow owner to pause contract", async function () {
            await nftRewards.pause();
            expect(await nftRewards.paused()).to.equal(true);
        });
        
        it("Should not allow non-owner to pause", async function () {
            await expect(nftRewards.connect(user1).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("Should prevent minting when paused", async function () {
            await nftRewards.pause();
            await expect(nftRewards.connect(billPayment.signer).mintRewardNFT(user1.address, 5, ethers.utils.parseUnits("250", 6)))
                .to.be.revertedWith("Pausable: paused");
        });
    });
    
    describe("Edge Cases", function () {
        it("Should handle zero payments correctly", async function () {
            expect(await nftRewards.getRewardTier(0, 0)).to.equal(0); // Bronze (minimum)
        });
        
        it("Should handle very large payment amounts", async function () {
            const largeAmount = ethers.utils.parseUnits("1000000", 6); // 1M USDC
            expect(await nftRewards.getRewardTier(100, largeAmount)).to.equal(4); // Diamond
        });
        
        it("Should revert for non-existent token", async function () {
            await expect(nftRewards.tokenURI(999)).to.be.revertedWith("Token does not exist");
        });
    });
});