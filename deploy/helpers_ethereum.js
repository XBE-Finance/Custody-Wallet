
const { ether, time, BN } = require("@openzeppelin/test-helpers");
const hre = require("hardhat");
const ethers = hre.ethers;
const whitelistLocal = require('./data/whitelist.js');
const whitelistTestnet = require('./data/whitelistTestnet.js');
const whitelistMainnet = require('./data/whitelistMainnet.js');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const EthCrypto = require("eth-crypto");
const { BigNumber } = require('ethers');



const xbeInfoSnapshot = require('../test/data/XBE_INFO_Snapshot.json');


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
const uniswapRouterAddressMainnet = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";   // Sushi Swap router

const cvxCrvCrvLpAddressMainnet = "0x9D0464996170c6B9e75eED71c68B99dDEDf279e8";
const convexBoosterAddressMainnet = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";

const crvTokenAddressMainnet = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const cvxTokenAddressMainnet = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
const cvxCrvTokenAddressMainnet = "0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7";


const wrappedNativeAddressMainnet = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; //WETH

const usdtAddressMainnet = "0xdac17f958d2ee523a2206206994597c13d831ec7";

const wrappedNativeUsdtPairMainnet = "0x58Dc5a51fE44589BEb22E8CE67720B5BC5378009";

const wrappedNativeTokenSushiPairMainnet = "";

const tokenAddressMainnet = "";

const cvxRewardAddressMainnet = "0xCF50b810E57Ac33B91dCF525C6ddd9881B139332";
const crvRewardAddressMainnet = "0x0392321e86F42C2F94FBb0c6853052487db521F0";
const curveCrvCvxCrvPoolMainnet = "0x9D0464996170c6B9e75eED71c68B99dDEDf279e8";
const curveCrvCvxCrvGaugeMainnet = "0x903dA6213a5A12B61c821598154EfAd98C3B20E4";
const convexCvxCrvCrvPoolIndexMainnet = 41;

const gnosisWalletMainnet = "0x1F3f016493B1FA49ECF2eeA3FA85F3D7ACE36273"

const paymentTokenForICOAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";


/// Testnet ///

const uniswapRouterAddressTestnet = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const cvxCrvCrvLpAddressTestnet = "";
const convexBoosterAddressTestnet = "";

const crvTokenAddressTestnet = "";
const cvxTokenAddressTestnet = "";
const cvxCrvTokenAddressTestnet = "";

const wrappedNativeAddressTestnet = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

const usdtAddressTestnet = "0x3B00Ef435fA4FcFF5C209a37d1f3dcff37c705aD";

const wrappedNativeUsdtPairTestnet = "0x4EBc22824d14c33A4E5f84E8D9D5F69D56f55FB8";

const wrappedNativeTokenSushiPairTestnet = "";

const tokenAddressTestnet = "0xf44b0a158240b91378A035119064F0515B01574c";

const cvxRewardAddressTestnet = "";
const crvRewardAddressTestnet = "";
const curveCrvCvxCrvGaugeTestnet = "0x903dA6213a5A12B61c821598154EfAd98C3B20E4";
const convexCvxCrvCrvPoolIndexTestnet = 0;
const curveCrvCvxCrvPoolTestnet = "";

const gnosisWalletTestnet = "0x1F3f016493B1FA49ECF2eeA3FA85F3D7ACE36273"

const backendAddressMainnet = "0x4729E4120369a674E4fF54637D448B83B35D9Fc8";




/// For local tests ///

const uniswapRouterAddressLocal = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";

const cvxCrvCrvLpAddressLocal = "0x9D0464996170c6B9e75eED71c68B99dDEDf279e8";
const convexBoosterAddressLocal = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";

const crvTokenAddressLocal = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const cvxTokenAddressLocal = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
const cvxCrvTokenAddressLocal = "0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7";

const wrappedNativeAddressLocal = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const usdtAddressLocal = "0xdac17f958d2ee523a2206206994597c13d831ec7";

const wrappedNativeUsdtPairLocal = "0x58Dc5a51fE44589BEb22E8CE67720B5BC5378009";

