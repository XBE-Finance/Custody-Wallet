// const hre = require("hardhat");

// const { skipDeploymentIfAlreadyDeployed, ibGaugeAddress, crvTokenAddress } = require('./helpers.js');
// const gaugeAbi = require('./abi/ib_gauge.json');
// const erc20Abi = require('./abi/erc20Abi.json');
// const ether = require("@openzeppelin/test-helpers/src/ether");


// module.exports = async ({
//     getNamedAccounts,
//     deployments
//   }) => {

//   const { deploy, save, execute } = deployments;
//   const { deployer } = await getNamedAccounts();

//   // ADDRESSES
//   ///////////////////////////////////////////
//   ///////////////////////////////////////////


//   const ibGaugeFakeDeployment = {
//     address: ibGaugeAddress,
//     abi: gaugeAbi
//   }
//   await save('IbGauge', ibGaugeFakeDeployment);


//   const crvTokenFakeDeployment = {
//     address: crvTokenAddress,
//     abi: erc20Abi
//   }

//   await save('CrvToken', crvTokenFakeDeployment);

//   const rewardsTokensForReferralProgram = [];
//   rewardsTokensForReferralProgram.push((await deployments.get("GovernanceToken")).address);
//   rewardsTokensForReferralProgram.push(crvTokenAddress);

//   await execute(
//     'ReferralProgram',
//     {from: deployer, log: true},
//     'setRewardTokens',
//     rewardsTokensForReferralProgram
//   );





// }
// module.exports.tags = ["gauges_gather_mainnet"];
