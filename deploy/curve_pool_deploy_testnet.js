const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants.js");
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

  const curvePoolConstructorArgs = [
    (await deployments.get("CRV")).address,
    (await deployments.get("cvxCRV")).address,
    (await deployments.get("MockCurveLP")).address,
  ];
  const mockCurvePool = await deploy("MockCurvePoolCvxCrvCrv", {
      from: deployer,
      args: curvePoolConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('MockCurvePoolCvxCrvCrv', mockCurvePool);

}
module.exports.tags = ["curve_pool_deploy_testnet"];