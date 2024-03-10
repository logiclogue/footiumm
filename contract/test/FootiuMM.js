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
            TestNFT.target
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
    })

    context("Testing add LP positions", async function () { 
        context("Testing adding ETH to the pool", async function () {
            it("deposits 10 ETH correctly", async function () {
                const SendValue = ethers.parseEther("10");

                await FootiuMM.donateEth({value:SendValue})
    
                expect(await FootiuMM.totalEthInBalance()).to.equal(SendValue)                    
            })
        })

        context("Testing adding NFT to the pool", async function () {
            beforeEach(async function() {
                TestNFT.mint(owner.address, 3);
            });

            it("deposits an NFT correctly", async function () {
                await TestNFT.approve(FootiuMM.target, 3); // Assuming tokenId 1

                await FootiuMM.donateNft(3);
    
                expect(await FootiuMM.numNFTs()).to.equal(1)                    
            })

        })
    })

    context("Testing the AMM", async function () { 
        context("Testing the selling functionality of the NFTtoETH method", async function () {
            beforeEach(async function () {
                // donate 10 ETH to the FootiuMM
                await FootiuMM.donateEth({value:ethers.parseEther("10")})

                // donate 4 NFTs to the FootiuMM
                await TestNFT.mint(owner.address, 3);
                await TestNFT.mint(owner.address, 4);
                await TestNFT.mint(owner.address, 5);
                await TestNFT.mint(owner.address, 6);
                await TestNFT.mint(owner.address, 7);

                await TestNFT.approve(FootiuMM.target, 3); // Assuming tokenId 3
                await TestNFT.approve(FootiuMM.target, 4); // Assuming tokenId 4
                await TestNFT.approve(FootiuMM.target, 5); // Assuming tokenId 5
                await TestNFT.approve(FootiuMM.target, 6); // Assuming tokenId 6
          
                await FootiuMM.donateNft(3);
                await FootiuMM.donateNft(4);
                await FootiuMM.donateNft(5);
                await FootiuMM.donateNft(6);
            })

            it("checks the contract has 4 NFTs and 10 ETH", async function () { 
                expect(await FootiuMM.numNFTs()).to.equal(4)                    
                expect(await FootiuMM.totalEthInBalance()).to.equal(ethers.parseEther("10")) 
                expect(await TestNFT.balanceOf(user.address)).to.equal(2n)     
                expect(await TestNFT.ownerOf(1)).to.equal(user.address)        
            })

            it("sells the owner NFT into the pool", async function () { 
                // Approve the contract to transfer the NFT
                await TestNFT.approve(FootiuMM.target, 7); // Assuming tokenId 1
                await expect(FootiuMM.NFTtoETH(7))
                    .to.emit(FootiuMM, "PlayerforETH")
                    .withArgs(owner.address, 7, ethers.parseEther("2"));
                expect(await TestNFT.ownerOf(7)).to.equal(FootiuMM.target)       
            })
            
            it("sells an user NFT into the pool", async function () { 
                // Approve the contract to transfer the NFT
                await TestNFT.connect(user).approve(FootiuMM.target, 1); // Assuming tokenId 1
                await expect(FootiuMM.connect(user).NFTtoETH(1))
                    .to.emit(FootiuMM, "PlayerforETH")
                    .withArgs(user.address, 1, ethers.parseEther("2"));
                expect(await TestNFT.ownerOf(1)).to.equal(FootiuMM.target)       
            })
    
        })
    
        context("Testing the buying functionality of the ETHtoNFT method", async function () {
            beforeEach(async function () {
                // donate ETH
                await FootiuMM.donateEth({value:ethers.parseEther("10")})
    
    
                // donate NFTs
                await TestNFT.mint(owner.address, 3);
                await TestNFT.mint(owner.address, 4);
                await TestNFT.mint(owner.address, 5);
                await TestNFT.mint(owner.address, 6);
                await TestNFT.mint(owner.address, 7);

                await TestNFT.approve(FootiuMM.target, 3); // Assuming tokenId 1
                await TestNFT.approve(FootiuMM.target, 4); // Assuming tokenId 1
                await TestNFT.approve(FootiuMM.target, 5); // Assuming tokenId 1
                await TestNFT.approve(FootiuMM.target, 7); // Assuming tokenId 1
              
                await FootiuMM.donateNft(3);
                await FootiuMM.donateNft(4);
                await FootiuMM.donateNft(5);
                await FootiuMM.donateNft(7);
            })

            it("is set up properly", async function () { 
                expect(await FootiuMM.numNFTs()).to.equal(4)                    
                expect(await FootiuMM.totalEthInBalance()).to.equal(ethers.parseEther("10"))                    
            })

            it("buys an NFT from the pool", async function () { 
                expect(await TestNFT.ownerOf(5)).to.equal(FootiuMM.target);
                expect(
                    await FootiuMM.connect(user).ETHforNFT(
                        5, 
                        {value:ethers.parseEther("3.34")}
                        ));

                expect(await FootiuMM.getPlayersOnSale()).to.equal("3,4,7");

                expect(await TestNFT.ownerOf(5)).to.equal(user.address);
            })
    
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