const wrappedNativeTokenSushiPairLocal = "";

const tokenAddressLocal = "";

const cvxRewardAddressLocal = "0xCF50b810E57Ac33B91dCF525C6ddd9881B139332";
const crvRewardAddressLocal = "0x0392321e86F42C2F94FBb0c6853052487db521F0";
const convexCvxCrvCrvPoolIndexLocal = 41;
const curveCrvCvxCrvGaugeLocal = "0x903dA6213a5A12B61c821598154EfAd98C3B20E4";

const curveCrvCvxCrvPoolLocal = "0x9D0464996170c6B9e75eED71c68B99dDEDf279e8";

const gnosisWalletLocal = "0x1F3f016493B1FA49ECF2eeA3FA85F3D7ACE36273"

const backendAddressTestnet = "0x4729E4120369a674E4fF54637D448B83B35D9Fc8";




////////////////////XB ECOSYSTEM CONSTANTS////////////////////

const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
const REGISTRATOR_ROLE = "0xdd88b11b15acff9f6c1a117b7fc4e5831658d0c8b1649b14ae3ddfbb1bc1b418";


///// Inflation info /////

const targetMinted = ethers.utils.parseEther('20000'); 
const periodsCount = 100 * 7 * 86400; // 100 weeks (about 2 years)
const periodDuration = 1; // 1 sec

///// Bonus Campaign info /////

const bonusEmissionAmount = ethers.utils.parseEther("5000");

/// Mainnet ///
const startMintTimeMainnet = ethers.BigNumber.from(time.duration.weeks('75').toString());
const stopRegisterTimeMainnet = ethers.BigNumber.from(time.duration.days(60).toString());
const bonusCampaignRewardsDurationMainnet = ethers.BigNumber.from(time.duration.days(7).mul(new BN('25')).toString()); 

/// Testnet ///
const startMintTimeTestnet = ethers.BigNumber.from(time.duration.hours('75').toString());
const stopRegisterTimeTestnet = ethers.BigNumber.from(time.duration.hours(8).toString());
const bonusCampaignRewardsDurationTestnet = ethers.BigNumber.from(time.duration.hours(25).toString()); 

/// Local ///
const startMintTimeLocal = ethers.BigNumber.from(time.duration.weeks('75').toString());
const stopRegisterTimeLocal = ethers.BigNumber.from(time.duration.days(60).toString());
const bonusCampaignRewardsDurationLocal = ethers.BigNumber.from(time.duration.days(7).mul(new BN('25')).toString()); 

///// VeToken info /////

const veTokenName = "Voting-escrowed Token";
const veTokenSymbol = "veToken";
const veTokenVersion = "0.0.1";

/// Mainnet ///
const minLockDurationMainnet = ethers.BigNumber.from(time.duration.weeks(1).toString());
/// Testnet ///
const minLockDurationTestnet = ethers.BigNumber.from(time.duration.hours(1).toString());
/// Local ///
const minLockDurationLocal = ethers.BigNumber.from(time.duration.weeks(1).toString());


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

const percentageToBeLocked = ethers.BigNumber.from('80');

const treasuryFeeBps = 1000;
const referralFeeBps = 500;


const treasuryInflationWeight = 2500;
const gnosisInflationWeight = 6500;
const CRVcvxCRVVaultWeight = 1000;

/// Testnet ///
const rewardsDurationTestnet = ethers.BigNumber.from(time.duration.hours(1).toString());
// Mainnet
const rewardsDurationMainnet = ethers.BigNumber.from(time.duration.days(7).toString());
// Local
const rewardsDurationLocal = ethers.BigNumber.from(time.duration.days(7).toString());


const sumWeight = treasuryInflationWeight + CRVcvxCRVVaultWeight + gnosisInflationWeight;


///// Vaults info /////
const artifactsNamesForVaults = [
  "CRVcvxCRVHiveVault"
];

const deployNamesForVaults = [
  "ConvexVault"
];


const CRVcvxCRVVaultName = "CRVcvxCRV Vault LP";
const CRVcvxCRVVaultSymbol = "CCCVLP";

/// Mainnet ///

