const hre = require("hardhat");
const ethers = hre.ethers;

const { skipDeploymentIfAlreadyDeployed, tokenAddressTestnet } = require('./helpers.js');
const erc20Artifact = require('../artifacts/contracts/GovernanceToken.sol/GovernanceToken.json');



module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {
  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const tokenFakeDeployment = {
    address: tokenAddressTestnet,
    abi: erc20Artifact.abi
  }
  await save('GovernanceToken', tokenFakeDeployment);
  
}
module.exports.tags = ["token_gather_testnet"];
