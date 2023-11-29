const hre = require("hardhat");
const { time } = require('@openzeppelin/test-helpers');

module.exports = async ({ getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();
  console.log(`Starting deploy for all contracts with deployer: ${deployer}`);
  
}
module.exports.tags = ["main_mainnet"];
module.exports.dependencies = [
  "governance_token_deploy",
  "lock_subscription_deploy",
  "treasury_deploy_mainnet",
  "ve_token_deploy_mainnet",
  "bonus_campaign_deploy_mainnet",
  "inflation_deploy",
  "ref_program_deploy",
  "vaults_deploy_mainnet",
  "vsr_deploy_mainnet",
  "ico_deploy_mainnet",
  "migrator_deploy_mainnet"
];
module.exports.runAtTheEnd = true;
