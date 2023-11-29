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

  const mockCRVConstructorArgs = [
    "Mock CVX",
    "MCVX",
    hre.ethers.utils.parseEther('100000000')
  ];
  const mockToken = await deploy("MockToken", {
      from: deployer,
      args: mockCRVConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('CVX', mockToken);

}
module.exports.tags = ["cvx_deploy_testnet"];