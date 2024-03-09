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
            2,
            { value: SendValue } 
        ); 

        // Mint an NFT to the user
        await TestNFT.mint(user.address, 1);
        await TestNFT.mint(user.address, 2);

    })

    context("Testing the set up", async function () {
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
    })

    context("Testing the functionality of the NFTtoETH method", async function () {
        beforeEach(async function () {
            // Approve the contract to transfer the NFT
            await TestNFT.connect(user).approve(FootiuMM.target, 1); // Assuming tokenId 1

            // Perform NFT to ETH swap
            const tx = await FootiuMM.connect(user).NFTtoETHSwap(1); // Assuming tokenId 1

        })

        it("removes 0.05ETH from the pool", async function () {    
            expect(await FootiuMM.getContractBalance()).to.equal(50000000000000000n)  
        })    

        it("increments the number of NFTs on sale", async function () {    
            expect(await FootiuMM.getNFTsForSale()).to.equal(1)
        })    

        it("triggers an auction", async function () {
            expect(await FootiuMM.isAuction()).to.equal(true)   
        })

        it("creates an auction with starting price equal to 0.1ETH", async function () {
            expect(await FootiuMM.startingPrice()).to.equal(ethers.parseEther("0.1"))   
        })
    })

    context("Testing the functionality of the ETHtoNFT method", async function () {
        beforeEach(async function () {
            // Approve the contract to transfer the NFT
            await TestNFT.connect(user).approve(FootiuMM.target, 1); // Assuming tokenId 1
            // Perform NFT to ETH swap
            await FootiuMM.connect(user).NFTtoETHSwap(1); // Assuming tokenId 1
            const SendValue = ethers.parseEther("0.05");
            await FootiuMM.connect(user).ETHtoNFTSwap(
                1,
                {value: SendValue}
                ); // Assuming tokenId 1

        })

        it("adds 0.05ETH to the pool", async function () {    
            expect(await FootiuMM.getContractBalance()).to.equal(100000000000000000n)  
        })    
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