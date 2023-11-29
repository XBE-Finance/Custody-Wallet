const hre = require("hardhat");
const ethers = hre.ethers;

const { skipDeploymentIfAlreadyDeployed, wftmTokenSushiPairTestnet } = require('./helpers.js');
const erc20Artifact = require('../artifacts/contracts/GovernanceToken.sol/GovernanceToken.json');



module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {
  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const sushiPairFakeDeployment = {
    address: wftmTokenSushiPairTestnet,
    abi: erc20Artifact.abi
  }
  await save('SushiLP', sushiPairFakeDeployment);
  
}
module.exports.tags = ["sushi_pair_gather_testnet"];
