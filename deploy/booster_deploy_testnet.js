const hre = require("hardhat");

const {
  skipDeploymentIfAlreadyDeployed
} = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();

  const mockBoosterConstructorArgs = [
    (await deployments.get('MockCurveLP')).address,
  ];
  const booster = await deploy("MockBooster", {
      from: deployer,
      args: mockBoosterConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('MockBooster', booster);

}
module.exports.tags = ["booster_deploy_testnet"];