const hre = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const result = await deploy('FootiuMM', {
        from: deployer,
        args: ["0xD65f8B2f2Be08564764D6585B4700554b6596Da3"],
        log: true
    });

    console.log("HERE", result);
};

module.exports.tags = ['FootiuMM'];
