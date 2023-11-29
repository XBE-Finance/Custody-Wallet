const hre = require("hardhat");
const ethers = hre.ethers;

const { time } = require('@openzeppelin/test-helpers');

const { 
  skipDeploymentIfAlreadyDeployed, 
  artifactsNamesForVaults,
  rewardsDurationLocal,
  bondedLockDurationLocal,
  REGISTRATOR_ROLE,
  percentageToBeLocked
 } = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const treasuryAddress = (await deployments.get("Treasury")).address;
  const bonusCampaignAddress = (await deployments.get("BonusCampaign")).address;
  const tokenAddress = (await deployments.get("GovernanceToken")).address;
  const vetokenAddress = (await deployments.get("VeToken")).address;


  const vsrConstructorArgs = [
    treasuryAddress,
    tokenAddress,
    tokenAddress,
    rewardsDurationLocal,
    bonusCampaignAddress,
    percentageToBeLocked
  ];
  const votingStakingRewards = await deploy("VotingStakingRewardsForLockers", {
      from: deployer,
      args: vsrConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );


  await execute(
    'VeToken',
    {from: deployer, log: true},
    'setVotingStakingRewards',
    votingStakingRewards.address
  );

  await execute(
    'VeToken',
    {from: deployer, log: true},
    'setAllowedToActWithoutPermission',
    votingStakingRewards.address,
    true
  );


  await execute(
    'VotingStakingRewardsForLockers',
    {from: deployer, log: true},
    'setVeToken',
    vetokenAddress
  );


  await execute(
    'VotingStakingRewardsForLockers',
    {from: deployer, log: true},
    'grantRole',
    REGISTRATOR_ROLE,
    (await deployments.get('LockSubscription')).address
  );


  await execute(
    'Treasury',
    {from: deployer, log: true},
    'setRewardsDistributionRecipientContract',
    votingStakingRewards.address
  );

  await execute(
    'LockSubscription',
    {from: deployer, log: true},
    'addLockSubscriber',
    votingStakingRewards.address
  );

  await execute(
    'LockSubscription',
    {from: deployer, log: true},
    'addUnlockSubscriber',
    votingStakingRewards.address
  );

  await execute(
    'ReferralProgram',
    {from: deployer, log: true},
    'setVotingStakingRewards',
    votingStakingRewards.address
  );


  for (let i = 0; i < artifactsNamesForVaults.length; i++) {
    await execute(
      artifactsNamesForVaults[i],
      {from: deployer, log: true},
      'setVotingStakingRewards',
      votingStakingRewards.address
    );
  }
}
module.exports.tags = ["vsr_deploy_local"];
