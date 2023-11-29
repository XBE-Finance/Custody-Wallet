const hre = require("hardhat");
const ethers = hre.ethers;
const yargs = require("yargs");
let helpers = {};


helpers["fantom"] = require('./helpers_fantom');
helpers["ethereum"] = require('./helpers_ethereum');
helpers["ethereum_current"] = require('./helpers_ethereum');


////////////////////////////////////////////
// Constants Starts
////////////////////////////////////////////

const DEAD_WALLET = '0x000000000000000000000000000000000000dEaD';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
const REGISTRATOR_ROLE = "0xdd88b11b15acff9f6c1a117b7fc4e5831658d0c8b1649b14ae3ddfbb1bc1b418";

const ZERO = ethers.BigNumber.from('0');
const ONE = ethers.BigNumber.from('1');
const TWO = ethers.BigNumber.from('2');
const THREE = ethers.BigNumber.from('3');
const FOUR = ethers.BigNumber.from('4');
const FIVE = ethers.BigNumber.from('5');
const TEN = ethers.BigNumber.from('10');
const HUN = ethers.BigNumber.from('100');
const THO = ethers.BigNumber.from('1000');

const skipDeploymentIfAlreadyDeployed = false;



const argv = yargs
  .option("network", {
    type: "string",
    default: "hardhat",
  })
  .help(false)
  .version(false).argv;

let network;
if (argv.network.indexOf("fantom") != -1) {
  network = "fantom";
} else if (argv.network.indexOf("ethereum") != -1) {
  network = "ethereum"
} else {
  network = process.env.FORK_NETWORK;
}

console.log(`Using ${network} network for deploying/testing...`);

/// Main info ///
exports.MINTER_ROLE = MINTER_ROLE;
exports.ZERO_ADDRESS = ZERO_ADDRESS,
exports.DEAD_WALLET = DEAD_WALLET,
exports.ZERO = ZERO;
exports.ONE = ONE;
exports.TWO = TWO;
exports.THREE = THREE;
exports.FOUR = FOUR;
exports.FIVE = FIVE;
exports.TEN = TEN;
exports.HUN = HUN;
exports.THO = THO;
exports.skipDeploymentIfAlreadyDeployed = skipDeploymentIfAlreadyDeployed;
exports.REGISTRATOR_ROLE = REGISTRATOR_ROLE;

/// Inflation ///
exports.targetMinted = helpers[network].targetMinted;
exports.periodsCount = helpers[network].periodsCount;
exports.periodDuration = helpers[network].periodDuration;

/// External addresses ///
exports.uniswapRouterAddressMainnet = helpers[network].uniswapRouterAddressMainnet;
exports.uniswapRouterAddressTestnet = helpers[network].uniswapRouterAddressTestnet;
exports.uniswapRouterAddressLocal = helpers[network].uniswapRouterAddressLocal;

exports.crvTokenAddressMainnet = helpers[network].crvTokenAddressMainnet;
exports.crvTokenAddressTestnet = helpers[network].crvTokenAddressTestnet;
exports.crvTokenAddressLocal = helpers[network].crvTokenAddressLocal;

exports.cvxTokenAddressMainnet = helpers[network].cvxTokenAddressMainnet;
exports.cvxTokenAddressTestnet = helpers[network].cvxTokenAddressTestnet;
exports.cvxTokenAddressLocal = helpers[network].cvxTokenAddressLocal;


exports.wrappedNativeAddressMainnet = helpers[network].wrappedNativeAddressMainnet;
exports.wrappedNativeAddressTestnet = helpers[network].wrappedNativeAddressTestnet;
exports.wrappedNativeAddressLocal = helpers[network].wrappedNativeAddressLocal;

exports.usdtAddressMainnet = helpers[network].usdtAddressMainnet;
exports.usdtAddressTestnet = helpers[network].usdtAddressTestnet;
exports.usdtAddressLocal = helpers[network].usdtAddressLocal;

exports.wrappedNativeUsdtPairMainnet = helpers[network].wrappedNativeUsdtPairMainnet;
exports.wrappedNativeUsdtPairTestnet = helpers[network].wrappedNativeUsdtPairTestnet;
exports.wrappedNativeUsdtPairLocal = helpers[network].wrappedNativeUsdtPairLocal;

exports.gnosisWalletMainnet = helpers[network].gnosisWalletMainnet;
exports.gnosisWalletTestnet = helpers[network].gnosisWalletTestnet;
exports.gnosisWalletLocal = helpers[network].gnosisWalletLocal;

exports.wftmTokenSushiPairMainnet = helpers[network].wftmTokenSushiPairMainnet;
exports.wftmTokenSushiPairTestnet = helpers[network].wftmTokenSushiPairTestnet;
exports.wftmTokenSushiPairLocal = helpers[network].wftmTokenSushiPairLocal;

exports.tokenAddressMainnet = helpers[network].tokenAddressMainnet;
exports.tokenAddressTestnet = helpers[network].tokenAddressTestnet;
exports.tokenAddressLocal = helpers[network].tokenAddressLocal;

