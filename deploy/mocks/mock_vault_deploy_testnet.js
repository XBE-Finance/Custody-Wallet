const hre = require("hardhat");

const {
  skipDeploymentIfAlreadyDeployed
} = require('../helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {


  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();

  const mockVaultConstructorArgs = [
    "0x294A49A708976EF6A030D76D626789f4dEA5b0d6",
  ];
  const mockVault = await deploy("MockVault", {
      from: deployer,
      args: mockVaultConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('MockVault', mockVault);

}
module.exports.tags = ["mock_vault_deploy_testnet"];