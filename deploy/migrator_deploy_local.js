const hre = require("hardhat");
const ethers = hre.ethers;

const { time } = require('@openzeppelin/test-helpers');

const { 
  skipDeploymentIfAlreadyDeployed,
  MINTER_ROLE
} = require('./helpers.js');

const {
  feeBpsOnClaim,
  oldXbeAddress,
  oldBonusCampaignAddress,
  oldVeTokenAddress,
  oldVsrAddress,
  oldFraxVaultAddress,
  oldSushiVaultAddress,
  oldCrvCvxVaultAddress,
  oldReferralProgramAddress,
  merkleRoot
} = require("../deploy/helpers_ethereum");
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants.js");


module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();


  const mirgatorConstructorArgs = [
    (await deployments.get('XB3ICO')).address,
    (await deployments.get('GovernanceToken')).address,
    (await deployments.get('VeToken')).address,
    feeBpsOnClaim,
    merkleRoot
  ];
  const migrator = await deploy("XBE2XB3MigratorTest", {
      from: deployer,
      args: mirgatorConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await execute(
    'VeToken',
    {from: deployer, log: true},
    'setAllowedToActWithoutPermission',
    migrator.address,
    true
  );
  await execute(
    'GovernanceToken',
    {from: deployer, log: true},
    'grantRole',
    MINTER_ROLE,
    migrator.address
  );


  
}
module.exports.tags = ["migrator_deploy_local"];
