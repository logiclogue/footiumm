require("hardhat-deploy");
require("@nomicfoundation/hardhat-toolbox");

const config = {
    solidity: {
        compilers: [
            {
                version: "0.8.24",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    },
    namedAccounts: {
        deployer: 0
    },
    networks: {
        localhost: {
            url: "http://0.0.0.0:8545"
        },
        arbitrum: {
            url: "https://arb1.arbitrum.io/rpc",
            chainId: 42161,
            accounts: process.env.TEST_ETH_KEY ? [process.env.TEST_ETH_KEY] : []
        },
        "arbitrum-sepolia": {
            url: "https://sepolia-rollup.arbitrum.io/rpc",
            chainId: 421614,
            accounts: process.env.TEST_ETH_KEY ? [process.env.TEST_ETH_KEY] : []
        }
    }
};

module.exports = config;
