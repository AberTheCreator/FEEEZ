const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BillPayment", function () {
  let billPayment, mockUSDC, nftRewards;
  let owner, user1, user2, payee;
  let billAmount, frequency;

  beforeEach(async function () {
    [owner, user1, user2, payee] = await ethers.getSigners();
    
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();

    const NFTRewards = await ethers.getContractFactory("NFTRewards");
    nftRewards = await NFTRewards.deploy();
    await nftRewards.deployed();

    const BillPayment = await ethers.getContractFactory("BillPayment");
    billPayment = await BillPayment.deploy(nftRewards.address);
    await billPayment.deployed();

    await nftRewards.setBillPaymentContract(billPayment.address);

    billAmount = ethers.utils.parseEther("100");
    frequency = 2629746;

    await mockUSDC.mint(user1.address, ethers.utils.parseEther("1000"));
    await mockUSDC.connect(user1).approve(billPayment.address, ethers.utils.parseEther("1000"));
  });

  describe("Bill Creation", function () {
    it("Should create a bill successfully", async function () {
      await expect(
        billPayment.connect(user1).createBill(
          payee.address,
          mockUSDC.address,
          billAmount,
          frequency,
          "Monthly rent"
        )
      ).to.emit(billPayment, "BillCreated");

      const billId = await billPayment.billCounter();
      const bill = await billPayment.getBill(billId);
      
      expect(bill.payer).to.equal(user1.address);
      expect(bill.payee).to.equal(payee.address);
      expect(bill.amount).to.equal(billAmount);
      expect(bill.description).to.equal("Monthly rent");
      expect(bill.isActive).to.be.true;
    });

    it("Should reject bill with zero amount", async function () {
      await expect(
        billPayment.connect(user1).createBill(
          payee.address,
          mockUSDC.address,
          0,
          frequency,
          "Invalid bill"
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Bill Payment", function () {
    beforeEach(async function () {
      await billPayment.connect(user1).createBill(
        payee.address,
        mockUSDC.address,
        billAmount,
        frequency,
        "Monthly rent"
      );
    });

    it("Should process payment successfully", async function () {
      const billId = 1;
      const initialBalance = await mockUSDC.balanceOf(user1.address);

      await expect(
        billPayment.connect(user1).payBill(billId)
      ).to.emit(billPayment, "PaymentMade");

      const finalBalance = await mockUSDC.balanceOf(user1.address);
      expect(initialBalance.sub(finalBalance)).to.equal(billAmount);

      const bill = await billPayment.getBill(billId);
      expect(bill.totalPaid).to.equal(billAmount);
      expect(bill.streak).to.equal(1);
    });

    it("Should reject payment from non-payer", async function () {
      await expect(
        billPayment.connect(user2).payBill(1)
      ).to.be.revertedWith("Only bill payer can pay");
    });

    it("Should reject payment for inactive bill", async function () {
      await billPayment.connect(user1).toggleBillStatus(1);
      
      await expect(
        billPayment.connect(user1).payBill(1)
      ).to.be.revertedWith("Bill is not active");
    });
  });

  describe("Payment History", function () {
    it("Should track payment history correctly", async function () {
      await billPayment.connect(user1).createBill(
        payee.address,
        mockUSDC.address,
        billAmount,
        frequency,
        "Test bill"
      );

      await billPayment.connect(user1).payBill(1);
      await billPayment.connect(user1).payBill(1);

      const history = await billPayment.getPaymentHistory(user1.address);
      expect(history.length).to.equal(2);
      expect(history[0].billId).to.equal(1);
      expect(history[0].amount).to.equal(billAmount);
    });
  });

  describe("Bill Management", function () {
    beforeEach(async function () {
      await billPayment.connect(user1).createBill(
        payee.address,
        mockUSDC.address,
        billAmount,
        frequency,
        "Test bill"
      );
    });

    it("Should toggle bill status", async function () {
      let bill = await billPayment.getBill(1);
      expect(bill.isActive).to.be.true;

      await billPayment.connect(user1).toggleBillStatus(1);
      
      bill = await billPayment.getBill(1);
      expect(bill.isActive).to.be.false;
    });

    it("Should update bill details", async function () {
      const newAmount = ethers.utils.parseEther("200");
      const newFrequency = 604800;

      await billPayment.connect(user1).updateBill(
        1,
        newAmount,
        newFrequency,
        "Updated bill description"
      );

      const bill = await billPayment.getBill(1);
      expect(bill.amount).to.equal(newAmount);
      expect(bill.frequency).to.equal(newFrequency);
      expect(bill.description).to.equal("Updated bill description");
    });
  });

  describe("User Bills", function () {
    it("Should return user bills correctly", async function () {
      await billPayment.connect(user1).createBill(
        payee.address,
        mockUSDC.address,
        billAmount,
        frequency,
        "Bill 1"
      );

      await billPayment.connect(user1).createBill(
        payee.address,
        mockUSDC.address,
        billAmount,
        frequency,
        "Bill 2"
      );

      const userBills = await billPayment.getUserBills(user1.address);
      expect(userBills.length).to.equal(2);
      expect(userBills[0]).to.equal(1);
      expect(userBills[1]).to.equal(2);
    });
  });
});