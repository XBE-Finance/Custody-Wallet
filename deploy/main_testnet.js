const hre = require("hardhat");
const { time } = require('@openzeppelin/test-helpers');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

module.exports = async ({ getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();
  console.log(`Starting deploy for all contracts with deployer: ${deployer}`);
  
}

let network = argv.network;
let gatherName;
// if (network == 'fantom') {
//   gatherName = 'lp_gather_fantom'
// } else if (network == 'ethereum') {
//   gatherName = 'lp_gather_ethereum'
// } else {
//   throw new Error('Deploy script: no such network')
// }


module.exports.tags = ["main_testnet"];
module.exports.dependencies = [
  "governance_token_deploy", //"token_gather_testnet",
  "lock_subscription_deploy",
  "crv_deploy_testnet",
  "sushi_pair_gather_testnet",
  network =='rinkeby' || network =='goerli' ? "curve_lp_deploy_testnet" : "",
  network =='rinkeby' || network =='goerli' ? "cvx_deploy_testnet" : "",
  network =='rinkeby' || network =='goerli' ? "cvxCrv_deploy_testnet" : "",
  network =='rinkeby' || network =='goerli' ? "crvRewards_deploy_testnet" : "",
  network =='rinkeby' || network =='goerli' ? "curve_pool_deploy_testnet" : "",
  network =='rinkeby' || network =='goerli' ? "booster_deploy_testnet" : "",
  "treasury_deploy_testnet",
  "sushi_pair_deploy",
  "ve_token_deploy_testnet",
  "bonus_campaign_deploy_testnet",
  "inflation_deploy",
  "ref_program_deploy",
  "vaults_deploy_testnet",
  "vsr_deploy_testnet",
  network =='fantom' ? "merkle_tree_dispenser_deploy_testnet" : "",
  // "liquidity_router_deploy_testnet",
  "migrator_deploy_testnet"

];
module.exports.runAtTheEnd = true;
