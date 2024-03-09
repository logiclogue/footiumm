const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("FootiuMM", function () {
    let FootiuMM;
    let TestNFT;

    beforeEach(async function() {
        [owner, user] = await ethers.getSigners();

        const Contract2 = await ethers.getContractFactory("TestNFT");

        TestNFT = await Contract2.deploy("MyContractName", "MCN");
    
        const Contract1 = await ethers.getContractFactory("FootiuMM");
        
        const SendValue = ethers.parseEther("0.1");

        FootiuMM = await Contract1.deploy(
            TestNFT.target,
            { value: SendValue } 
        ); 

        // Mint an NFT to the user
        await TestNFT.mint(user.address, 1);
        await TestNFT.mint(user.address, 2);

    })

    it("should instantiate the NFT contract correctly", async function () {
        expect(await TestNFT.name()).to.equal("MyContractName")  
        expect(await TestNFT.symbol()).to.equal("MCN")
    })
    
    it("should instantiate the AMM contract correctly", async function () {
        expect(FootiuMM.target).to.not.equal(0x0);
    })

    it("user has 2 NFTS", async function (){
        const userBalance = await TestNFT.balanceOf(user.address);
        expect(userBalance).to.equal(2);
    })

    it("should start with 0.1ETH", async function () {
        expect(await FootiuMM.getContractBalance()).to.equal(100000000000000000n)  
    })

    it("a user sells an NFT in return for 0.05ETH", async function () {
        // Approve the contract to transfer the NFT
        await TestNFT.connect(user).approve(TestNFT.target, 1); // Assuming tokenId 1
        // Get initial ETH balance of user
        const initialUserBalance = await ethers.provider.getBalance(user.address);
        // Check if the user owns the NFT
        // Perform NFT to ETH swap
        const tx = await FootiuMM.NFTtoETHSwap(1); // Assuming tokenId 1
        
        await expectEvent(tx, "NftDeposited", {
            user: owner.address,
            nftContract: TestNFT.target,
            tokenId: 1
        })
        //The smart contract's contract balance is updated 
        expect(await FootiuMM.getContractBalance()).to.equal(50000000000000000n)  
        //The users's contract balance is updated 
        const updatedUserBalance = await ethers.provider.getBalance(user.address);

        expect(updatedUserBalance).to.equal(50000000000000000n) 

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