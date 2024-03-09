const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("FootiuMM", function () {
    let FootiuMM;
    let TestNFT;

    beforeEach(async function() {
        const Contract2 = await ethers.getContractFactory("TestNFT");
        TestNFT = await Contract2.deploy("MyContractName", "MCN");
    
        const Contract1 = await ethers.getContractFactory("FootiuMM");
        
        const SendValue = ethers.parseEther("0.1");

        FootiuMM = await Contract1.deploy(
            TestNFT.target,
            { value: SendValue } 
        ); 

    })

    it("should instantiate the NFT contract correctly", async function () {
        expect(await TestNFT.name()).to.equal("MyContractName")  
        expect(await TestNFT.symbol()).to.equal("MCN")
    })

    it("should start with 0.1ETH", async function () {
        expect(await FootiuMM.getContractBalance()).to.equal(100000000000000000n)  
    })
      
})


/**
 *  await ContractWithInitialEth.deploy({ value: ethers.utils.parseEther("0.1") });
async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }
 */