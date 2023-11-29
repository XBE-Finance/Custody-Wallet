
const { ether, time, BN } = require("@openzeppelin/test-helpers");
const hre = require("hardhat");
const ethers = hre.ethers;
const whitelistLocal = require('./data/whitelist.js');
const whitelistTestnet = require('./data/whitelistTestnet.js');
const whitelistMainnet = require('./data/whitelistMainnet.js');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

////////////////////////////////////////////
// Constants Starts
////////////////////////////////////////////

const DEAD_WALLET = '0x000000000000000000000000000000000000dEaD';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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

///// External addresses /////

/// Mainnet ///
const uniswapRouterAddressMainnet = "0xF491e7B69E4244ad4002BC14e878a34207E38c29";


const curve3cryptoPoolAddressMainnet = "0x3a1659Ddcf2339Be3aeA159cA010979FB49155FF";
const curve3cryptoLpTokenMainnet = "0x58e57cA18B7A47112b877E31929798Cd3D703b0f";
const curve3cryptoGaugeAddressMainnet = "0x319E268f0A4C85D404734ee7958857F5891506d7";

const crvTokenAddressMainnet = "0x1E4F97b9f9F913c46F1632781732927B9019C68b";

const wrappedNativeAddressMainnet = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";

const usdtAddressMainnet = "0x049d68029688eAbF473097a2fC38ef61633A3C7A";

const wrappedNativeUsdtPairMainnet = "0x012ca97de3EED8b10c15D62b674DF168342AbDE2";

const gnosisWalletMainnet = ""

const wftmTokenSushiPairMainnet = "";

const tokenAddressMainnet = "";

const crvFactoryMainnet = "0xabC000d88f23Bb45525E447528DBF656A9D55bf5";


/// Testnet ///

const uniswapRouterAddressTestnet = "0xa6AD18C2aC47803E193F75c3677b14BF19B94883";

const curve3cryptoPoolAddressTestnet = "";
const curve3cryptoLpTokenTestnet = "";
const curve3cryptoGaugeAddressTestnet = "";

const crvTokenAddressTestnet = "";

const wrappedNativeAddressTestnet = "0xf1277d1Ed8AD466beddF92ef448A132661956621";

const usdtAddressTestnet = "";

const wrappedNativeUsdtPairTestnet = "";

const gnosisWalletTestnet = "0x528e7c77B8F3001B512e8BF305b03CeA420951cd"

const wftmTokenSushiPairTestnet = "0x294A49A708976EF6A030D76D626789f4dEA5b0d6";

const tokenAddressTestnet = "0x02b3928f365569a0353CAcc4F2F5d4C270b01df8";

const crvFactoryTestnet = "";

/// For local tests ///

const uniswapRouterAddressLocal = "0xF491e7B69E4244ad4002BC14e878a34207E38c29";

const curve3cryptoPoolAddressLocal = "0x3a1659Ddcf2339Be3aeA159cA010979FB49155FF";
const curve3cryptoLpTokenLocal = "0x58e57cA18B7A47112b877E31929798Cd3D703b0f";
const curve3cryptoGaugeAddressLocal = "0x319E268f0A4C85D404734ee7958857F5891506d7";

const crvTokenAddressLocal = "0x1E4F97b9f9F913c46F1632781732927B9019C68b";

const wrappedNativeAddressLocal = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";

const usdtAddressLocal = "0x049d68029688eAbF473097a2fC38ef61633A3C7A";

const wrappedNativeUsdtPairLocal = "0x012ca97de3EED8b10c15D62b674DF168342AbDE2";

const gnosisWalletLocal = "0x565adf5685a986090070865adfadcad60986f315"

const wftmTokenSushiPairLocal = "";

const tokenAddressLocal = "";

const crvFactoryLocal = "0xabC000d88f23Bb45525E447528DBF656A9D55bf5";


////////////////////XB ECOSYSTEM CONSTANTS////////////////////

const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
const REGISTRATOR_ROLE = "0xdd88b11b15acff9f6c1a117b7fc4e5831658d0c8b1649b14ae3ddfbb1bc1b418";


///// Inflation info /////

const targetMinted = ethers.utils.parseEther('25000'); 
const periodsCount = 100 * 7 * 86400; // 100 weeks (about 2 years)
const periodDuration = 1; // 1 sec

