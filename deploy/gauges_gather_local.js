const hre = require("hardhat");

const { curve3cryptoGaugeAddressLocal } = require('./helpers_fantom.js');
const { curveCrvCvxCrvGaugeLocal } = require('./helpers_ethereum.js');
const { rewardTokensArtifactsNamesLocal } = require('./helpers.js');
const gaugeAbi = require('./abi/3crypto_gauge.json');
const erc20Abi = require('./abi/erc20Abi.json');
const ether = require("@openzeppelin/test-helpers/src/ether");


module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  // ADDRESSES
  ///////////////////////////////////////////
  ///////////////////////////////////////////


  const tricryptoGaugeFakeDeployment = {
    address: curve3cryptoGaugeAddressLocal,
    abi: gaugeAbi
  }
  await save('TriCryptoGauge', tricryptoGaugeFakeDeployment);


  const crvCvxCrvGaugeFakeDeployment = {
    address: curveCrvCvxCrvGaugeLocal,
    abi: gaugeAbi
  }
  await save('CrvCvxCrvGauge', crvCvxCrvGaugeFakeDeployment);


  





}
module.exports.tags = ["gauges_gather_local"];
