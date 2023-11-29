require('dotenv').config()

require("@nomiclabs/hardhat-ethers")
require('hardhat-docgen')
require('hardhat-deploy')
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-web3")
require("@nomiclabs/hardhat-etherscan")
require("solidity-coverage")
require("hardhat-gas-reporter")

let urls = {}
urls["kovan"] = `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_KOVAN}`;
urls["goerli"] = `https://goerli.infura.io/v3/${process.env.INFURA_ID}`;  
urls["rinkeby"] = `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_RINKEBY}`;
urls["ethereum"] = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_MAINNET}`;
urls["ethereum_current"] = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_MAINNET}`;
urls["fantom_testnet"] = `https://rpcapi-tracing.testnet.fantom.network`;
urls["fantom"] = `https://rpc.ankr.com/fantom/`;

let startBlocks = {}
startBlocks["ethereum"] = 14500000;
startBlocks["ethereum_current"] = 15732906; 
startBlocks["fantom"] = 38076689;

module.exports = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      saveDeployments: true,
      
      // forking: {
      //   url: urls[process.env.FORK_NETWORK],
      //   blockNumber: startBlocks[process.env.FORK_NETWORK]
      // }
    },
    kovan: {
      url: urls["kovan"],
      chainId: 42,
      gas: 12000000,
      accounts: {mnemonic: process.env.MNEMONIC},
      saveDeployments: true,
      skipIfAlreadyDeployed: true
    },
    fantom: {
      url: urls["fantom"],
      chainId: 250,
      accounts: {mnemonic: process.env.MNEMONIC},
      saveDeployments: true,
      skipIfAlreadyDeployed: true
    },
    fantom_testnet: {
      url: urls["fantom_testnet"],
      chainId: 0xfa2,
      accounts: {mnemonic: process.env.MNEMONIC},
      gasPrice: "auto",
      saveDeployments: true,
      skipIfAlreadyDeployed: true
    },
    goerli: {
      url: urls["goerli"],
      chainId: 5,
      gasPrice: "auto",
      accounts: {mnemonic: process.env.MNEMONIC},
      saveDeployments: true
    },
    rinkeby: {
      url: urls["rinkeby"],
      chainId: 4,
      gasPrice: "auto",
      accounts: {mnemonic: process.env.MNEMONIC},
      saveDeployments: true
    },
    ethereum: {
      url: urls["ethereum"],
      chainId: 1,
      gasPrice: "auto",
      accounts: {mnemonic: process.env.MNEMONIC},
      saveDeployments: true
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY,
      fantom_testnet: process.env.FTMSCAN_TESTNET_API_KEY,
    }
  },
  solidity: {
    version: "0.8.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: "none",
      },
    },
  },
  namedAccounts: {
    deployer: 0,
    alice: 1,
    bob: 2,
    charlie: 3
  },
  paths: {
    sources: "contracts",
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: false,
  },
  gasReporter: {
    currency: 'USD',
    enabled: (process.env.REPORT_GAS === "true") ? true : false
  },
  mocha: {
    timeout: 50000000
  },

}
