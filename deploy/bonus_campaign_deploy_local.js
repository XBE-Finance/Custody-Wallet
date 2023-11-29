const hre = require("hardhat");
const ethers = hre.ethers;

const { time, BN } = require('@openzeppelin/test-helpers');

const { 
  skipDeploymentIfAlreadyDeployed, 
  MINTER_ROLE, 
  REGISTRATOR_ROLE,
  startMintTimeLocal,
  stopRegisterTimeLocal,
  bonusCampaignRewardsDurationLocal,
  bonusEmissionAmount
} = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const tokenAddress = (await deployments.get("GovernanceToken")).address;
  const veTokenAddress = (await deployments.get("VeToken")).address;
  const lockSubscriptionAddress = (await deployments.get("LockSubscription")).address;

  const now = ethers.BigNumber.from((await time.latest()).toString());
  const bonusCampaignConstructorArgs = [
    tokenAddress,
    veTokenAddress,
    now.add(startMintTimeLocal),
    now.add(stopRegisterTimeLocal),
    bonusCampaignRewardsDurationLocal,
    bonusEmissionAmount
  ];
  const bonusCampaign = await deploy("BonusCampaign", {
      from: deployer,
      args: bonusCampaignConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await execute(
    'BonusCampaign',
    {from: deployer, log: true},
    'grantRole',
    REGISTRATOR_ROLE, 
    lockSubscriptionAddress
  );
  
  await execute(
    'GovernanceToken',
    {from: deployer, log: true},
    'grantRole',
    MINTER_ROLE, 
    bonusCampaign.address
  );

  await execute(
    'LockSubscription',
    {from: deployer, log: true},
    'addLockSubscriber',
    bonusCampaign.address
  );
}
module.exports.tags = ["bonus_campaign_deploy_local"];
