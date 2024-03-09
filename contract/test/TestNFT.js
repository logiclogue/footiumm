const { expect } = require('chai');
const { ethers } = require('hardhat');

describe("TestNFT", function() {

    it("should return correct name", async function () {
      const MyContract = await ethers.getContractFactory("TestNFT");
      
      const myContractDeployed = await MyContract.deploy("MyContractName", "MCN");

      expect(await myContractDeployed.name()).to.equal("MyContractName")
    })
    
    it("should return correct symbol", async function () {
        const MyContract = await ethers.getContractFactory("TestNFT");
        
        const myContractDeployed = await MyContract.deploy("MyContractName", "MCN");
  
        expect(await myContractDeployed.symbol()).to.equal("MCN")
      })

})