const { ethers, waffle } = require('hardhat');
const { BigNumber } = require('ethers');
const { expect } = require('chai');
const chai = require('chai');
const { time } = require('@openzeppelin/test-helpers');
const erc20Artifact = require('../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json');
const crvFactoryAbi = require('../deploy/abi/crv_factory.json');
const routerAbi = require('../deploy/abi/routerAbi.json');

const {
  targetMinted,
  periodsCount,
  periodDuration,
  triCryptoVaultWeight,
  treasuryFeeBps,
  treasuryInflationWeight,
  referralFeeBps,
  gnosisWalletLocal,
  crvFactoryLocal,
  sumWeight,
  uniswapRouterAddressLocal,
  veTokenName,
  veTokenVersion,
  minLockDurationLocal,
  veTokenSymbol
} = require('../deploy/helpers.js');
const ether = require('@openzeppelin/test-helpers/src/ether');
const { TASK_EXPORT } = require('hardhat-deploy');
const { zeroPad } = require('ethers/lib/utils');

chai.use(require('chai-bignumber')());

const MINUTE = BigNumber.from('60')
const WEEK = BigNumber.from("86400").mul(BigNumber.from("7"));
const day = 86400;
const DAY = BigNumber.from("86400");
const week = day * 7;
const hour = 3600;
const HOUR = BigNumber.from("3600");


const bigPeriodDuration = BigNumber.from(periodDuration);

const ZERO = BigNumber.from('0');
const ONE = BigNumber.from('1');
const TWO = BigNumber.from('2');
const THREE = BigNumber.from('3');
const FOUR = BigNumber.from('4');
const FIVE = BigNumber.from('5');
const SIX = BigNumber.from('6');
const SEVEN = BigNumber.from('7');
const NINE = BigNumber.from('9');
const TEN = BigNumber.from('10');
const HUN = BigNumber.from('100');

const BPS_BASE = BigNumber.from('10000');

const MULTIPLIER = BigNumber.from('1000000000000000000'); // 1e18

const bigTargetMinted = BigNumber.from(targetMinted);
const bigPeriodsCount = BigNumber.from(periodsCount);
const acceptableError = targetMinted.div(bigPeriodsCount).mul(MINUTE).mul(TWO);

const { expectEqual } = require('./helpers')

describe('VeToken tests', async () => {
  const accounts = waffle.provider.getWallets();
  const owner = accounts[0];
  const alice = accounts[1];
  const bob = accounts[2];
  const charlie = accounts[3];

  beforeEach('deployment', async() => {

    await deployments.fixture(['main_local']); 

    this.token = await deployments.get('GovernanceToken');
    this.token = new ethers.Contract(this.token.address, this.token.abi, ethers.provider);

    this.inflation = await deployments.get('Inflation');
    this.inflation = await ethers.getContractAt('Inflation', this.inflation.address);

    this.referralProgram = await deployments.get('ReferralProgram');
    this.referralProgram = new ethers.Contract(this.referralProgram.address, this.referralProgram.abi, ethers.provider);

    this.treasury = await deployments.get('Treasury');
    this.treasury = new ethers.Contract(this.treasury.address, this.treasury.abi, ethers.provider);

    this.gauge = await deployments.get('TriCryptoGauge');
    this.gauge = await ethers.getContractAt('ICurve3CryptoGauge', this.gauge.address);

    this.vsr = await deployments.get('VotingStakingRewardsForLockers');
    this.vsr = await ethers.getContractAt('VotingStakingRewardsForLockers', this.vsr.address);

    this.lockSubscription = await deployments.get('LockSubscription');
    this.lockSubscription = await ethers.getContractAt('LockSubscription', this.lockSubscription.address);


    this.veToken = await deployments.get('VeToken');
    this.veToken = new ethers.Contract(this.veToken.address, this.veToken.abi, ethers.provider);

    this.crv = await deployments.get('CRV');
    this.crv = await ethers.getContractAt(this.crv.abi, this.crv.address);

    this.cvx = await deployments.get('CVX');
    this.cvx = await ethers.getContractAt(this.cvx.abi, this.cvx.address);


    await this.token.connect(owner).mint(alice.address, ethers.utils.parseEther('100'));
    await this.token.connect(owner).mint(bob.address, ethers.utils.parseEther('100'));
  });

  describe('VSR tests', async () => {
   

    it('should correct set initial values', async() => {
      expect(await this.veToken.admin()).to.be.equal(owner.address);
      const tokenDecimals = await this.token.decimals();
      expect(await this.veToken.decimals()).to.be.equal(tokenDecimals);
      expect(await this.veToken.name()).to.be.equal(veTokenName);
      expect(await this.veToken.symbol()).to.be.equal(veTokenSymbol);
      expect(await this.veToken.version()).to.be.equal(veTokenVersion);
      expect(await this.veToken.registrationMediator()).to.be.equal(this.lockSubscription.address);
      expect(await this.veToken.minLockDuration()).to.be.equal(minLockDurationLocal);
    });





    

  });

});
