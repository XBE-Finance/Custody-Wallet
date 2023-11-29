const hre = require("hardhat");

const {   
  cvxRewardAddressLocal
} = require('./helpers_ethereum.js');

const erc20Abi = require('./abi/erc20Abi.json');
const cvxRewardsAbi = require('./abi/cvxReward.json');


module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {


  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();

  const cvxRewardsFakeDeployment = {
    address: cvxRewardAddressLocal,
    abi: cvxRewardsAbi
  }
  await save('CvxRewards', cvxRewardsFakeDeployment);

}
module.exports.tags = ["cvxRewards_gather_local"];