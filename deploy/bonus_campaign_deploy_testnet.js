const hre = require("hardhat");
const ethers = hre.ethers;

const { time, BN } = require('@openzeppelin/test-helpers');

const { 
  skipDeploymentIfAlreadyDeployed, 
  MINTER_ROLE, 
  REGISTRATOR_ROLE,
  startMintTimeTestnet,
  stopRegisterTimeTestnet,
  bonusCampaignRewardsDurationTestnet,
  bonusEmissionAmount
} = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const tokenAddress = (await deployments.get("GovernanceToken")).address;
  const veTokenAddress = (await deployments.get("VeTokenTest")).address;
  const lockSubscriptionAddress = (await deployments.get("LockSubscription")).address;

  const now = ethers.BigNumber.from(Math.round(Date.now() / 1000));
  const bonusCampaignConstructorArgs = [
    tokenAddress,
    veTokenAddress,
    now.add(startMintTimeTestnet),
    now.add(stopRegisterTimeTestnet),
    bonusCampaignRewardsDurationTestnet,
    bonusEmissionAmount
  ];
  const bonusCampaign = await deploy("BonusCampaignTest", {
      from: deployer,
      args: bonusCampaignConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await execute(
    'BonusCampaignTest',
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
module.exports.tags = ["bonus_campaign_deploy_testnet"];
