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

  const mockCrvRewardConstructorArgs = [
    (await deployments.get('CRV')).address,
    (await deployments.get('CVX')).address
  ];
  const crvRewards = await deploy("MockCrvRewards", {
      from: deployer,
      args: mockCrvRewardConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('CRVRewards', crvRewards);

}
module.exports.tags = ["crvRewards_deploy_testnet"];