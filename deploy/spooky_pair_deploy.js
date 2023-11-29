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

  const mockLPConstructorArgs = [
    "Mock Spooky LP", // TODO
    "MSLP",
    hre.ethers.utils.parseEther('100000000')
  ];
  const mockToken = await deploy("MockToken", {
      from: deployer,
      args: mockLPConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('MockSushiLP', mockToken);



}
module.exports.tags = ["spooky_pair_deploy"];
