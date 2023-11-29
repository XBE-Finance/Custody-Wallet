const hre = require("hardhat");

const {   
  wrappedNativeAddressLocal,
  usdtAddressLocal,
  uniswapRouterAddressLocal,
  ZERO,
  usdtAddressMainnet
} = require('./helpers.js');

const {curve3cryptoLpTokenLocal} = require('./helpers_fantom');

const { curve3cryptoPoolAddressLocal } = require('./helpers_fantom');

const routerAbi = require('./abi/routerAbi.json');
const sushiRouterAbi = require('./abi/sushi_router.json');
const tricryptoPoolAbi = require('./abi/3crypto_pool.json');
const erc20Abi = require('./abi/erc20Abi.json');
const ether = require("@openzeppelin/test-helpers/src/ether");


module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute, read, rawTx } = deployments;
  const { deployer, alice, bob, charlie } = await getNamedAccounts();

  const usdtFakeDeployment = {
    address: usdtAddressLocal,
    abi: erc20Abi
  }
  await save('fUSDT', usdtFakeDeployment);

  const usdt = await ethers.getContractAt('IERC20', usdtAddressLocal);
  const triCryptoLpToken = await ethers.getContractAt('ERC20', curve3cryptoLpTokenLocal);

  const sushiRouterFakeDeployment = {
    address: uniswapRouterAddressLocal,
    abi: sushiRouterAbi
  }
  await save('SushiRouter', sushiRouterFakeDeployment);

  const tricryptoPoolFakeDeployment = {
    address: curve3cryptoPoolAddressLocal,
    abi: tricryptoPoolAbi
  }
  await save('Curve3CryptoPool', tricryptoPoolFakeDeployment);

  const tricryptoLPFakeDeployment = {
    address: curve3cryptoLpTokenLocal,
    abi: erc20Abi
  }
  await save('Curve3CryptoLP', tricryptoLPFakeDeployment);


  const now = Math.round(Date.now() / 1000);
 

  ///// ALICE BUYS /////
  await execute(
    'SushiRouter',
    {from: alice, value: ethers.utils.parseEther('100')},
    'swapExactETHForTokens',
    ZERO,
    [wrappedNativeAddressLocal, usdtAddressLocal],
    alice,
    now
  );

  const aliceUSDTBalance = await usdt.balanceOf(alice);

  await execute(
    'fUSDT',
    {from: alice},
    'approve',
    curve3cryptoPoolAddressLocal,
    aliceUSDTBalance
  );

  await execute(
    'Curve3CryptoPool',
    {from: alice},
    'add_liquidity',
    [aliceUSDTBalance, ZERO, ZERO],
    ZERO
  );




  // ///// BOB BUYS /////
  await execute(
    'SushiRouter',
    {from: bob, value: ethers.utils.parseEther('100')},
    'swapExactETHForTokens',
    ZERO,
    [wrappedNativeAddressLocal, usdtAddressLocal],
    bob,
    now
  );

  const bobUSDTBalance = await usdt.balanceOf(bob);

  await execute(
    'fUSDT',
    {from: bob},
    'approve',
    curve3cryptoPoolAddressLocal,
    bobUSDTBalance
  );

  await execute(
    'Curve3CryptoPool',
    {from: bob},
    'add_liquidity',
    [bobUSDTBalance, ZERO, ZERO],
    ZERO
  );



  // ///// CHARLIE BUYS /////
  await execute(
    'SushiRouter',
    {from: charlie, value: hre.ethers.utils.parseEther('100')},
    'swapExactETHForTokens',
    ZERO,
    [wrappedNativeAddressLocal, usdtAddressLocal],
    charlie,
    now
  );

  const charlieUSDTBalance = await usdt.balanceOf(charlie);

  await execute(
    'fUSDT',
    {from: charlie},
    'approve',
    curve3cryptoPoolAddressLocal,
    charlieUSDTBalance
  );

  await execute(
    'Curve3CryptoPool',
    {from: charlie},
    'add_liquidity',
    [charlieUSDTBalance, ZERO, ZERO],
    ZERO
  );



}
module.exports.tags = ["lp_gather_fantom"];