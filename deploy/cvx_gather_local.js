const hre = require("hardhat");

const {   
  cvxTokenAddressLocal
} = require('./helpers_ethereum.js');

const erc20Abi = require('./abi/erc20Abi.json');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();

  const cvxFakeDeployment = {
    address: cvxTokenAddressLocal,
    abi: erc20Abi
  }
  await save('CVX', cvxFakeDeployment);

}
module.exports.tags = ["cvx_gather_local"];