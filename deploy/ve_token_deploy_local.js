const hre = require("hardhat");
const ethers = hre.ethers;

const { time } = require('@openzeppelin/test-helpers');

const { 
  skipDeploymentIfAlreadyDeployed,
  veTokenName,
  veTokenSymbol,
  veTokenVersion,
  minLockDurationLocal

} = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const lockSubscriptionAddress = (await deployments.get("LockSubscription")).address;
  const tokenAddress = (await deployments.get("GovernanceToken")).address;

  const veTokenConstructorArgs = [
    tokenAddress,
    lockSubscriptionAddress,
    minLockDurationLocal,
    veTokenName,
    veTokenSymbol,
    veTokenVersion
  ];
  const veToken = await deploy("VeToken", {
      from: deployer,
      args: veTokenConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await execute(
    'LockSubscription',
    {from: deployer, log: true},
    'setEventSource',
    veToken.address
  );

  
}
module.exports.tags = ["ve_token_deploy_local"];
