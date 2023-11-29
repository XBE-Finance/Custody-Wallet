const hre = require("hardhat");

const { convexBoosterAddressLocal } = require('./helpers_ethereum.js');
const gaugeAbi = require('./abi/3crypto_gauge.json');
const erc20Abi = require('./abi/erc20Abi.json');
const ether = require("@openzeppelin/test-helpers/src/ether");
const boosterAbi = require('./abi/booster.json');


module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  // ADDRESSES
  ///////////////////////////////////////////
  ///////////////////////////////////////////


  const boosterFakeDeployment = {
    address: convexBoosterAddressLocal,
    abi: boosterAbi
  }
  await save('Booster', boosterFakeDeployment);

  // const crvToken = await deployments.get("CRV");

  // const rewardsTokensForReferralProgram = [];
  // rewardsTokensForReferralProgram.push((await deployments.get("GovernanceToken")).address);
  // rewardsTokensForReferralProgram.push(crvToken.address);

  // await execute(
  //   'ReferralProgram',
  //   {from: deployer, log: true},
  //   'setRewardTokens',
  //   rewardsTokensForReferralProgram
  // );






}
module.exports.tags = ["external_gather_local"];