const groupsOfConstructorsArgumentsForVaultsMainnet = [
  // stake token addresses
  [
    cvxCrvCrvLpAddressMainnet // stake token address 3crypto LP token
  ],

  // names
  [
    CRVcvxCRVVaultName // 3crypto hive vault name
  ],

  // symbols
  [
    CRVcvxCRVVaultSymbol // 3crypto hive vault symbol
  ],


  [
    convexBoosterAddressMainnet
  ],

  // artifacts names for saving
  artifactsNamesForVaults,

  [
    CRVcvxCRVVaultWeight
  ],

  
  deployNamesForVaults,


  [
    crvRewardAddressMainnet
  ],

  [
    cvxRewardAddressMainnet
  ],

  [
    convexCvxCrvCrvPoolIndexMainnet,
  ],

  [
    curveCrvCvxCrvPoolMainnet
  ],

  [
    cvxTokenAddressMainnet
  ],

  [
    uniswapRouterAddressMainnet
  ],

  [
    percentageToBeLocked
  ]

];


/// Testnet ///

const groupsOfConstructorsArgumentsForVaultsTestnet = [
  // stake token addresses
  [
    cvxCrvCrvLpAddressTestnet // stake token address 3crypto LP token
  ],

  // names
  [
    CRVcvxCRVVaultName // 3crypto hive vault name
  ],

  // symbols
  [
    CRVcvxCRVVaultSymbol // 3crypto hive vault symbol
  ],


  [
    convexBoosterAddressTestnet
  ],

  // artifacts names for saving
  artifactsNamesForVaults,

  [
    CRVcvxCRVVaultWeight
  ],

  
  deployNamesForVaults,


  [
    crvRewardAddressTestnet
  ],

  [
    cvxRewardAddressTestnet
  ],

  [
    convexCvxCrvCrvPoolIndexTestnet
    
  ],

  [
    curveCrvCvxCrvPoolTestnet
  ],

  [
    cvxTokenAddressTestnet
  ],

  [
    uniswapRouterAddressTestnet
  ],

  [
    percentageToBeLocked
  ]

];

const rewardTokensArtifactsNamesTestnet = [
  'GovernanceToken',
  'CRV',
  'CVX'
];

/// For local tests ///

const groupsOfConstructorsArgumentsForVaultsLocal = [
  // stake token addresses
  [
    cvxCrvCrvLpAddressLocal // stake token address 3crypto LP token
  ],

  // names
  [
    CRVcvxCRVVaultName // 3crypto hive vault name
  ],

  // symbols
  [
    CRVcvxCRVVaultSymbol // 3crypto hive vault symbol
  ],


  [
    convexBoosterAddressLocal
  ],

  // artifacts names for saving
  artifactsNamesForVaults,

  [
    CRVcvxCRVVaultWeight
  ],

  
  deployNamesForVaults,


  [
    crvRewardAddressLocal
  ],

  [
    cvxRewardAddressLocal
  ],

  [
    convexCvxCrvCrvPoolIndexLocal,
  ],

  [
    curveCrvCvxCrvPoolLocal
  ],

  [
    cvxTokenAddressLocal
  ],

  [
    uniswapRouterAddressLocal
  ],

  [
    percentageToBeLocked
  ]

];

const rewardTokensArtifactsNamesLocal = [
  'GovernanceToken',
  'CRV',
  'CVX'
];

//// ICO info
const initialPrice = ethers.utils.parseEther("150");    // p0
const limitPrice = ethers.utils.parseEther("500");    // A
const rateCoeff = ethers.utils.parseEther("10000000");    // B
const point = ethers.utils.parseEther("169.0308509");    // b
const maxSupply = ethers.utils.parseEther("1000");    


/// OLD XBE CONTRACTS INFO ////

const XBE_VSR_ABI = [
  "event Staked(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",

  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function lockedAmount(address account) view returns (uint256)",
  "function lockedEnd(address account) view returns (uint256)",
  "function calculateBoostLevel(address account) view returns (uint256)",
  "function earned(address account) view returns (uint256)",
];

const XBE_BC_ABI = [
  "event Staked(address indexed user, uint256 amount)",

  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function earned(address account) view returns (uint256)",
];

