const hre = require("hardhat");
const ethers = hre.ethers;

const { skipDeploymentIfAlreadyDeployed } = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {
  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const lockSubscription = await deploy("LockSubscription", {
      from: deployer,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );
}
module.exports.tags = ["lock_subscription_deploy"];
