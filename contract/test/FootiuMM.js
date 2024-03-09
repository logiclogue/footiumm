const { expect } = require("chai");
const { ethers } = require("hardhat")

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
        context("Testing the functionality of the NFTtoETH method", async function () {
            beforeEach(async function () {
                // donate ETH
                await FootiuMM.donateEth({value:ethers.parseEther("10")})


                // donate NFTs
                TestNFT.mint(owner.address, 3);
                TestNFT.mint(owner.address, 4);
                TestNFT.mint(owner.address, 5);
                TestNFT.mint(owner.address, 6);

                await TestNFT.approve(FootiuMM.target, 3); // Assuming tokenId 1
                await TestNFT.approve(FootiuMM.target, 4); // Assuming tokenId 1
                await TestNFT.approve(FootiuMM.target, 5); // Assuming tokenId 1
                await TestNFT.approve(FootiuMM.target, 6); // Assuming tokenId 1
          
                await FootiuMM.donateNft(3);
                await FootiuMM.donateNft(4);
                await FootiuMM.donateNft(5);
                await FootiuMM.donateNft(6);
            })
            it("is set up properly", async function () { 
                expect(await FootiuMM.numNFTs()).to.equal(4)                    
                expect(await FootiuMM.totalEthInBalance()).to.equal(ethers.parseEther("10"))                    

            })

            it("sells an NFT into the pool", async function () { 

                //There is initially 4 NFTs, and 10 ETH
                // Approve the contract to transfer the NFT
                await TestNFT.connect(user).approve(FootiuMM.target, 1); // Assuming tokenId 1
                // Perform NFT to ETH swap
                const userInitialBalance = await ethers.provider.getBalance(user.address)

                
                await FootiuMM.connect(user).NFTtoETH(1); // Assuming tokenId 1

                expect(await FootiuMM.numNFTs()).to.equal(5)                    
                expect(
                    await TestNFT.balanceOf(user.address)
                ).to.equal(
                    1
                )
                const contractUpdateBalance = await ethers.provider.getBalance(FootiuMM.target)
                expect(contractUpdateBalance).to.equal(8000000000000000000n)
                const userUpdatedBalance = await ethers.provider.getBalance(user.address)
                const balanceChange = userUpdatedBalance - userInitialBalance 
                //expect(balanceChange).to.equal(1999891938048771278n)
            })
    
        })
    
        context("Testing the functionality of the ETHtoNFT method", async function () {
                beforeEach(async function () {
                    // donate ETH
                    await FootiuMM.donateEth({value:ethers.parseEther("10")})
    
    
                    // donate NFTs
                    TestNFT.mint(owner.address, 3);
                    TestNFT.mint(owner.address, 4);
                    TestNFT.mint(owner.address, 5);
                    TestNFT.mint(owner.address, 6);
    
                    await TestNFT.approve(FootiuMM.target, 3); // Assuming tokenId 1
                    await TestNFT.approve(FootiuMM.target, 4); // Assuming tokenId 1
                    await TestNFT.approve(FootiuMM.target, 5); // Assuming tokenId 1
                    await TestNFT.approve(FootiuMM.target, 6); // Assuming tokenId 1
              
                    await FootiuMM.donateNft(3);
                    await FootiuMM.donateNft(4);
                    await FootiuMM.donateNft(5);
                    await FootiuMM.donateNft(6);
                })
                it("is set up properly", async function () { 
                    expect(await FootiuMM.numNFTs()).to.equal(4)                    
                    expect(await FootiuMM.totalEthInBalance()).to.equal(ethers.parseEther("10"))                    
    
                })

                it("buys an NFT from the pool", async function () { 

                    expect(
                        await TestNFT.balanceOf(user.address)
                    ).to.equal(
                        2
                    )

                    // Perform NFT to ETH swap
                    const userInitialBalance = await ethers.provider.getBalance(user.address)
                    
                    await FootiuMM.connect(user).ETHforNFT(1); // Assuming tokenId 1
                    expect(await FootiuMM.numNFTs()).to.equal(5)                    
                    expect(
                        await TestNFT.balanceOf(user.address)
                    ).to.equal(
                        1
                    )
                    const contractUpdateBalance = await ethers.provider.getBalance(FootiuMM.target)
                    expect(contractUpdateBalance).to.equal(8000000000000000000n)
                    const userUpdatedBalance = await ethers.provider.getBalance(user.address)
                    const balanceChange = userUpdatedBalance - userInitialBalance 
                    //expect(balanceChange).to.equal(1999891938048771278n)
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