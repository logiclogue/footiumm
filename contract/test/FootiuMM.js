const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FootiuMM", function () {
    let FootiuMM;
    let TestNFT;

    beforeEach(async function() {
        const Contract2 = await ethers.getContractFactory("TestNFT");
        TestNFT = await Contract2.deploy("MyContractName", "MCN");
    
        const Contract1 = await ethers.getContractFactory("FootiuMM");
        FootiuMM = await Contract1.deploy(TestNFT.target); // Pass address of Contract2
    })

    it("should instantiate the NFT contract correctly", async function () {
        expect(await TestNFT.name()).to.equal("MyContractName")  
        expect(await TestNFT.symbol()).to.equal("MCN")
    })
      
})