///// Bonus Campaign info /////

const bonusEmissionAmount = ethers.utils.parseEther("5000");

/// Mainnet ///
const startMintTimeMainnet = ethers.BigNumber.from('75');
const stopRegisterTimeMainnet = ethers.BigNumber.from(time.duration.days(60).toString());
const bonusCampaignRewardsDurationMainnet = ethers.BigNumber.from(time.duration.days(7).mul(new BN('25')).toString()); 

/// Testnet ///
const startMintTimeTestnet = ethers.BigNumber.from('1');
const stopRegisterTimeTestnet = ethers.BigNumber.from(time.duration.days(1).toString());
const bonusCampaignRewardsDurationTestnet = ethers.BigNumber.from(time.duration.days(7).toString()); 

/// Local ///
const startMintTimeLocal = ethers.BigNumber.from('75');
const stopRegisterTimeLocal = ethers.BigNumber.from(time.duration.days(60).toString());
const bonusCampaignRewardsDurationLocal = ethers.BigNumber.from(time.duration.days(7).mul(new BN('25')).toString()); 

///// VeToken info /////

const veTokenName = "Voting-escrowed Token";
const veTokenSymbol = "veToken";
const veTokenVersion = "0.0.1";

/// Mainnet ///
const minLockDurationMainnet = ethers.BigNumber.from(time.duration.days(1).toString());
/// Testnet ///
const minLockDurationTestnet = ethers.BigNumber.from(time.duration.minutes(5).toString());
/// Local ///
const minLockDurationLocal = ethers.BigNumber.from(time.duration.days(1).toString());


///// Merkle Tree Dispenser /////


/// Mainnet ///
const merkleTreeMainnet = new MerkleTree(whitelistMainnet.map(x => keccak256(x)), keccak256, { sortPairs: true });
const merkleRootMainnet = merkleTreeMainnet.getHexRoot();
const totalNumberOfBlocksMainnet = 22217143;  // average block time in Fantom Mainnet is 0.7s (https://fantom.foundation/blog/fantom-general-update-june-14-2021/)

/// Testnet ///
const merkleTreeTestnet = new MerkleTree(whitelistTestnet.map(x => keccak256(x)), keccak256, { sortPairs: true });
const merkleRootTestnet = merkleTreeTestnet.getHexRoot();
const totalNumberOfBlocksTestnet = 370286;  // average block time in Fantom Mainnet is 0.7s (https://fantom.foundation/blog/fantom-general-update-june-14-2021/)
/// Local ///
const merkleTreeLocal = new MerkleTree(whitelistLocal.map(x => keccak256(x)), keccak256, { sortPairs: true });
const merkleRootLocal = merkleTreeLocal.getHexRoot();
const totalNumberOfBlocksLocal = 22217143;  // average block time in Fantom Mainnet is 0.7s (https://fantom.foundation/blog/fantom-general-update-june-14-2021/)


///// VSR /////

const rewardsDuration = ethers.BigNumber.from(time.duration.days(7).toString());

/// Mainnet ////
const bondedLockDurationMainnet = ethers.BigNumber.from(time.duration.days(5).toString());

/// Testnet ////
const bondedLockDurationTestnet = ethers.BigNumber.from(time.duration.minutes(10).toString());

/// Local ////
const bondedLockDurationLocal = ethers.BigNumber.from(time.duration.days(5).toString());

const treasuryFeeBps = 1000;
const referralFeeBps = 1000;
const walletFeeBps = 100;

const treasuryInflationWeight = 2500;
const sushiVaultWeigth = 2500;
const triCryptoVaultWeight = 5000;

const sumWeight = treasuryInflationWeight + triCryptoVaultWeight + sushiVaultWeigth;


///// Vaults info /////
const artifactsNamesForVaults = [
  "TriCryptoHiveVault",
  "SpookyVault",
];

const deployNamesForVaults = [
  "CurveVault",
  "CurveVault",
];

const tricryptoVaultName = "3Crypto Vault LP";
const tricryptoVaultSymbol = "3CVLP";
const sushiVaultName = "SpookySwap Vault LP";
const sushiVaultSymbol = "SSVLP";

/// Mainnet ///

