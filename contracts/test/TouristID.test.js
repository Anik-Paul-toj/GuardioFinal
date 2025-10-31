const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TouristID", function () {
  let touristID;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const TouristID = await ethers.getContractFactory("TouristID");
    touristID = await TouristID.deploy();
    await touristID.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await touristID.name()).to.equal("GuardioTouristID");
      expect(await touristID.symbol()).to.equal("GTID");
    });

    it("Should set the right owner", async function () {
      expect(await touristID.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint a tourist ID successfully", async function () {
      const encryptedDataHash = "0x1234567890abcdef";
      const passportNumber = "AB123456";
      const nationality = "TestNation";
      const tokenURI = "https://example.com/metadata/1";

      await expect(
        touristID.mintTouristID(
          user1.address,
          encryptedDataHash,
          passportNumber,
          nationality,
          tokenURI
        )
      ).to.emit(touristID, "TouristIDMinted");

      expect(await touristID.ownerOf(0)).to.equal(user1.address);
      expect(await touristID.getUserTokenId(user1.address)).to.equal(0);
      expect(await touristID.hasValidTouristID(user1.address)).to.be.true;
    });

    it("Should prevent duplicate passport numbers", async function () {
      const encryptedDataHash = "0x1234567890abcdef";
      const passportNumber = "AB123456";
      const nationality = "TestNation";
      const tokenURI = "https://example.com/metadata/1";

      // First mint should succeed
      await touristID.mintTouristID(
        user1.address,
        encryptedDataHash,
        passportNumber,
        nationality,
        tokenURI
      );

      // Second mint with same passport should fail
      await expect(
        touristID.mintTouristID(
          user2.address,
          encryptedDataHash,
          passportNumber,
          nationality,
          tokenURI
        )
      ).to.be.revertedWith("Passport number already used");
    });

    it("Should prevent multiple IDs per user", async function () {
      const encryptedDataHash = "0x1234567890abcdef";
      const passportNumber1 = "AB123456";
      const passportNumber2 = "CD789012";
      const nationality = "TestNation";
      const tokenURI = "https://example.com/metadata/1";

      // First mint should succeed
      await touristID.mintTouristID(
        user1.address,
        encryptedDataHash,
        passportNumber1,
        nationality,
        tokenURI
      );

      // Second mint to same user should fail
      await expect(
        touristID.mintTouristID(
          user1.address,
          encryptedDataHash,
          passportNumber2,
          nationality,
          tokenURI
        )
      ).to.be.revertedWith("User already has a Tourist ID");
    });

    it("Should reject empty parameters", async function () {
      await expect(
        touristID.mintTouristID(
          user1.address,
          "",
          "AB123456",
          "TestNation",
          "https://example.com/metadata/1"
        )
      ).to.be.revertedWith("Data hash cannot be empty");

      await expect(
        touristID.mintTouristID(
          user1.address,
          "0x1234567890abcdef",
          "",
          "TestNation",
          "https://example.com/metadata/1"
        )
      ).to.be.revertedWith("Passport number cannot be empty");

      await expect(
        touristID.mintTouristID(
          user1.address,
          "0x1234567890abcdef",
          "AB123456",
          "",
          "https://example.com/metadata/1"
        )
      ).to.be.revertedWith("Nationality cannot be empty");
    });
  });

  describe("Data Retrieval", function () {
    beforeEach(async function () {
      await touristID.mintTouristID(
        user1.address,
        "0x1234567890abcdef",
        "AB123456",
        "TestNation",
        "https://example.com/metadata/1"
      );
    });

    it("Should return correct tourist data", async function () {
      const data = await touristID.getTouristData(0);
      
      expect(data.encryptedDataHash).to.equal("0x1234567890abcdef");
      expect(data.passportNumber).to.equal("AB123456");
      expect(data.nationality).to.equal("TestNation");
      expect(data.isActive).to.be.true;
    });

    it("Should return correct token URI", async function () {
      expect(await touristID.tokenURI(0)).to.equal("https://example.com/metadata/1");
    });
  });

  describe("Updates", function () {
    beforeEach(async function () {
      await touristID.mintTouristID(
        user1.address,
        "0x1234567890abcdef",
        "AB123456",
        "TestNation",
        "https://example.com/metadata/1"
      );
    });

    it("Should allow owner to update data", async function () {
      const newDataHash = "0xfedcba0987654321";
      const newTokenURI = "https://example.com/metadata/updated";

      await expect(
        touristID.connect(user1).updateTouristData(0, newDataHash, newTokenURI)
      ).to.emit(touristID, "TouristIDUpdated");

      const data = await touristID.getTouristData(0);
      expect(data.encryptedDataHash).to.equal(newDataHash);
      expect(await touristID.tokenURI(0)).to.equal(newTokenURI);
    });

    it("Should reject updates from non-owners", async function () {
      await expect(
        touristID.connect(user2).updateTouristData(0, "0xnewdata", "https://new.uri")
      ).to.be.revertedWith("Only token owner can update");
    });
  });

  describe("Soulbound Properties", function () {
    beforeEach(async function () {
      await touristID.mintTouristID(
        user1.address,
        "0x1234567890abcdef",
        "AB123456",
        "TestNation",
        "https://example.com/metadata/1"
      );
    });

    it("Should prevent transfers", async function () {
      await expect(
        touristID.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWith("Tourist IDs are soulbound and non-transferable");
    });

    it("Should prevent approvals", async function () {
      await expect(
        touristID.connect(user1).approve(user2.address, 0)
      ).to.be.revertedWith("Tourist IDs are soulbound and cannot be approved");
    });

    it("Should prevent approval for all", async function () {
      await expect(
        touristID.connect(user1).setApprovalForAll(user2.address, true)
      ).to.be.revertedWith("Tourist IDs are soulbound and cannot be approved");
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await touristID.mintTouristID(
        user1.address,
        "0x1234567890abcdef",
        "AB123456",
        "TestNation",
        "https://example.com/metadata/1"
      );
    });

    it("Should allow owner to revoke tourist ID", async function () {
      await expect(
        touristID.revokeTouristID(0)
      ).to.emit(touristID, "TouristIDRevoked");

      const data = await touristID.getTouristData(0);
      expect(data.isActive).to.be.false;
      expect(await touristID.hasValidTouristID(user1.address)).to.be.false;
    });

    it("Should reject revocation from non-owner", async function () {
      await expect(
        touristID.connect(user1).revokeTouristID(0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    it("Should return correct total supply", async function () {
      expect(await touristID.totalSupply()).to.equal(0);

      await touristID.mintTouristID(
        user1.address,
        "0x1234567890abcdef",
        "AB123456",
        "TestNation",
        "https://example.com/metadata/1"
      );

      expect(await touristID.totalSupply()).to.equal(1);
    });

    it("Should return false for users without tourist ID", async function () {
      expect(await touristID.hasValidTouristID(user1.address)).to.be.false;
      expect(await touristID.getUserTokenId(user1.address)).to.equal(0);
    });
  });
});