exports.backendAddressMainnet = helpers[network].backendAddressMainnet;
exports.backendAddressTestnet = helpers[network].backendAddressTestnet;

/// Bonus Campaign ///
exports.startMintTimeMainnet = helpers[network].startMintTimeMainnet;
exports.startMintTimeTestnet = helpers[network].startMintTimeTestnet;
exports.startMintTimeLocal = helpers[network].startMintTimeLocal;

exports.stopRegisterTimeMainnet = helpers[network].stopRegisterTimeMainnet;
exports.stopRegisterTimeTestnet = helpers[network].stopRegisterTimeTestnet;
exports.stopRegisterTimeLocal = helpers[network].stopRegisterTimeLocal;

exports.bonusCampaignRewardsDurationMainnet = helpers[network].bonusCampaignRewardsDurationMainnet;
exports.bonusCampaignRewardsDurationTestnet = helpers[network].bonusCampaignRewardsDurationTestnet;
exports.bonusCampaignRewardsDurationLocal = helpers[network].bonusCampaignRewardsDurationLocal;

exports.bonusEmissionAmount = helpers[network].bonusEmissionAmount;

/// VeToken Info ///
exports.minLockDurationMainnet = helpers[network].minLockDurationMainnet;
exports.minLockDurationTestnet = helpers[network].minLockDurationTestnet;
exports.minLockDurationLocal = helpers[network].minLockDurationLocal;
exports.veTokenName = helpers[network].veTokenName;
exports.veTokenSymbol = helpers[network].veTokenSymbol;
exports.veTokenVersion = helpers[network].veTokenVersion;

/// Merkle Tree dispenser info ///

exports.whitelistMainnet = helpers[network].whitelistMainnet;
exports.whitelistTestnet = helpers[network].whitelistTestnet;
exports.whitelistLocal = helpers[network].whitelistLocal;
exports.merkleRootMainnet = helpers[network].merkleRootMainnet;
exports.merkleRootTestnet = helpers[network].merkleRootTestnet;
exports.merkleRootLocal = helpers[network].merkleRootLocal;
exports.merkleTreeMainnet = helpers[network].merkleTreeMainnet;
exports.merkleTreeTestnet = helpers[network].merkleTreeTestnet;
exports.merkleTreeLocal = helpers[network].merkleTreeLocal;
exports.totalNumberOfBlocksMainnet = helpers[network].totalNumberOfBlocksMainnet;
exports.totalNumberOfBlocksTestnet = helpers[network].totalNumberOfBlocksTestnet;
exports.totalNumberOfBlocksLocal = helpers[network].totalNumberOfBlocksLocal;


/// VSR info ///

exports.rewardsDurationMainnet = helpers[network].rewardsDurationMainnet;
exports.rewardsDurationTestnet = helpers[network].rewardsDurationTestnet;
exports.rewardsDurationLocal = helpers[network].rewardsDurationLocal;
exports.percentageToBeLocked = helpers[network].percentageToBeLocked;

/// Vaults info ///
exports.artifactsNamesForVaults = helpers[network].artifactsNamesForVaults;

exports.tricryptoVaultName = helpers[network].tricryptoVaultName;
exports.tricryptoVaultSymbol = helpers[network].tricryptoVaultSymbol;
exports.sushiVaultWeigth = helpers[network].sushiVaultWeigth;
exports.sushiVaultSymbol = helpers[network].sushiVaultSymbol;

exports.treasuryFeeBps = helpers[network].treasuryFeeBps;
exports.referralFeeBps = helpers[network].referralFeeBps;
exports.walletFeeBps = helpers[network].walletFeeBps;


exports.treasuryInflationWeight = helpers[network].treasuryInflationWeight;
exports.gnosisInflationWeight = helpers[network].gnosisInflationWeight;
exports.sushiVaultWeigth = helpers[network].sushiVaultWeigth;
exports.sushiVaultWeigth = helpers[network].sushiVaultWeigth;


exports.groupsOfConstructorsArgumentsForVaultsMainnet = helpers[network].groupsOfConstructorsArgumentsForVaultsMainnet;
exports.groupsOfConstructorsArgumentsForVaultsTestnet = helpers[network].groupsOfConstructorsArgumentsForVaultsTestnet;  
exports.groupsOfConstructorsArgumentsForVaultsLocal = helpers[network].groupsOfConstructorsArgumentsForVaultsLocal;

exports.rewardTokensArtifactsNamesMainnet = helpers[network].rewardTokensArtifactsNamesMainnet,
exports.rewardTokensArtifactsNamesTestnet = helpers[network].rewardTokensArtifactsNamesTestnet,
exports.rewardTokensArtifactsNamesLocal = helpers[network].rewardTokensArtifactsNamesLocal,

exports.crvFactoryMainnet = helpers[network].crvFactoryMainnet;
exports.crvFactoryTestnet = helpers[network].crvFactoryTestnet;
exports.crvFactoryLocal = helpers[network].crvFactoryLocal;

exports.sumWeight = helpers[network].sumWeight;