const groupsOfConstructorsArgumentsForVaultsMainnet = [
  // stake token addresses
  [
    curve3cryptoLpTokenMainnet, // stake token address 3crypto LP token
    wftmTokenSushiPairMainnet, // stake token address Token/FTM SpookySwap LP token
  ],

  // names
  [
    tricryptoVaultName, // 3crypto hive vault name
    sushiVaultName,  // sushi vault name
  ],

  // symbols
  [
    tricryptoVaultSymbol, // 3crypto hive vault symbol
    sushiVaultSymbol,  // sushi vault symbol
  ],

  // gauges for vaults
  [
    curve3cryptoGaugeAddressMainnet, // 3crypto hive vault gauge address
    ZERO_ADDRESS, // sushi swap vault gauge address
  ],

  // artifacts names for saving
  artifactsNamesForVaults,

  [
    triCryptoVaultWeight,
    sushiVaultWeigth
  ],

  deployNamesForVaults
];

const rewardTokensArtifactsNamesMainnet = [
  'GovernanceToken',
  'CRV'
];

/// Testnet ///

const groupsOfConstructorsArgumentsForVaultsTestnet = [
  // stake token addresses
  [
    wftmTokenSushiPairTestnet,//curve3cryptoLpTokenTestnet, // stake token address 3crypto LP token
    wftmTokenSushiPairTestnet, // stake token address Token/FTM SpookySwap LP token
  ],

  // names
  [
    tricryptoVaultName, // 3crypto hive vault name
    sushiVaultName,  // sushi vault name
  ],

  // symbols
  [
    tricryptoVaultSymbol, // 3crypto hive vault symbol
    sushiVaultSymbol,  // sushi vault symbol
  ],

  // gauges for vaults
  [
    ZERO_ADDRESS, // 3crypto hive vault gauge address
    ZERO_ADDRESS, // sushi swap vault gauge address
  ],

  // artifacts names for saving
  artifactsNamesForVaults,

  [
    triCryptoVaultWeight,
    sushiVaultWeigth
  ],

  deployNamesForVaults
];

const rewardTokensArtifactsNamesTestnet = [
  'GovernanceToken',
  'CRV'
];

/// For local tests ///

const groupsOfConstructorsArgumentsForVaultsLocal = [
  // stake token addresses
  [
    curve3cryptoLpTokenLocal, // stake token address 3crypto LP token
    wftmTokenSushiPairLocal, // stake token address Token/FTM SpookySwap LP token
  ],

  // names
  [
    tricryptoVaultName, // 3crypto hive vault name
    sushiVaultName,
  ],

  // symbols
  [
    tricryptoVaultSymbol, // 3crypto hive vault symbol
    sushiVaultSymbol,
  ],

  // gauges for vaults
  [
    curve3cryptoGaugeAddressLocal, // 3crypto hive vault gauge address
    ZERO_ADDRESS, // sushi swap vault gauge address
  ],

  // artifacts names for saving
  artifactsNamesForVaults,

  [
    triCryptoVaultWeight,
    sushiVaultWeigth
  ],

  deployNamesForVaults
];

const rewardTokensArtifactsNamesLocal = [
  'GovernanceToken',
  'CRV'
]


////////////////////////////////////////////
// Constants Ends
////////////////////////////////////////////

const getMockToken = async (name, symbol, amount, deploy, deployer, skipDeploymentIfAlreadyDeployed, save) => {
  let mockTokenDeployment = await deploy("MockToken", {
    from: deployer,
    args: [name, symbol, amount]
  });
  await save(name, mockTokenDeployment);
  return await hre.ethers.getContractAt("MockToken", mockTokenDeployment.address);
}

const getMock = async (interface, artifactName, deploy, deployer, skipDeploymentIfAlreadyDeployed, save, prepareMocks) => {
  let mock = await deploy("MockContract", {
    from: deployer
  });
  await save(artifactName, mock);
  const result = await hre.ethers.getContractAt(interface, mock.address);
  mock = await hre.ethers.getContractAt("MockContract", mock.address);
  if (prepareMocks) {
    await prepareMocks(mock, result);
  }
  return result;
}

const mintNativeTokens = async (signer, amount) => {
  await hre.network.provider.send("hardhat_setBalance", [
    signer.address,
    `0x${ether(amount).toString(16)}`,
  ]);
}

