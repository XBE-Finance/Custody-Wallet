const hre = require("hardhat");
const ethers = hre.ethers;

const { skipDeploymentIfAlreadyDeployed } = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {
  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("GovernanceToken", {
      from: deployer,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );
}
module.exports.tags = ["governance_token_deploy"];
