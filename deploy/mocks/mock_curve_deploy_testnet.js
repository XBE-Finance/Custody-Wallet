const { ethers } = require("hardhat");
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

  const crvAddress = (await deployments.get('CRV')).address;

  const mock3CryptoLPConstructorArgs = [
    "3Crypto LP",
    "3CLP",
    hre.ethers.utils.parseEther('100000000')
  ];
  const mockToken = await deploy("MockToken", {
      from: deployer,
      args: mock3CryptoLPConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('3Crypto LP', mockToken);



  const mockCurveCRVFactoryConstructorArgs = [
    crvAddress,
    ethers.utils.parseEther("0.01")
  ];
  const mockCrvFactory = await deploy("CurveCRVFactoryMock", {
      from: deployer,
      args: mockCurveCRVFactoryConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('CurveCRVFactoryMock', mockCrvFactory);




  const mock3CryptoGaugeConstructorArgs = [
    mockCrvFactory.address,
    crvAddress,
    mockToken.address
  ];
  const mock3CryptoGauge = await deploy("Curve3CryptoGaugeMock", {
      from: deployer,
      args: mock3CryptoGaugeConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('Curve3CryptoGaugeMock', mock3CryptoGauge);

}
module.exports.tags = ["mock_curve_deploy_testnet"];