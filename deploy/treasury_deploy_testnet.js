const hre = require("hardhat");

const { 
  skipDeploymentIfAlreadyDeployed,
  uniswapRouterAddressTestnet,
  rewardTokensArtifactsNamesTestnet,
  backendAddressTestnet
 } = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const tokenAddress = (await deployments.get("GovernanceToken")).address;
  console.log("tokenAddress = ", tokenAddress)

  const treasuryConstructorArgs = [
    tokenAddress,
    uniswapRouterAddressTestnet
  ];
  const treasury = await deploy("Treasury", {
      from: deployer,
      args: treasuryConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  for (let i = 1; i < rewardTokensArtifactsNamesTestnet.length; i++) {
    await execute(
      'Treasury',
      {from: deployer, log: true},
      'addTokenToConvert',
      (await deployments.get(rewardTokensArtifactsNamesTestnet[i])).address
    );
  }


  await execute(
    'Treasury',
    {from: deployer, log: true},
    'setAuthorized',
    backendAddressTestnet,
    true
  );


}
module.exports.tags = ["treasury_deploy_testnet"];
