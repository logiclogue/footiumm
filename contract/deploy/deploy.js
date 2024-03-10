const hre = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const poolTokenResult = await deploy('PoolToken', {
        from: deployer,
        args: [deployer],
        log: true
    });

    const result = await deploy('FootiuMM', {
        from: deployer,
        args: ["0xD65f8B2f2Be08564764D6585B4700554b6596Da3", poolTokenResult.address],
        log: true
    });

    const poolTokenContract = await ethers.getContractAt('PoolToken', poolTokenResult.address);

    await poolTokenContract.transferOwnership(result.address);
};

module.exports.tags = ['FootiuMM', 'PoolToken'];
