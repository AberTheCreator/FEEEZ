require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const SOMNIA_RPC_URL = process.env.SOMNIA_RPC_URL || "https://rpc-testnet.somnia.network";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    somnia_testnet: {
      url: SOMNIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 50311,
      gasPrice: 1000000000,
      gas: 2100000,
    },
    somnia_mainnet: {
      url: "https://rpc.somnia.network",
      accounts: [PRIVATE_KEY],
      chainId: 2648,
      gasPrice: 1000000000,
    }
  },
  etherscan: {
    apiKey: {
      somnia_testnet: ETHERSCAN_API_KEY,
      somnia_mainnet: ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "somnia_testnet",
        chainId: 50311,
        urls: {
          apiURL: "https://explorer-testnet.somnia.network/api",
          browserURL: "https://explorer-testnet.somnia.network"
        }
      },
      {
        network: "somnia_mainnet",
        chainId: 2648,
        urls: {
          apiURL: "https://explorer.somnia.network/api",
          browserURL: "https://explorer.somnia.network"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};