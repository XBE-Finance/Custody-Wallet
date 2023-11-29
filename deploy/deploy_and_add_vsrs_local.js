const hre = require("hardhat");
const { time } = require('@openzeppelin/test-helpers');

module.exports = async ({ getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();
  console.log(`Starting deploy for all contracts with deployer: ${deployer}`);
  
}


module.exports.tags = ["deploy_and_add_vsrs_local"];
module.exports.dependencies = [
  "main_local",
  "add_crv_cvx_vsrs_mainnet"

];
module.exports.runAtTheEnd = true;
