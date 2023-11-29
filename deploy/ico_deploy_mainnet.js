const hre = require("hardhat");
const ethers = hre.ethers;

const { time } = require('@openzeppelin/test-helpers');

const { 
  skipDeploymentIfAlreadyDeployed,
  MINTER_ROLE
} = require('./helpers.js');

const {
  initialPrice,
  limitPrice,
  rateCoeff,
  point,
  maxSupply,
  paymentTokenForICOAddress
} = require('./helpers_ethereum');

const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants.js");

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, execute, save } = deployments;
  const { deployer } = await getNamedAccounts();

  const icoConstructorArgs = [
    paymentTokenForICOAddress,
    (await deployments.get('GovernanceToken')).address,
    initialPrice,
    limitPrice,
    rateCoeff,
    point,
    maxSupply
  ];
  const ico = await deploy("XB3ICO", {
      from: deployer,
      args: icoConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );


  
}
module.exports.tags = ["ico_deploy_mainnet"];
