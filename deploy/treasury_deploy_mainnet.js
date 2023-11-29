const hre = require("hardhat");

const { 
  skipDeploymentIfAlreadyDeployed,
  uniswapRouterAddressMainnet,
  rewardTokensArtifactsNamesMainnet,
  crvTokenAddressMainnet,
  cvxTokenAddressMainnet,
  backendAddressMainnet
 } = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const tokenAddress = (await deployments.get("GovernanceToken")).address;

  const treasuryConstructorArgs = [
    tokenAddress,
    uniswapRouterAddressMainnet
  ];
  const treasury = await deploy("Treasury", {
      from: deployer,
      args: treasuryConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );


  await execute(
    'Treasury',
    {from: deployer, log: true},
    'addTokenToConvert',
    (await deployments.get('GovernanceToken')).address
  );

  await execute(
    'Treasury',
    {from: deployer, log: true},
    'addTokenToConvert',
    crvTokenAddressMainnet
  );

  await execute(
    'Treasury',
    {from: deployer, log: true},
    'addTokenToConvert',
    cvxTokenAddressMainnet
  );

  await execute(
    'Treasury',
    {from: deployer, log: true},
    'setAuthorized',
    backendAddressMainnet,
    true
  );
  
    



  
}
module.exports.tags = ["treasury_deploy_mainnet"];
