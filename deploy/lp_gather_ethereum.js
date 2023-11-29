const hre = require("hardhat");

const {   
  wrappedNativeAddressLocal,
  usdtAddressLocal,
  uniswapRouterAddressLocal,
  ZERO,
  usdtAddressMainnet,
  crvTokenAddressLocal
} = require('./helpers.js');

const { 
  convexBoosterAddressLocal,
  convexCvxCrvCrvPoolIndexLocal,
  crvRewardAddressLocal,
  cvxRewardAddressLocal,
  cvxCrvCrvLpAddressLocal,
  curveCrvCvxCrvPoolLocal,

} = require('./helpers_ethereum');

const routerAbi = require('./abi/routerAbi.json');
const sushiRouterAbi = require('./abi/sushi_router.json');
const tricryptoPoolAbi = require('./abi/3crypto_pool.json');
const erc20Abi = require('./abi/erc20Abi.json');
const crvRewardAbi = require('./abi/crvReward.json');
const cvxRewardAbi = require('./abi/cvxReward.json');
const crvAbi = require('./abi/crv.json');
const crvCvxCrvPoolAbi = require('./abi/curveMetaPool.json');
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");


module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();


  let crv = await deployments.get('CRV');
  crv = await ethers.getContractAt(crvAbi, crv.address);

  // const crvUsdtPairAddress = '0x3eEd0Af1c5F350C6571525D9E3EEea7d2608af81';
  const crvCvxCrvPoolLPFakeDeployment = {
    address: cvxCrvCrvLpAddressLocal,
    abi: erc20Abi
  }
  await save('CrvCvxCrvPoolLP', crvCvxCrvPoolLPFakeDeployment); 

  const crvCvxCrvLpToken = await ethers.getContractAt('ERC20', cvxCrvCrvLpAddressLocal);


  const crvCvxCrvCurvePoolFakeDeployment = {
    address: curveCrvCvxCrvPoolLocal,
    abi: crvCvxCrvPoolAbi
  }
  await save('CrvCvxCrvCurvePool', crvCvxCrvCurvePoolFakeDeployment);
  // const crvCvxCrvCurvePool = await ethers.getContractAt(crvCvxCrvPoolAbi, curveCrvCvxCrvPoolLocal);

  // const sushiRouterFakeDeployment = {
  //   address: uniswapRouterAddressLocal,
  //   abi: sushiRouterAbi
  // }
  // await save('SushiRouter', sushiRouterFakeDeployment);

  const uniswapRouterFakeDeployment = {
    address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    abi: sushiRouterAbi
  }
  await save('UniswapRouter', uniswapRouterFakeDeployment);


  const now = Math.round(Date.now() / 1000);

  ///// ALICE BUYS /////
  await execute(
    'UniswapRouter',
    {from: alice, value: ethers.utils.parseEther('1')},
    'swapExactETHForTokens',
    ZERO,
    [wrappedNativeAddressLocal, crvTokenAddressLocal],
    alice,
    now
  );


  const aliceCRVBalance = await crv.balanceOf(alice);


  await execute(
    'CRV',
    {from: alice},
    'approve',
    curveCrvCvxCrvPoolLocal,
    aliceCRVBalance.mul(BigNumber.from('9')).div(BigNumber.from('10'))
  );

  await execute(
    'CrvCvxCrvCurvePool',
    {from: alice},
    'add_liquidity',
    [aliceCRVBalance.mul(BigNumber.from('9')).div(BigNumber.from('10')), ZERO],
    ZERO
  );



  // // ///// BOB BUYS /////
  await execute(
    'UniswapRouter',
    {from: bob, value: ethers.utils.parseEther('1')},
    'swapExactETHForTokens',
    ZERO,
    [wrappedNativeAddressLocal, crvTokenAddressLocal],
    bob,
    now
  );


  console.log("here2")

  const bobCRVBalance = await crv.balanceOf(bob);

  console.log("here3")

  await execute(
    'CRV',
    {from: bob},
    'approve',
    curveCrvCvxCrvPoolLocal,
    bobCRVBalance.mul(BigNumber.from('9')).div(BigNumber.from('10'))
  );

  await execute(
    'CrvCvxCrvCurvePool',
    {from: bob},
    'add_liquidity',
    [bobCRVBalance.mul(BigNumber.from('9')).div(BigNumber.from('10')), ZERO],
    ZERO
  );



  // // ///// CHARLIE BUYS /////
  await execute(
    'UniswapRouter',
    {from: charlie, value: ethers.utils.parseEther('1')},
    'swapExactETHForTokens',
    ZERO,
    [wrappedNativeAddressLocal, crvTokenAddressLocal],
    charlie,
    now
  );

  console.log("here4")

  const charlieCRVBalance = await crv.balanceOf(charlie);

  console.log("here5")

  await execute(
    'CRV',
    {from: charlie},
    'approve',
    curveCrvCvxCrvPoolLocal,
    charlieCRVBalance.mul(BigNumber.from('9')).div(BigNumber.from('10'))
  );

  await execute(
    'CrvCvxCrvCurvePool',
    {from: charlie},
    'add_liquidity',
    [charlieCRVBalance.mul(BigNumber.from('9')).div(BigNumber.from('10')), ZERO],
    ZERO
  );



}
module.exports.tags = ["lp_gather_ethereum"];