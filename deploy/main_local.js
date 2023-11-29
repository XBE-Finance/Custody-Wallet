const hre = require("hardhat");
const { time } = require('@openzeppelin/test-helpers');

module.exports = async ({ getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();
  console.log(`Starting deploy for all contracts with deployer: ${deployer}`);
  
}

let network = process.env.FORK_NETWORK;
let gatherName;
if (network == 'fantom') {
  gatherName = 'lp_gather_fantom'
} else if (network == 'ethereum' || network == 'ethereum_current') {
  gatherName = 'lp_gather_ethereum'
} else {
  throw new Error('Deploy script: no such network')
}



module.exports.tags = ["main_local"];
module.exports.dependencies = [
  "governance_token_deploy",
  "lock_subscription_deploy",
  "crv_gather_local",
  "cvx_gather_local",
  network =='ethereum' ? "cvxRewards_gather_local" : "",
  network =='ethereum' ? "crvRewards_gather_local" : "",
  "external_gather_local",
  gatherName,
  "sushi_pair_deploy",
  "treasury_deploy_local",
  "ve_token_deploy_local",
  "bonus_campaign_deploy_local",
  "inflation_deploy",
  "ref_program_deploy",
  "gauges_gather_local",
  "vaults_deploy_local",
  "vsr_deploy_local",
  network =='fantom' ? "merkle_tree_dispenser_deploy_local" : "",
  "ico_deploy_local",
  "migrator_deploy_local",
  "liquidity_router_deploy"

];
module.exports.runAtTheEnd = true;
