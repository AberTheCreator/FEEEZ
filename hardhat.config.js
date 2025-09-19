require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const SOMNIA_RPC_URL = process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { 
        enabled: true, 
        runs: 200 
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    somnia_testnet: {
      url: SOMNIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 50312,
      gas: "auto",
      maxFeePerGas: 5000000000,       
      maxPriorityFeePerGas: 2000000000, 
      timeout: 60000,
    },

    somnia_mainnet: {
      url: "https://rpc.somnia.network",
      accounts: [PRIVATE_KEY],
      chainId: 2648,
      gas: "auto",
      maxFeePerGas: 5000000000, 
      maxPriorityFeePerGas: 2000000000, 
      timeout: 60000,
    },
  },
  etherscan: {
    apiKey: {
      somnia_testnet: ETHERSCAN_API_KEY,
      somnia_mainnet: ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "somnia_testnet",
        chainId: 50312,
        urls: {
          apiURL: "https://shannon-explorer.somnia.network/api",
          browserURL: "https://shannon-explorer.somnia.network",
        },
      },
      {
        network: "somnia_mainnet",
        chainId: 2648,
        urls: {
          apiURL: "https://explorer.somnia.network/api",
          browserURL: "https://explorer.somnia.network",
        },
      },
    ],
  },
  mocha: {
    timeout: 60000,
  },
};