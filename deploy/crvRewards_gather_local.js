const hre = require("hardhat");

const {   
  crvRewardAddressLocal
} = require('./helpers_ethereum.js');

const erc20Abi = require('./abi/erc20Abi.json');
const crvRewardsAbi = require('./abi/crvReward.json');


module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {


  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();

  const crvRewardsFakeDeployment = {
    address: crvRewardAddressLocal,
    abi: crvRewardsAbi
  }
  await save('CrvRewards', crvRewardsFakeDeployment);

}
module.exports.tags = ["crvRewards_gather_local"];