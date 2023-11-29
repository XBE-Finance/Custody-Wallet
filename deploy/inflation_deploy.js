const hre = require("hardhat");
const ethers = hre.ethers;

const { time } = require('@openzeppelin/test-helpers');

const { 
  skipDeploymentIfAlreadyDeployed, 
  MINTER_ROLE, 
  targetMinted, 
  periodsCount, 
  periodDuration,
  treasuryInflationWeight,
  gnosisWalletLocal,
  gnosisWalletMainnet
} = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const tokenAddress = (await deployments.get("GovernanceToken")).address;

  const inflationConstructorArgs = [
    tokenAddress,
    targetMinted,
    periodsCount,
    periodDuration
  ];
  const inflation = await deploy("Inflation", {
      from: deployer,
      args: inflationConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await execute(
    'GovernanceToken',
    {from: deployer},
    'grantRole',
    MINTER_ROLE,
    inflation.address
  );


  let oldWeights = [];
  let callConfigs = [];

  let treasuryWeight = oldWeights.length == 0 ? 10000 : treasuryInflationWeight;

  await execute(
    'Inflation',
    {from: deployer},
    'addReceiver',
    (await deployments.get("Treasury")).address,
    treasuryWeight,
    false,
    oldWeights,
    callConfigs
  );

  await execute(
    'Inflation',
    {from: deployer},
    'addReceiver',
    gnosisWalletMainnet,
    1,
    false,
    [9999],
    [false]
  );


}
module.exports.tags = ["inflation_deploy"];
