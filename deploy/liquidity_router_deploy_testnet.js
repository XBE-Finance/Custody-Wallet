const hre = require("hardhat");

const {
  skipDeploymentIfAlreadyDeployed,
  wrappedNativeUsdtPairTestnet,
  wrappedNativeAddressTestnet,
  tokenAddressTestnet
} = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {


  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();

  const sushiVault = (await deployments.get("SushiVault")).address; //TODO
 
  const liquidityRouterConstructorArgs = [
    sushiVault, 
    wrappedNativeUsdtPairTestnet,
    wrappedNativeAddressTestnet,
    tokenAddressTestnet
  ];
  const liquidityRouter = await deploy("LiquidityRouter", {
      from: deployer,
      args: liquidityRouterConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('LiquidityRouter', liquidityRouter);

}
module.exports.tags = ["liquidity_router_deploy_testnet"];