const XBE_ABI = [
  "event Transfer(address indexed from, address indexed user, uint256 value)",
  "event Mint(address indexed from, address indexed user, uint256 value)",

  "function balanceOf(address account) view returns (uint256)",
];

const XBE_REFERRAL_PROGRAM_ABI = [
  "event RegisterUser(address user, address referrer)",

  "function rewards(address account, address token) view returns (uint256)",
];

const VEXBE_ABI = [
  "event Deposit(address indexed user, uint256 value, uint256 indexed locktime, int128 _type, uint256 ts)",

  "function balanceOf(address account) view returns (uint256)",
  "function lockedAmount(address account) view returns (uint256)",
  "function lockedEnd(address account) view returns (uint256)",
];

const VAULT_ABI = [
  "event Staked(address indexed user, uint256 amount)",

  "function balanceOf(address account) view returns (uint256)",
  "function earned(address token, address account) external view returns (uint256)",
  
]

const provider = new ethers.providers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_MAINNET}`
);



const feeBpsOnClaim = 2100;
const oldXbeAddress = "0x5DE7Cc4BcBCa31c473F6D2F27825Cfb09cc0Bb16";
const oldBonusCampaignAddress = "0x248c64eAc8AC88eDE0af69CB855F92a7C5d64aB5";
const oldVeTokenAddress = "0x5564585073D4Ca3866931b0660Df29921C4BBbcc";
const oldVsrAddress = "0x0b1fA4b11Edbcb6d35731549211D83C857fFBC0a";
const oldFraxVaultAddress = "0x4eFe054989750d5c230E5262fe07112b3D38c657";
const oldSushiVaultAddress = "0x5220871eB8Fab14400787aA27FC26774CBC46F99";
const oldCrvCvxVaultAddress = "0x317b50327E48a54c56b0212a7aAbe8A5A2573AB0";
const oldReferralProgramAddress = "0xDC8ea506C234D740799df9aAFc391C70D49F48b5";


const vsrContract = new ethers.Contract(oldVsrAddress, XBE_VSR_ABI, provider);
const bcContract = new ethers.Contract(oldBonusCampaignAddress, XBE_BC_ABI, provider);
const referralContract = new ethers.Contract(oldReferralProgramAddress, XBE_REFERRAL_PROGRAM_ABI, provider);
const xbeContract = new ethers.Contract(oldXbeAddress, XBE_ABI, provider);
const vexbeContract = new ethers.Contract(oldVeTokenAddress, VEXBE_ABI, provider);
const sushiVaultContract = new ethers.Contract(oldSushiVaultAddress, VAULT_ABI, provider);
const fraxVaultContract = new ethers.Contract(oldFraxVaultAddress, VAULT_ABI, provider);
const crvCvxVaultContract = new ethers.Contract(oldCrvCvxVaultAddress, VAULT_ABI, provider);

for (const key of Object.keys(xbeInfoSnapshot)) {
  xbeInfoSnapshot[key].address = key;
}

let leaves = []

for (let i = 0; i < Object.keys(xbeInfoSnapshot).length; i++) {
  const x = xbeInfoSnapshot[Object.keys(xbeInfoSnapshot)[i]]
  const hash = EthCrypto.hash.keccak256([
    { type: "address", value: Object.keys(xbeInfoSnapshot)[i] },
    { type: "uint256", value: BigNumber.from(x.xbeBalance) },
    { type: "uint256", value: BigNumber.from(x.vsrStaked) },
    { type: "uint256", value: BigNumber.from(x.bcStaked) },
    { type: "uint256", value: BigNumber.from(x.bcReward) },
    { type: "uint256", value: BigNumber.from(x.referralReward) },
    { type: "uint256", value: BigNumber.from(x.vexbeLockedAmount) },
    { type: "uint256", value: BigNumber.from(x.vexbeLockedEnd) },
    { type: "uint256", value: BigNumber.from(x.sushiVaultEarned) },
    { type: "uint256", value: BigNumber.from(x.fraxVaultEarned) },
    { type: "uint256", value: BigNumber.from(x.crvCvxVaultEarned) }
  ]);
  leaves.push(hash);
}

const merkleTree = new MerkleTree(
    leaves,
    keccak256, 
    { sortPairs: true }
);

const merkleRoot = "0x079ca423fbba67bd848a7f180ee3ee67df41ed181f26d37e109fb37b71373f03"; //merkleTree.getHexRoot();


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

  cvxCrvCrvLpAddressMainnet,
  cvxCrvCrvLpAddressTestnet,
  cvxCrvCrvLpAddressLocal,

  convexBoosterAddressMainnet,
  convexBoosterAddressTestnet,
  convexBoosterAddressLocal,

  cvxRewardAddressMainnet,
  cvxRewardAddressTestnet,
  cvxRewardAddressLocal,

  crvTokenAddressMainnet,
  crvTokenAddressTestnet,
  crvTokenAddressLocal,

  cvxCrvTokenAddressMainnet,
  cvxCrvTokenAddressTestnet,
  cvxCrvTokenAddressLocal,

  wrappedNativeAddressMainnet,
  wrappedNativeAddressTestnet,
  wrappedNativeAddressLocal,

  usdtAddressMainnet,
  usdtAddressTestnet,
  usdtAddressLocal,

  wrappedNativeUsdtPairMainnet,
  wrappedNativeUsdtPairTestnet,
  wrappedNativeUsdtPairLocal,

  wrappedNativeTokenSushiPairMainnet,
  wrappedNativeTokenSushiPairTestnet,
  wrappedNativeTokenSushiPairLocal,

  tokenAddressMainnet,
  tokenAddressTestnet,
  tokenAddressLocal,

  crvRewardAddressMainnet,
  crvRewardAddressTestnet,
  crvRewardAddressLocal,

  convexCvxCrvCrvPoolIndexMainnet,
  convexCvxCrvCrvPoolIndexTestnet,
  convexCvxCrvCrvPoolIndexLocal,

  curveCrvCvxCrvPoolMainnet,
  curveCrvCvxCrvPoolTestnet,
  curveCrvCvxCrvPoolLocal,

  cvxTokenAddressMainnet,
  cvxTokenAddressTestnet,
  cvxTokenAddressLocal,

  curveCrvCvxCrvGaugeMainnet,
  curveCrvCvxCrvGaugeTestnet,
  curveCrvCvxCrvGaugeLocal,

  gnosisWalletLocal,
  gnosisWalletTestnet,
  gnosisWalletMainnet,

  paymentTokenForICOAddress,

  backendAddressMainnet,
  backendAddressTestnet,

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

  percentageToBeLocked,

  /// Testnet 
  rewardsDurationTestnet,
  /// Mainnet
  rewardsDurationMainnet,
  // Local
  rewardsDurationLocal,

  /// Vaults info ///
  artifactsNamesForVaults,
  
  CRVcvxCRVVaultName,
  CRVcvxCRVVaultSymbol,
  
  treasuryFeeBps,
  referralFeeBps,

  treasuryInflationWeight,
  CRVcvxCRVVaultWeight,
  gnosisInflationWeight,

  groupsOfConstructorsArgumentsForVaultsMainnet,
  groupsOfConstructorsArgumentsForVaultsTestnet,  
  groupsOfConstructorsArgumentsForVaultsLocal,

  rewardTokensArtifactsNamesTestnet,
  rewardTokensArtifactsNamesLocal,

  sumWeight,

  /// ICO info

  initialPrice,
  limitPrice,
  rateCoeff,
  point,
  maxSupply,
  

  /// Migrator info
  feeBpsOnClaim,
  
  oldXbeAddress,
  oldBonusCampaignAddress,
  oldVeTokenAddress,
  oldVsrAddress,
  oldFraxVaultAddress,
  oldSushiVaultAddress,
  oldCrvCvxVaultAddress,
  oldReferralProgramAddress,

  vsrContract,
  bcContract,
  referralContract,
  xbeContract,
  vexbeContract,
  fraxVaultContract,
  crvCvxVaultContract,

  provider,

  merkleTree,
  merkleRoot





};
