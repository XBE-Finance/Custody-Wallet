const hre = require("hardhat");
const ethers = hre.ethers;

const { skipDeploymentIfAlreadyDeployed, MINTER_ROLE, REGISTRATOR_ROLE, totalNumberOfBlocksLocal, merkleRootLocal } = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {
  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();


  const dispenserConstructorArgs = [
    (await deployments.get("GovernanceToken")).address,
    (await deployments.get("BonusCampaign")).address,
    (await deployments.get("VotingStakingRewards")).address,
    (await deployments.get("VeToken")).address

  ];
  const dispenser = await deploy("MerkleTreeDispenser", {
      from: deployer,
      args: dispenserConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await execute(
    'GovernanceToken',
    {from: deployer, log: true},
    'grantRole',
    MINTER_ROLE,
    dispenser.address
  );

  await execute(
    'BonusCampaign',
    {from: deployer, log: true},
    'grantRole',
    REGISTRATOR_ROLE,
    dispenser.address
  );

  await execute(
    'VeToken',
    {from: deployer, log: true},
    'setAllowedToActWithoutPermission',
    dispenser.address,
    true
  );


  await execute(
    "VotingStakingRewards",
    {from: deployer, log: true},
    'setAddressWhoCanAutoStake',
    dispenser.address,
    true
  );

  // await execute(
  //   "MerkleTreeDispenser",
  //   {from: deployer, log: true},
  //   'addPool',
  //   totalNumberOfBlocksLocal,
  //   merkleRootLocal
  // );

}
module.exports.tags = ["merkle_tree_dispenser_deploy_local"];