const withImpersonatedSigner = async (signerAddress, action) => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [signerAddress],
  });

  const impersonatedSigner = await hre.ethers.getSigner(signerAddress);
  await action(impersonatedSigner);

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [signerAddress],
  });
}

module.exports = {

  /// Main info ///
  MINTER_ROLE,
  mintNativeTokens,
  ZERO_ADDRESS,
  DEAD_WALLET,
  ZERO,
  ONE,
  TWO,
  THREE,
  FOUR,
  FIVE,
  TEN,
  HUN,
  THO,
  getMockToken,
  getMock,
  skipDeploymentIfAlreadyDeployed,
  withImpersonatedSigner,
  REGISTRATOR_ROLE,

  /// Inflation ///
  targetMinted,
  periodsCount,
  periodDuration,

  /// External addresses ///
  uniswapRouterAddressMainnet,
  uniswapRouterAddressTestnet,
  uniswapRouterAddressLocal,

  curve3cryptoPoolAddressMainnet,
  curve3cryptoPoolAddressTestnet,
  curve3cryptoPoolAddressLocal,

  curve3cryptoLpTokenMainnet,
  curve3cryptoLpTokenTestnet,
  curve3cryptoLpTokenLocal,
  
  curve3cryptoGaugeAddressMainnet,
  curve3cryptoGaugeAddressTestnet,
  curve3cryptoGaugeAddressLocal,

  crvTokenAddressMainnet,
  crvTokenAddressTestnet,
  crvTokenAddressLocal,

  wrappedNativeAddressMainnet,
  wrappedNativeAddressTestnet,
  wrappedNativeAddressLocal,

  usdtAddressMainnet,
  usdtAddressTestnet,
  usdtAddressLocal,

  wrappedNativeUsdtPairMainnet,
  wrappedNativeUsdtPairTestnet,
  wrappedNativeUsdtPairLocal,

  gnosisWalletMainnet,
  gnosisWalletTestnet,
  gnosisWalletLocal,

  wftmTokenSushiPairMainnet,
  wftmTokenSushiPairTestnet,
  wftmTokenSushiPairLocal,

  tokenAddressMainnet,
  tokenAddressTestnet,
  tokenAddressLocal,

  /// Bonus Campaign ///
  startMintTimeMainnet,
  startMintTimeTestnet,
  startMintTimeLocal,

  stopRegisterTimeMainnet,
  stopRegisterTimeTestnet,
  stopRegisterTimeLocal,

  bonusCampaignRewardsDurationMainnet,
  bonusCampaignRewardsDurationTestnet,
  bonusCampaignRewardsDurationLocal,

  bonusEmissionAmount,

  /// VeToken Info ///
  minLockDurationMainnet,
  minLockDurationTestnet,
  minLockDurationLocal,
  veTokenName,
  veTokenSymbol,
  veTokenVersion,

  /// Merkle Tree dispenser info ///

  whitelistMainnet,
  whitelistTestnet,
  whitelistLocal,
  merkleRootMainnet,
  merkleRootTestnet,
  merkleRootLocal,
  merkleTreeMainnet,
  merkleTreeTestnet,
  merkleTreeLocal,
  totalNumberOfBlocksMainnet,
  totalNumberOfBlocksTestnet,
  totalNumberOfBlocksLocal,



  /// VSR info ///

  rewardsDuration,
  bondedLockDurationMainnet,
  bondedLockDurationTestnet,
  bondedLockDurationLocal,

  /// Vaults info ///
  artifactsNamesForVaults,
  
  tricryptoVaultName,
  tricryptoVaultSymbol,
  sushiVaultName,
  sushiVaultSymbol,
  
  treasuryFeeBps,
  referralFeeBps,
  walletFeeBps,

  treasuryInflationWeight,
  sushiVaultWeigth,
  triCryptoVaultWeight,

  groupsOfConstructorsArgumentsForVaultsMainnet,
  groupsOfConstructorsArgumentsForVaultsTestnet,  
  groupsOfConstructorsArgumentsForVaultsLocal,

  rewardTokensArtifactsNamesMainnet,
  rewardTokensArtifactsNamesTestnet,
  rewardTokensArtifactsNamesLocal,

  crvFactoryMainnet,
  crvFactoryTestnet,
  crvFactoryLocal,

  sumWeight

};
