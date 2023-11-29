const hre = require("hardhat");

const { 
  skipDeploymentIfAlreadyDeployed,
  uniswapRouterAddressLocal,
  rewardTokensArtifactsNamesLocal
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
    uniswapRouterAddressLocal
  ];
  const treasury = await deploy("Treasury", {
      from: deployer,
      args: treasuryConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

    for (let i = 1; i < rewardTokensArtifactsNamesLocal.length; i++) {
      await execute(
        'Treasury',
        {from: deployer, log: true},
        'addTokenToConvert',
        (await deployments.get(rewardTokensArtifactsNamesLocal[i])).address
      );
    }
    



  
}
module.exports.tags = ["treasury_deploy_local"];
