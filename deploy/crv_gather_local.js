const hre = require("hardhat");

const {   
  crvTokenAddressLocal
} = require('./helpers.js');

const erc20Abi = require('./abi/erc20Abi.json');
const crvAbi = require('./abi/crv.json');


module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {


  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();

  const crvFakeDeployment = {
    address: crvTokenAddressLocal,
    abi: crvAbi
  }
  await save('CRV', crvFakeDeployment);

}
module.exports.tags = ["crv_gather_local"];