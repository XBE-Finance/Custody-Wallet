const { ethers, waffle, deployments } = require('hardhat');
const util = require('util');
const { BigNumber } = require('ethers');
const { expect } = require('chai');
const chai = require('chai');
const { time } = require('@openzeppelin/test-helpers');
const erc20Artifact = require('../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json');
const crvFactoryAbi = require('../deploy/abi/crv_factory.json')
const crvRewardsAbi = require('../deploy/abi/crvReward.json')
const cvxRewardsAbi = require('../deploy/abi/cvxReward.json')

const {
  targetMinted,
  periodsCount,
  periodDuration,
  treasuryFeeBps,
  treasuryInflationWeight,
  referralFeeBps,
  crvFactoryLocal,
  sumWeight,
  percentageToBeLocked,
} = require('../deploy/helpers.js');

const {
  convexCvxCrvCrvPoolIndexLocal,
  CRVcvxCRVVaultWeight,
  cvxCrvTokenAddressLocal,
  curveCrvCvxCrvPoolLocal
} = require('../deploy/helpers_ethereum');
const ether = require('@openzeppelin/test-helpers/src/ether');
const { TASK_EXPORT } = require('hardhat-deploy');

chai.use(require('chai-bignumber')());

const MINUTE = BigNumber.from('60')
const WEEK = BigNumber.from("86400").mul(BigNumber.from("7"));
const week = 86400 * 7;
const hour = 3600;
const day = 86400;
const HOUR = BigNumber.from("3600");

const base = ethers.utils.parseEther('1');
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

const BPS_BASE = BigNumber.from('10000');

const MULTIPLIER = BigNumber.from('1000000000000000000'); // 1e18

const totalRewardFeeBps = BigNumber.from(treasuryFeeBps + referralFeeBps);

const bigTargetMinted = BigNumber.from(targetMinted);
const bigPeriodsCount = BigNumber.from(periodsCount);
const acceptableError = targetMinted.div(bigPeriodsCount).mul(MINUTE).mul(TWO);


let aliceInitialBalance;
let bobInitialBalance;
let charlieInitialBalance;

const gaugeRewardTokenPerPeriod = ethers.utils.parseEther("100");

const { expectEqual, HUN } = require('./helpers');

describe('Vault tests', async () => {

  const accounts = waffle.provider.getWallets();
  const owner = accounts[0];
  const alice = accounts[1];
  const bob = accounts[2];
  const charlie = accounts[3];
  const delegate = accounts[4];

  let vaultEarned1;
  let vaultEarned2;
  let vaultEarned3;
  let vaultEarned4;
  let vaultEarned5;
  let vaultEarned6;

  beforeEach('deployment', async() => {

    await deployments.fixture(['main_local']); 

    this.token = await deployments.get('GovernanceToken');
    this.token = new ethers.Contract(this.token.address, this.token.abi, ethers.provider);

    this.inflation = await deployments.get('Inflation');
    this.inflation = await ethers.getContractAt('Inflation', this.inflation.address);
    this.crvCvxCrvHiveVault = await deployments.get('CRVcvxCRVHiveVault');
    this.crvCvxCrvHiveVault = await ethers.getContractAt('IVault', this.crvCvxCrvHiveVault.address);

    this.crvCvxCrvLP = await deployments.get('CrvCvxCrvPoolLP');
    this.crvCvxCrvLP = await ethers.getContractAt('IERC20', this.crvCvxCrvLP.address);

    this.referralProgram = await deployments.get('ReferralProgram');
    this.referralProgram = new ethers.Contract(this.referralProgram.address, this.referralProgram.abi, ethers.provider);

    this.treasury = await deployments.get('Treasury');
    this.treasury = new ethers.Contract(this.treasury.address, this.treasury.abi, ethers.provider);

    this.booster = await deployments.get('Booster');
    this.booster = await ethers.getContractAt('IBooster', this.booster.address);

    this.gauge = await deployments.get('CrvCvxCrvGauge');
    this.gauge = await ethers.getContractAt(this.gauge.abi, this.gauge.address);

    this.crvReward = await deployments.get('CrvRewards');
    this.crvReward = await ethers.getContractAt(this.crvReward.abi, this.crvReward.address);

    this.cvxReward = await deployments.get('CvxRewards');
    this.cvxReward = await ethers.getContractAt(this.cvxReward.abi, this.cvxReward.address);

    this.crv = await deployments.get('CRV');
    this.crv = await ethers.getContractAt(this.crv.abi, this.crv.address);

    this.cvx = await deployments.get('CVX');
    this.cvx = await ethers.getContractAt(this.cvx.abi, this.cvx.address);

    this.vsr = await deployments.get('VotingStakingRewardsForLockers');
    this.vsr = await ethers.getContractAt('VotingStakingRewardsForLockers', this.vsr.address);

    this.veToken = await deployments.get('VeToken');
    this.veToken = new ethers.Contract(this.veToken.address, this.veToken.abi, ethers.provider);

    aliceInitialBalance = await this.crvCvxCrvLP.balanceOf(alice.address);

    bobInitialBalance = await this.crvCvxCrvLP.balanceOf(bob.address);

    charlieInitialBalance = await this.crvCvxCrvLP.balanceOf(charlie.address);

    
  });

  describe('Convex Vault tests', async () => {


    it('should correct set initial values', async() => {

      const reward0 = await this.crvCvxCrvHiveVault.rewards(0);
      expect(reward0.rewardToken).to.be.equal(this.token.address);
      expect(reward0.accRewardPerShare).to.be.lt(acceptableError.mul(MULTIPLIER));
      expect(reward0.lastBalance).to.be.lt(acceptableError);
      expect(reward0.payedRewardForPeriod).to.be.equal(ZERO);

      const reward1 = await this.crvCvxCrvHiveVault.rewards(1);
      expect(reward1.rewardToken).to.be.equal(this.crv.address);
      expect(reward1.accRewardPerShare).to.be.equal(ZERO);
      expect(reward1.lastBalance).to.be.equal(ZERO);
      expect(reward1.payedRewardForPeriod).to.be.equal(ZERO);

      const reward2 = await this.crvCvxCrvHiveVault.rewards(2);
      expect(reward2.rewardToken).to.be.equal(this.cvx.address);
      expect(reward2.accRewardPerShare).to.be.equal(ZERO);
      expect(reward2.lastBalance).to.be.equal(ZERO);
      expect(reward2.payedRewardForPeriod).to.be.equal(ZERO);

      expect(await this.crvCvxCrvHiveVault.inflation()).to.be.equal(this.inflation.address);
      expect(await this.crvCvxCrvHiveVault.referralProgram()).to.be.equal(this.referralProgram.address);
      expect(await this.crvCvxCrvHiveVault.boosterAddress()).to.be.equal(this.booster.address);
      expect(await this.crvCvxCrvHiveVault.stakeToken()).to.be.equal(this.crvCvxCrvLP.address);
      expect(await this.crvCvxCrvHiveVault.poolIndex()).to.be.equal(convexCvxCrvCrvPoolIndexLocal);
      expect(await this.crvCvxCrvHiveVault.crvRewardAddress()).to.be.equal(this.crvReward.address);

    });


    it('should correct deposit for user', async() => {

      const amountToDeposit = aliceInitialBalance.div(TEN); 
      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, amountToDeposit);
      let userReferral = await this.referralProgram.users(alice.address);
      expect(userReferral.exists).to.be.false;
      const gaugeBalanceBefore = await this.crvCvxCrvLP.balanceOf(this.gauge.address);
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(amountToDeposit, alice.address);

      userReferral = await this.referralProgram.users(alice.address);
      expect(userReferral.exists).to.be.true;
                                             
      expectEqual(await this.crvCvxCrvHiveVault.totalSupply(), amountToDeposit, acceptableError);
      expect(await this.crvCvxCrvHiveVault.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.equal(ZERO);
      expect(await this.crvCvxCrvHiveVault.balanceOf(alice.address)).to.be.equal(amountToDeposit);
      expect(await this.crvCvxCrvLP.balanceOf(alice.address)).to.be.equal(aliceInitialBalance.sub(amountToDeposit));
      expect((await this.crvCvxCrvLP.balanceOf(this.gauge.address)).sub(gaugeBalanceBefore)).to.be.equal(amountToDeposit);
      expect(await this.crvCvxCrvHiveVault.earned(alice.address, 0)).to.be.equal(ZERO);

      // const user = await this.crvCvxCrvHiveVault.userInfo(alice.address);
      // expect(user).to.be.equal(amountToDeposit);

      const totalSupply = await this.crvCvxCrvHiveVault.totalSupply();

      expect(totalSupply).to.be.equal(amountToDeposit.add(ONE));

      await time.increase(periodDuration * week);
      await time.advanceBlock();
      expect(await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.lt(acceptableError);
      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, amountToDeposit);

      await this.crvCvxCrvHiveVault.connect(alice).depositFor(amountToDeposit, alice.address);
      expectEqual(await this.crvCvxCrvHiveVault.totalSupply(), amountToDeposit.mul(TWO), acceptableError);
      expect(await this.crvCvxCrvHiveVault.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.equal(ZERO);
      expect(await this.crvCvxCrvHiveVault.balanceOf(alice.address)).to.be.equal(amountToDeposit.mul(TWO));

      expect((await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).sub((bigTargetMinted.div(bigPeriodsCount)).mul(CRVcvxCRVVaultWeight).div(sumWeight)).div(WEEK)).to.be.lt(acceptableError); // if there is only one vault
      expect(await this.crvCvxCrvHiveVault.earned(alice.address, 0)).to.be.gt(ZERO);
      expect((await this.crvCvxCrvHiveVault.earned(alice.address, 0)).sub((bigTargetMinted.div(bigPeriodsCount)).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(WEEK)).abs()).to.be.lt(acceptableError);
    })

    it('should correct deposit underlying tokens for user', async() => {

      const aliceCrvBalance = await this.crv.balanceOf(alice.address);
      const amountToDeposit = aliceCrvBalance.div(TEN); 
      await this.crv.connect(alice).approve(this.crvCvxCrvHiveVault.address, amountToDeposit);
      let userReferral = await this.referralProgram.users(alice.address);
      expect(userReferral.exists).to.be.false;
      const gaugeBalanceBefore = await this.crvCvxCrvLP.balanceOf(this.gauge.address);
      const totalSupplyBefore = await this.crvCvxCrvHiveVault.totalSupply();
      await this.crvCvxCrvHiveVault.connect(alice).depositUnderlyingTokensFor([amountToDeposit, ZERO], ZERO, alice.address);

      userReferral = await this.referralProgram.users(alice.address);
      expect(userReferral.exists).to.be.true;
                                  
      const crvCvxCrvLPAmount = (await this.crvCvxCrvLP.balanceOf(this.gauge.address)).sub(gaugeBalanceBefore);
      expect(crvCvxCrvLPAmount).to.be.gt(ZERO);
      expectEqual((await this.crvCvxCrvHiveVault.totalSupply()).sub(totalSupplyBefore), crvCvxCrvLPAmount, acceptableError, true);
      expect(await this.crvCvxCrvHiveVault.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.equal(ZERO);
      expect(await this.crvCvxCrvHiveVault.balanceOf(alice.address)).to.be.equal(crvCvxCrvLPAmount);
      expect(await this.crvCvxCrvLP.balanceOf(alice.address)).to.be.equal(aliceInitialBalance);
      expect(await this.crv.balanceOf(alice.address)).to.be.equal(aliceCrvBalance.sub(amountToDeposit));
      expect(await this.crvCvxCrvHiveVault.earned(alice.address, 0)).to.be.equal(ZERO);

      const totalSupply = await this.crvCvxCrvHiveVault.totalSupply();

      expectEqual(totalSupply, crvCvxCrvLPAmount, acceptableError, true);

      await time.increase(periodDuration * week);
      await time.advanceBlock();
      expect(await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.lt(acceptableError);

      expect((await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).sub((bigTargetMinted.div(bigPeriodsCount)).mul(CRVcvxCRVVaultWeight).div(sumWeight)).div(WEEK)).to.be.lt(acceptableError); // if there is only one vault
      expectEqual(await this.crvCvxCrvHiveVault.earned(alice.address, 0), (bigTargetMinted.div(bigPeriodsCount)).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(WEEK), acceptableError, true);
    })

    

    it('should correct transfer Vault LPs', async() => {
      const amountToDeposit = aliceInitialBalance.div(TEN); 
      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, amountToDeposit);
      const gaugeBalanceBefore = await this.crvCvxCrvLP.balanceOf(this.gauge.address);
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(amountToDeposit, alice.address);

      expect(await this.crvCvxCrvHiveVault.earned(bob.address, 0)).to.be.equal(ZERO);

      await this.crvCvxCrvHiveVault.connect(alice).transfer(bob.address, amountToDeposit);

      userReferralAlice = await this.referralProgram.users(alice.address);
      expect(userReferralAlice.exists).to.be.true;

      userReferralBob = await this.referralProgram.users(bob.address);
      expect(userReferralBob.exists).to.be.false;
                            
      expectEqual(await this.crvCvxCrvHiveVault.totalSupply(), amountToDeposit, acceptableError);
      expect(await this.crvCvxCrvHiveVault.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.equal(ZERO);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(alice.address), ZERO, acceptableError, false);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(bob.address), amountToDeposit, acceptableError, true);
      expect(await this.crvCvxCrvLP.balanceOf(alice.address)).to.be.equal(aliceInitialBalance.sub(amountToDeposit));
      expect(await this.crvCvxCrvLP.balanceOf(bob.address)).to.be.equal(bobInitialBalance);
      expect((await this.crvCvxCrvLP.balanceOf(this.gauge.address)).sub(gaugeBalanceBefore)).to.be.equal(amountToDeposit);
      expectEqual(await this.crvCvxCrvHiveVault.earned(alice.address, 0), ZERO, acceptableError, false);
      expectEqual(await this.crvCvxCrvHiveVault.earned(bob.address, 0), ZERO, acceptableError, false);

      const totalSupply = await this.crvCvxCrvHiveVault.totalSupply();

      expectEqual(totalSupply, amountToDeposit, acceptableError, true);

      await time.increase(periodDuration * week);
      await time.advanceBlock();
      expect(await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.lt(acceptableError);

      expect((await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).sub((bigTargetMinted.div(bigPeriodsCount)).mul(CRVcvxCRVVaultWeight).div(sumWeight)).div(WEEK)).to.be.lt(acceptableError); // if there is only one vault
      expectEqual(await this.crvCvxCrvHiveVault.earned(alice.address, 0), ZERO, acceptableError, false);
      expectEqual(await this.crvCvxCrvHiveVault.earned(bob.address, 0), (bigTargetMinted.div(bigPeriodsCount)).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(WEEK), acceptableError, true);
    });

    it('should correct set delegator and distribute reward', async() => {
      const amountToDeposit = aliceInitialBalance.div(TEN); 
      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, amountToDeposit);
      const gaugeBalanceBefore = await this.crvCvxCrvLP.balanceOf(this.gauge.address);
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(amountToDeposit, alice.address);


      await this.crvCvxCrvHiveVault.setDelegate(delegate.address, charlie.address); 
      expect(await this.crvCvxCrvHiveVault.rewardDelegates(delegate.address)).to.be.equal(charlie.address);
      await this.crvCvxCrvHiveVault.connect(alice).transfer(delegate.address, amountToDeposit);  // Alice stakes her LPs to some protocol

      expectEqual(await this.crvCvxCrvHiveVault.earned(alice.address, 0), ZERO, acceptableError, false);
      expectEqual(await this.crvCvxCrvHiveVault.earned(delegate.address, 0), ZERO, acceptableError, false);

      const totalSupply = await this.crvCvxCrvHiveVault.totalSupply();

      expectEqual(totalSupply, amountToDeposit, acceptableError, true);

      await time.increase(periodDuration * week);
      await time.advanceBlock();

      expectEqual(await this.crvCvxCrvHiveVault.earned(alice.address, 0), ZERO, acceptableError, false);
      expectEqual(await this.crvCvxCrvHiveVault.earned(delegate.address, 0), (bigTargetMinted.div(bigPeriodsCount)).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(WEEK), acceptableError, true);

      const delegateBalanceBefore = await this.token.balanceOf(charlie.address);
      await this.crvCvxCrvHiveVault.connect(charlie).getRewardForDelegator(delegate.address);
      const delegateBalanceAfter = await this.token.balanceOf(charlie.address);

      expectEqual(delegateBalanceAfter.sub(delegateBalanceBefore), (bigTargetMinted.div(bigPeriodsCount)).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(WEEK).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE), acceptableError, true);

    });
    
    it('should correct deposit for user if there is deposit fee', async() => {
      const amountToDeposit = aliceInitialBalance.div(TEN);
      const depositFeeBps = BigNumber.from('100'); // 0.1%
      const depositFeeReceiver = "0xC9f92bF3add3d462b9f0d937Fff4878e076beE09";

      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, amountToDeposit);

      await this.crvCvxCrvHiveVault.connect(owner).setDepositFeeReceiver(depositFeeReceiver);
      await this.crvCvxCrvHiveVault.connect(owner).setDepositFeeBps(depositFeeBps);

      const depositFeeReceiverBalanceBefore = await this.crvCvxCrvLP.balanceOf(depositFeeReceiver);
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(amountToDeposit, alice.address);
      const depositFeeReceiverBalanceAfter = await this.crvCvxCrvLP.balanceOf(depositFeeReceiver);
      expect(depositFeeReceiverBalanceAfter.sub(depositFeeReceiverBalanceBefore)).to.be.equal(amountToDeposit.mul(depositFeeBps).div(BPS_BASE));

      // const user = await this.crvCvxCrvHiveVault.userInfo(alice.address);
      // expect(user.sub(amountToDeposit.mul(BPS_BASE.sub(depositFeeBps)).div(BPS_BASE)).abs()).to.be.lt(TWO);
      // expect(user).to.be.gt(ZERO);

      const reward = await this.crvCvxCrvHiveVault.rewards(0);
      const totalSupply = await this.crvCvxCrvHiveVault.totalSupply();

      expect(totalSupply.sub(amountToDeposit.mul(BPS_BASE.sub(depositFeeBps)).div(BPS_BASE).add(ONE)).abs()).to.be.lt(TWO);
      expect(totalSupply).to.be.gt(ZERO);

    })

    it('should correct withdraw for user', async() => {
      const initialCrvBalanceAlice = await this.crv.balanceOf(alice.address);
      const amountToDeposit = aliceInitialBalance.div(TEN);
      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, amountToDeposit);
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(amountToDeposit, alice.address);

      await time.increase(periodDuration * 2 * week);
      await time.advanceBlock();

      const expectedTokenReward = (bigTargetMinted.div(bigPeriodsCount).mul(TWO).mul(WEEK)).mul(CRVcvxCRVVaultWeight).div(sumWeight); // if there is only one vault
      const gaugeBalanceBefore = await this.crvCvxCrvLP.balanceOf(this.gauge.address);
      await this.crvCvxCrvHiveVault.connect(alice).withdraw(amountToDeposit.div(TWO), alice.address); // get Vault LPs

      expect((await this.crvCvxCrvHiveVault.earned(alice.address, 0)).sub(expectedTokenReward).abs()).to.be.lt(acceptableError);
      expect(await this.crvCvxCrvHiveVault.earned(alice.address, 0)).to.be.gt(ZERO);
      const vaultRewardBalance = await this.crv.balanceOf(this.crvCvxCrvHiveVault.address);
      
      expect((await this.crvCvxCrvHiveVault.earned(alice.address, 1)).sub(vaultRewardBalance).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crvCvxCrvHiveVault.earned(alice.address, 1)).to.be.gt(ZERO);

      expect(gaugeBalanceBefore.sub(await this.crvCvxCrvLP.balanceOf(this.gauge.address))).to.be.equal(amountToDeposit.div(TWO));
      expectEqual(await this.crvCvxCrvLP.balanceOf(alice.address), aliceInitialBalance.sub(amountToDeposit.div(TWO)), acceptableError);

      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address);

      // expect(await this.token.balanceOf(alice.address)).to.be.equal(ZERO);
      expectEqual(await this.token.balanceOf(alice.address), expectedTokenReward.mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(HUN.sub(percentageToBeLocked)).div(HUN), acceptableError, true);

      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);

      const aliceBoost = await this.vsr.calculateBoostLevel(alice.address);

      expectEqual(await this.vsr.balanceOf(alice.address), expectedTokenReward.mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(percentageToBeLocked).div(HUN).mul(aliceBoost).div(base), acceptableError, true);

      expectEqual(await this.crvCvxCrvLP.balanceOf(alice.address), aliceInitialBalance.sub(amountToDeposit.div(TWO)), ONE);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(alice.address), amountToDeposit.div(TWO), ONE);
      expect((await this.crv.balanceOf(alice.address)).sub(vaultRewardBalance.mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(alice.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.treasury.address)).sub(vaultRewardBalance.mul(treasuryFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.treasury.address)).to.be.gt(ZERO);
      let treasuryFee = expectedTokenReward.mul(treasuryFeeBps).div(BPS_BASE);
      let treasuryInflation = bigTargetMinted.div(bigPeriodsCount).mul(TWO).mul(WEEK).mul(treasuryInflationWeight).div(sumWeight);
      expect((await this.token.balanceOf(this.treasury.address)).sub(treasuryFee/*.add(treasuryInflation)*/).abs()).to.be.lt(acceptableError);
      expect(await this.token.balanceOf(this.treasury.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.referralProgram.address)).sub(vaultRewardBalance.mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);
      expect((await this.token.balanceOf(this.referralProgram.address)).sub(expectedTokenReward.mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(acceptableError);
      expect(await this.token.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);


      // let user = await this.crvCvxCrvHiveVault.userInfo(alice.address);
      // expectEqual(user, amountToDeposit.div(TWO), TWO);

      const totalSupply = await this.crvCvxCrvHiveVault.totalSupply();

      expectEqual(totalSupply, amountToDeposit.div(TWO).add(ONE), ONE);

      await time.increase(periodDuration * week);
      await time.advanceBlock();

      await this.crvCvxCrvHiveVault.connect(alice).withdraw(amountToDeposit.div(TWO), alice.address);
      const expectedTokenReward2 = (bigTargetMinted.div(bigPeriodsCount).mul(WEEK)).mul(CRVcvxCRVVaultWeight).div(sumWeight); 
      expect((await this.crvCvxCrvHiveVault.earned(alice.address, 0)).sub(expectedTokenReward2).abs()).to.be.lt(acceptableError);
      expect(await this.crvCvxCrvHiveVault.earned(alice.address, 0)).to.be.gt(ZERO);

      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address);

      expectEqual(await this.crvCvxCrvLP.balanceOf(alice.address), aliceInitialBalance, ONE);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(alice.address), ZERO, ONE, false);
      expectEqual(await this.token.balanceOf(alice.address), (expectedTokenReward.add(expectedTokenReward2)).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(HUN.sub(percentageToBeLocked)).div(HUN), acceptableError, true);

      const aliceBoost2 = await this.vsr.calculateBoostLevel(alice.address);
      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);
      expectEqual(await this.vsr.balanceOf(alice.address), (expectedTokenReward.mul(aliceBoost)).add(expectedTokenReward2.mul(aliceBoost2)).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(percentageToBeLocked).div(HUN).div(base), acceptableError, true);

      treasuryFee = expectedTokenReward.add(expectedTokenReward2).mul(treasuryFeeBps).div(BPS_BASE);
      treasuryInflation = treasuryInflation.add(bigTargetMinted.div(bigPeriodsCount).mul(WEEK).mul(treasuryInflationWeight).div(sumWeight))
      expectEqual(await this.token.balanceOf(this.treasury.address), treasuryFee/*.add(treasuryInflation)*/, acceptableError);

      expectEqual(await this.token.balanceOf(this.referralProgram.address), expectedTokenReward.add(expectedTokenReward2).mul(referralFeeBps).div(BPS_BASE), acceptableError);

      // user = await this.crvCvxCrvHiveVault.userInfo(alice.address);
      // expect(user).to.be.equal(ZERO);
    });

    it("should distribute reward properly for each staker", async() => {

      const initialCrvBalanceAlice = await this.crv.balanceOf(alice.address);
      const initialCrvBalanceBob = await this.crv.balanceOf(bob.address);
      const initialCrvBalanceCharlie = await this.crv.balanceOf(charlie.address);

      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, aliceInitialBalance);
      await this.crvCvxCrvLP.connect(bob).approve(this.crvCvxCrvHiveVault.address, bobInitialBalance);
      await this.crvCvxCrvLP.connect(charlie).approve(this.crvCvxCrvHiveVault.address, charlieInitialBalance);

      const defaultAmount = aliceInitialBalance.div(TEN);
      // Alice deposits 10 LPs at period 1
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address);

      // Bob deposits 20 LPs at period 5
      await time.increase(periodDuration * 4 * hour);
      await time.advanceBlock();

      vaultEarned1 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v1

      await this.crvCvxCrvHiveVault.connect(bob).depositFor(defaultAmount.mul(TWO), bob.address);

      // Carol deposits 30 LPs at period 10
      await time.increase(periodDuration * 4 * hour);
      await time.advanceBlock();
      
      vaultEarned2 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v2
      
      await this.crvCvxCrvHiveVault.connect(charlie).depositFor(defaultAmount.mul(THREE), charlie.address);

      // Alice deposits 10 more LPs at period 13. At this point:
      //   Alice should have: (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79 * vaultWeight = 1790.67 * vaultWeight Token
      //   Treasury should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight  = 226.67 * vaultWeight + 400 * 10 * treasuryWeight Token
      //   Referral should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.1 * vaultWeight = 226.67 Token
      //   Gnosis wallet should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.01 * vaultWeight = 22.67 Token
      //   Staking contract should have the remaining: (4000 - 2266.67) * vaultWeight = 1733.33 * vaultWeight Token

      //   Alice should have: (v1 + v2*1/3 + v3*1/6) * 0.79 Gauge Reward Token
      //   Treasury should have  (v1 + v2*1/3 + v3*1/6) * 0.1 Gauge Reward Token
      //   Referral should have  (v1 + v2*1/3 + v3*1/6) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2*1/3 + v3*1/6) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v1 + v2 + v3) - (v1 + v2*1/3 + v3*1/6) = v2*2/3 + v3*5/6 Gauge Reward Token

      await time.increase(periodDuration * 2 * hour);
      await time.advanceBlock();

      vaultEarned3 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v3

      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address)

      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address)

      expect((await this.token.totalSupply()).sub(bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN).mul(HOUR)).abs()).to.lt(acceptableError)
      // (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79
      let tokenEarned1 = FOUR.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      let tokenEarned2 = FOUR.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      let tokenEarned3 = TWO.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      expectEqual(await this.token.balanceOf(alice.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(HUN.sub(percentageToBeLocked)).div(HUN), acceptableError, true) // if there is one vault
      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);
      let vsrTokenBalanceBefore = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);
      // expectEqual(await this.vsr.balanceOf(alice.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);
      
      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER)
      let treasuryFee = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(treasuryFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);
      let treasuryInflation = bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN).mul(HOUR).mul(treasuryInflationWeight).div(sumWeight);
      expectEqual(await this.token.balanceOf(this.treasury.address), treasuryFee/* .add(treasuryInflation) */, acceptableError);

      expectEqual(await this.crv.balanceOf(this.treasury.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(treasuryFeeBps).div(BPS_BASE), MULTIPLIER)

      expectEqual(await this.token.balanceOf(this.referralProgram.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError)
      let referalBalanceBefore = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);

      expectEqual(await this.crv.balanceOf(this.referralProgram.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE), MULTIPLIER);


      expect(await this.token.balanceOf(bob.address)).to.equal(ZERO);
      expect(await this.crv.balanceOf(bob.address)).to.equal(initialCrvBalanceBob);
      expect(await this.token.balanceOf(charlie.address)).to.equal(ZERO);
      expect(await this.crv.balanceOf(charlie.address)).to.equal(initialCrvBalanceCharlie);

      expectEqual(await this.token.balanceOf(this.crvCvxCrvHiveVault.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(FIVE).div(SIX))).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);
      expectEqual(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(FIVE).div(SIX))), MULTIPLIER);


      // Bob withdraws 0.5 Staking tokens at period 23. At this point:
      //   Bob should have: (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.79 * vaultWeight = 1956.1904761905 * vaultWeight Token
      //   Treasury should have 226.67 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 474.289 * vaultWeight Token
      //   Referral should have 226.67 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.1 * vaultWeight = 474.289 * vaultWeight Token
      //   Gnosis wallet should have  22.667 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.01 * vaultWeight = 47.4289 * vaultWeight Token
      //   Staking contract should have the remaining: (1733.33 + 4000 - 2476.19) * vaultWeight = 3257.1428571429 * vaultWeight Token

      //   Bob should have: (v2*2/3 + v3*2/6 + v4*2/7) * 0.79 Gauge Reward Token
      //   Treasury should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.1 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.1 Gauge Reward Token
      //   Referral should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.1 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.01 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v2*2/3 + v3*5/6 + v4) - (v2*2/3 + v3*2/6 + v4*2/7) = v3*1/2 + v4*5/7 Gauge Reward Token


      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned4 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v4
      let tokenEarned4 = TEN.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));

      await this.crvCvxCrvHiveVault.connect(bob).withdraw(defaultAmount.div(TWO), bob.address);
      await this.crvCvxCrvHiveVault.connect(bob).getReward(bob.address);

      expectEqual(await this.token.totalSupply(), bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN.add(TEN)).mul(HOUR), acceptableError);

      expectEqual(await this.veToken.lockedAmount(bob.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(percentageToBeLocked).div(HUN), acceptableError, true);
      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);

      // expectEqual(await this.vsr.balanceOf(alice.address), vsrTokenBalanceBefore, acceptableError);

      vsrTokenBalanceBefore = (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).add(vsrTokenBalanceBefore);

      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER, true);

      // expect(await this.token.balanceOf(alice.address)).to.equal(ZERO);

      // expectEqual(await this.vsr.balanceOf(bob.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);
      expectEqual(await this.crv.balanceOf(bob.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(TWO).div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceBob), MULTIPLIER);

      treasuryFee = treasuryFee.add((tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(treasuryFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight));
      treasuryInflation = treasuryInflation.add(treasuryInflation);
      expectEqual(await this.token.balanceOf(this.treasury.address), treasuryFee/*.add(treasuryInflation)*/, acceptableError);

      expectEqual(await this.crv.balanceOf(this.treasury.address), (vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(treasuryFeeBps).div(BPS_BASE), MULTIPLIER);
      expectEqual(await this.token.balanceOf(this.referralProgram.address), referalBalanceBefore.add((tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight)), acceptableError)
      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect(await this.token.balanceOf(charlie.address)).to.equal("0");
      expectEqual(await this.token.balanceOf(this.crvCvxCrvHiveVault.address), (tokenEarned3.div(TWO)).add(tokenEarned4.mul(FIVE).div(SEVEN)).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);

      expectEqual(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address), vaultEarned3.div(TWO).add(vaultEarned4.mul(FIVE).div(SEVEN)), MULTIPLIER);

      // Alice withdraws 20 LPs at period 33.
      // Bob withdraws 15 LPs at period 43.
      // Carol withdraws 30 LPs at period 53.
      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned5 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v5
      let tokenEarned5 = TEN.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));

      //   Alice should have: (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79 + (10*2/7*400 + 10*2/6.5*400) * 0.79 * vaultWeight +  = 3665.8315018315 * vaultWeight Token
      //   Treasury should have 474.2857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 711.6483516483 * vaultWeight + 400 * 10 * treasuryWeight Token
      //   Referral should have 474.2857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.1 * vaultWeight = 711.6483516483 * vaultWeight Token
      //   Gnosis wallet should have  47.42857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.01 * vaultWeight = 71.16483516483 * vaultWeight Token
      //   Staking contract should have the remaining: (3257.1428571429 + 4000 - (10*2/7*400 + 10*2/6.5*400)) * vaultWeight = 4883.5164835165 * vaultWeight Token

      //   Alice should have: (v1 + v2*1/3 + v3*1/6 + v4*2/7 + v5*2/6.5) * 0.79 +  Gauge Reward Token
      //   Treasury should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.1 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 Gauge Reward Token
      //   Referral should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.1 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.01 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v3*1/2 + v4*5/7) + v5 - (v4*2/7 + v5*2/6.5) = v3*1/2 + v4*3/7 + v5*9/13   Gauge Reward Token

      await this.crvCvxCrvHiveVault.connect(alice).withdraw(defaultAmount.mul(TWO), alice.address);
      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address);
      
      expect((await this.token.totalSupply()).sub(bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN.add(TEN).add(TEN)).mul(HOUR))).to.lt(acceptableError);

      // expect((await this.vsr.balanceOf(alice.address)).sub((tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN)).add(tokenEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight)).abs()).to.be.lt(acceptableError);
      // expect(await this.vsr.balanceOf(alice.address)).to.be.gt(ZERO);
      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER, true);

      // expect(await this.token.balanceOf(alice.address)).to.equal(ZERO);

      expect((await this.crv.balanceOf(this.treasury.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(treasuryFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.treasury.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).sub(vaultEarned3.div(TWO).add(vaultEarned4.mul(THREE).div(SEVEN)).add(vaultEarned5.mul(NINE).div(BigNumber.from("13")))).abs()).to.lt(MULTIPLIER) //if there is one vault
      expect(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.gt(ZERO);

      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned6 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v6

      //   Bob should have: 1956.1904761905 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.79 * vaultWeight = 3738.7545787546 * vaultWeight Token
      //   Treasury should have 711.6483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 937.2893772893 + 400 * 10 * treasuryWeight Token
      //   Referral should have 711.6483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.1 * vaultWeight = 937.2893772893 Token
      //   Gnosis wallet should have  71.16483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.01 * vaultWeight = 93.72893772893 * vaultWeight Token
      //   Staking contract should have the remaining: (4883.5164835165 + 4000 - (10*1.5/6.5*400 + 10*1.5/4.5*400)) * vaultWeight = 6627.1062271062 * vaultWeight Token

      //   Bob should have: (v2*2/3 + v3*2/6 + v4*2/7 + v5*1.5/6.5 + v6*1.5/4.5) * 0.79 Gauge Reward Token
      //   Treasury should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.1 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.1   Gauge Reward Token
      //   Referral should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.1 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.01 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.01 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: v3*1/2 + v4*3/7 + v5*9/13 + v6 - (v5*1.5/6.5 + v6*1.5/4.5) =  v3*1/2 + v4*3/7 + v5*6/13 + v6*2/3 Gauge Reward Token

      await this.crvCvxCrvHiveVault.connect(bob).withdraw(defaultAmount.mul(THREE).div(TWO), bob.address);
      await this.crvCvxCrvHiveVault.connect(bob).getReward(bob.address);

      expectEqual(await this.crv.balanceOf(bob.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(TWO).div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN)).add(vaultEarned5.mul(THREE).div(BigNumber.from("13"))).add(vaultEarned6.div(THREE))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceBob), MULTIPLIER, true);

      // expect(await this.token.balanceOf(bob.address)).to.equal(ZERO);

      expect((await this.crv.balanceOf(this.treasury.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("7")).div(BigNumber.from("13")).add(vaultEarned6.div(THREE)))).mul(treasuryFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.treasury.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("7")).div(BigNumber.from("13")).add(vaultEarned6.div(THREE)))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect(await this.token.balanceOf(charlie.address)).to.equal("0");
      expect((await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).sub(vaultEarned3.div(TWO).add(vaultEarned4.mul(THREE).div(SEVEN)).add(vaultEarned5.mul(SIX).div(BigNumber.from("13"))).add(vaultEarned6.mul(TWO).div(THREE))).abs()).to.lt(MULTIPLIER) //if there is one vault

      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      await this.crvCvxCrvHiveVault.connect(charlie).withdraw(defaultAmount.mul(THREE), charlie.address);
      await this.crvCvxCrvHiveVault.connect(charlie).getReward(charlie.address);

      expectEqual(await this.crvCvxCrvLP.balanceOf(alice.address), aliceInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(alice.address), ZERO, ONE, false);
      expectEqual(await this.crvCvxCrvLP.balanceOf(bob.address), bobInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(bob.address), ZERO, ONE, false);
      expectEqual(await this.crvCvxCrvLP.balanceOf(charlie.address), charlieInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(charlie.address), ZERO, ONE, false);

    });

    it("should distribute reward properly for each staker if somebody randomly called updatePool()", async() => {
      
      const initialCrvBalanceAlice = await this.crv.balanceOf(alice.address);
      const initialCrvBalanceBob = await this.crv.balanceOf(bob.address);
      const initialCrvBalanceCharlie = await this.crv.balanceOf(charlie.address);

      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, aliceInitialBalance);
      await this.crvCvxCrvLP.connect(bob).approve(this.crvCvxCrvHiveVault.address, bobInitialBalance);
      await this.crvCvxCrvLP.connect(charlie).approve(this.crvCvxCrvHiveVault.address, charlieInitialBalance);

      const defaultAmount = aliceInitialBalance.div(TEN);
      // Alice deposits 10 LPs at period 1
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address);


      // Bob deposits 20 LPs at period 5
      await time.increase(periodDuration * 4 * hour);
      await time.advanceBlock();

      vaultEarned1 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v1

      await this.crvCvxCrvHiveVault.connect(bob).updatePool();

      await this.crvCvxCrvHiveVault.connect(bob).depositFor(defaultAmount.mul(TWO), bob.address);

      // Carol deposits 30 LPs at period 10
      await time.increase(periodDuration * 4 * hour);
      await time.advanceBlock();
      
      vaultEarned2 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v2
      await this.crvCvxCrvHiveVault.connect(bob).updatePool();

      await this.crvCvxCrvHiveVault.connect(charlie).depositFor(defaultAmount.mul(THREE), charlie.address);

      // Alice deposits 10 more LPs at period 13. At this point:
      //   Alice should have: (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79 * vaultWeight = 1790.67 * vaultWeight Token
      //   Treasury should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight  = 226.67 * vaultWeight + 400 * 10 * treasuryWeight Token
      //   Referral should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.1 * vaultWeight = 226.67 Token
      //   Gnosis wallet should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.01 * vaultWeight = 22.67 Token
      //   Staking contract should have the remaining: (4000 - 2266.67) * vaultWeight = 1733.33 * vaultWeight Token

      //   Alice should have: (v1 + v2*1/3 + v3*1/6) * 0.79 Gauge Reward Token
      //   Treasury should have  (v1 + v2*1/3 + v3*1/6) * 0.1 Gauge Reward Token
      //   Referral should have  (v1 + v2*1/3 + v3*1/6) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2*1/3 + v3*1/6) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v1 + v2 + v3) - (v1 + v2*1/3 + v3*1/6) = v2*2/3 + v3*5/6 Gauge Reward Token

      await time.increase(periodDuration * 2 * hour);
      await time.advanceBlock();

      vaultEarned3 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v3

      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address)
      await this.crvCvxCrvHiveVault.connect(bob).updatePool();

      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address)
      await this.crvCvxCrvHiveVault.connect(bob).updatePool();


      expect((await this.token.totalSupply()).sub(bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN).mul(HOUR)).abs()).to.lt(acceptableError)
      // expect(await this.token.balanceOf(alice.address)).to.equal(ZERO) // if there is one vault
      // (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79
      let tokenEarned1 = FOUR.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      let tokenEarned2 = FOUR.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      let tokenEarned3 = TWO.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      expectEqual(await this.veToken.lockedAmount(alice.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(percentageToBeLocked).div(HUN), acceptableError, true);
      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);
      let vsrTokenBalanceBefore = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);
      // expectEqual(await this.vsr.balanceOf(alice.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);
      
      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER)
      let treasuryFee = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(treasuryFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);
      let treasuryInflation = bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN).mul(HOUR).mul(treasuryInflationWeight).div(sumWeight);
      expectEqual(await this.token.balanceOf(this.treasury.address), treasuryFee/*.add(treasuryInflation)*/, acceptableError);

      expectEqual(await this.crv.balanceOf(this.treasury.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(treasuryFeeBps).div(BPS_BASE), MULTIPLIER)

      expectEqual(await this.token.balanceOf(this.referralProgram.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError)
      let referalBalanceBefore = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);

      expectEqual(await this.crv.balanceOf(this.referralProgram.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE), MULTIPLIER);

      expect(await this.token.balanceOf(bob.address)).to.equal(ZERO);
      expect(await this.crv.balanceOf(bob.address)).to.equal(initialCrvBalanceBob);
      expect(await this.token.balanceOf(charlie.address)).to.equal(ZERO);
      expect(await this.crv.balanceOf(charlie.address)).to.equal(initialCrvBalanceCharlie);

      expectEqual(await this.token.balanceOf(this.crvCvxCrvHiveVault.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(FIVE).div(SIX))).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);
      expectEqual(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(FIVE).div(SIX))), MULTIPLIER);

      // Bob withdraws 0.5 Staking tokens at period 23. At this point:
      //   Bob should have: (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.79 * vaultWeight = 1956.1904761905 * vaultWeight Token
      //   Treasury should have 226.67 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 474.289 * vaultWeight Token
      //   Referral should have 226.67 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.1 * vaultWeight = 474.289 * vaultWeight Token
      //   Gnosis wallet should have  22.667 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.01 * vaultWeight = 47.4289 * vaultWeight Token
      //   Staking contract should have the remaining: (1733.33 + 4000 - 2476.19) * vaultWeight = 3257.1428571429 * vaultWeight Token

      //   Bob should have: (v2*2/3 + v3*2/6 + v4*2/7) * 0.79 Gauge Reward Token
      //   Treasury should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.1 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.1 Gauge Reward Token
      //   Referral should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.1 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.01 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v2*2/3 + v3*5/6 + v4) - (v2*2/3 + v3*2/6 + v4*2/7) = v3*1/2 + v4*5/7 Gauge Reward Token


      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned4 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v4
      await this.crvCvxCrvHiveVault.connect(bob).updatePool();

      let tokenEarned4 = TEN.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));

      await this.crvCvxCrvHiveVault.connect(bob).withdraw(defaultAmount.div(TWO), bob.address);
      await this.crvCvxCrvHiveVault.connect(bob).getReward(bob.address);

      expectEqual(await this.token.totalSupply(), bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN.add(TEN)).mul(HOUR), acceptableError);

      expectEqual(await this.veToken.lockedAmount(bob.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(percentageToBeLocked).div(HUN), acceptableError, true);
      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);

      // expectEqual(await this.vsr.balanceOf(alice.address), vsrTokenBalanceBefore, acceptableError);

      vsrTokenBalanceBefore = (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).add(vsrTokenBalanceBefore);

      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER, true);

      // expect(await this.token.balanceOf(alice.address)).to.equal(ZERO);

      // expectEqual(await this.vsr.balanceOf(bob.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);
      // expectEqual(await this.crv.balanceOf(bob.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(TWO).div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceBob), MULTIPLIER);

      treasuryFee = treasuryFee.add((tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(treasuryFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight));
      treasuryInflation = treasuryInflation.add(treasuryInflation);
      expectEqual(await this.token.balanceOf(this.treasury.address), treasuryFee/*.add(treasuryInflation)*/, acceptableError);

      expectEqual(await this.crv.balanceOf(this.treasury.address), (vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(treasuryFeeBps).div(BPS_BASE), MULTIPLIER);
      expectEqual(await this.token.balanceOf(this.referralProgram.address), referalBalanceBefore.add((tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight)), acceptableError)
      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect(await this.token.balanceOf(charlie.address)).to.equal("0");
      expectEqual(await this.token.balanceOf(this.crvCvxCrvHiveVault.address), (tokenEarned3.div(TWO)).add(tokenEarned4.mul(FIVE).div(SEVEN)).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);

      expectEqual(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address), vaultEarned3.div(TWO).add(vaultEarned4.mul(FIVE).div(SEVEN)), MULTIPLIER);

      // Alice withdraws 20 LPs at period 33.
      // Bob withdraws 15 LPs at period 43.
      // Carol withdraws 30 LPs at period 53.
      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned5 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v5
      let tokenEarned5 = TEN.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));

      //   Alice should have: (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79 + (10*2/7*400 + 10*2/6.5*400) * 0.79 * vaultWeight +  = 3665.8315018315 * vaultWeight Token
      //   Treasury should have 474.2857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 711.6483516483 * vaultWeight + 400 * 10 * treasuryWeight Token
      //   Referral should have 474.2857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.1 * vaultWeight = 711.6483516483 * vaultWeight Token
      //   Gnosis wallet should have  47.42857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.01 * vaultWeight = 71.16483516483 * vaultWeight Token
      //   Staking contract should have the remaining: (3257.1428571429 + 4000 - (10*2/7*400 + 10*2/6.5*400)) * vaultWeight = 4883.5164835165 * vaultWeight Token

      //   Alice should have: (v1 + v2*1/3 + v3*1/6 + v4*2/7 + v5*2/6.5) * 0.79 +  Gauge Reward Token
      //   Treasury should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.1 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 Gauge Reward Token
      //   Referral should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.1 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.01 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v3*1/2 + v4*5/7) + v5 - (v4*2/7 + v5*2/6.5) = v3*1/2 + v4*3/7 + v5*9/13   Gauge Reward Token

      await this.crvCvxCrvHiveVault.connect(alice).withdraw(defaultAmount.mul(TWO), alice.address);
      await this.crvCvxCrvHiveVault.connect(bob).updatePool();

      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address);
      
      expect((await this.token.totalSupply()).sub(bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN.add(TEN).add(TEN)).mul(HOUR))).to.lt(acceptableError);

      // expect((await this.vsr.balanceOf(alice.address)).sub((tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN)).add(tokenEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight)).abs()).to.be.lt(acceptableError);
      // expect(await this.vsr.balanceOf(alice.address)).to.be.gt(ZERO);
      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER, true);

      // expect(await this.token.balanceOf(alice.address)).to.equal(ZERO);

      expect((await this.crv.balanceOf(this.treasury.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(treasuryFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.treasury.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).sub(vaultEarned3.div(TWO).add(vaultEarned4.mul(THREE).div(SEVEN)).add(vaultEarned5.mul(NINE).div(BigNumber.from("13")))).abs()).to.lt(MULTIPLIER) //if there is one vault
      expect(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.gt(ZERO);

      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned6 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v6

      //   Bob should have: 1956.1904761905 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.79 * vaultWeight = 3738.7545787546 * vaultWeight Token
      //   Treasury should have 711.6483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 937.2893772893 + 400 * 10 * treasuryWeight Token
      //   Referral should have 711.6483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.1 * vaultWeight = 937.2893772893 Token
      //   Gnosis wallet should have  71.16483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.01 * vaultWeight = 93.72893772893 * vaultWeight Token
      //   Staking contract should have the remaining: (4883.5164835165 + 4000 - (10*1.5/6.5*400 + 10*1.5/4.5*400)) * vaultWeight = 6627.1062271062 * vaultWeight Token

      //   Bob should have: (v2*2/3 + v3*2/6 + v4*2/7 + v5*1.5/6.5 + v6*1.5/4.5) * 0.79 Gauge Reward Token
      //   Treasury should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.1 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.1   Gauge Reward Token
      //   Referral should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.1 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.01 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.01 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: v3*1/2 + v4*3/7 + v5*9/13 + v6 - (v5*1.5/6.5 + v6*1.5/4.5) =  v3*1/2 + v4*3/7 + v5*6/13 + v6*2/3 Gauge Reward Token

      await this.crvCvxCrvHiveVault.connect(bob).withdraw(defaultAmount.mul(THREE).div(TWO), bob.address);
      await this.crvCvxCrvHiveVault.connect(bob).updatePool();

      await this.crvCvxCrvHiveVault.connect(bob).getReward(bob.address);

      expectEqual(await this.crv.balanceOf(bob.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(TWO).div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN)).add(vaultEarned5.mul(THREE).div(BigNumber.from("13"))).add(vaultEarned6.div(THREE))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceBob), MULTIPLIER, true);

      // expect(await this.token.balanceOf(bob.address)).to.equal(ZERO);

      expect((await this.crv.balanceOf(this.treasury.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("7")).div(BigNumber.from("13")).add(vaultEarned6.div(THREE)))).mul(treasuryFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.treasury.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("7")).div(BigNumber.from("13")).add(vaultEarned6.div(THREE)))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect(await this.token.balanceOf(charlie.address)).to.equal("0");
      expect((await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).sub(vaultEarned3.div(TWO).add(vaultEarned4.mul(THREE).div(SEVEN)).add(vaultEarned5.mul(SIX).div(BigNumber.from("13"))).add(vaultEarned6.mul(TWO).div(THREE))).abs()).to.lt(MULTIPLIER) //if there is one vault

      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      await this.crvCvxCrvHiveVault.connect(charlie).withdraw(defaultAmount.mul(THREE), charlie.address);
      await this.crvCvxCrvHiveVault.connect(charlie).getReward(charlie.address);

      expectEqual(await this.crvCvxCrvLP.balanceOf(alice.address), aliceInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(alice.address), ZERO, ONE, false);
      expectEqual(await this.crvCvxCrvLP.balanceOf(bob.address), bobInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(bob.address), ZERO, ONE, false);
      expectEqual(await this.crvCvxCrvLP.balanceOf(charlie.address), charlieInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(charlie.address), ZERO, ONE, false);

    });

    it("should distribute reward properly for each staker if stakers do withdrawAndHarvest at the end", async() => {
      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, aliceInitialBalance);
      await this.crvCvxCrvLP.connect(bob).approve(this.crvCvxCrvHiveVault.address, bobInitialBalance);
      await this.crvCvxCrvLP.connect(charlie).approve(this.crvCvxCrvHiveVault.address, charlieInitialBalance);

      const defaultAmount = aliceInitialBalance.div(TEN);

      const initialCrvBalanceAlice = await this.crv.balanceOf(alice.address);
      const initialCrvBalanceBob = await this.crv.balanceOf(bob.address);
      const initialCrvBalanceCharlie = await this.crv.balanceOf(charlie.address);
      // Alice deposits 10 LPs at period 1
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address);

      // Bob deposits 20 LPs at period 5
      await time.increase(periodDuration * 4 * hour);
      await time.advanceBlock();

      vaultEarned1 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v1

      await this.crvCvxCrvHiveVault.connect(bob).depositFor(defaultAmount.mul(TWO), bob.address);

      // Carol deposits 30 LPs at period 10
      await time.increase(periodDuration * 4 * hour);
      await time.advanceBlock();
      
      vaultEarned2 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v2
      
      await this.crvCvxCrvHiveVault.connect(charlie).depositFor(defaultAmount.mul(THREE), charlie.address);

      // Alice deposits 10 more LPs at period 13. At this point:
      //   Alice should have: (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79 * vaultWeight = 1790.67 * vaultWeight Token
      //   Treasury should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight  = 226.67 * vaultWeight + 400 * 10 * treasuryWeight Token
      //   Referral should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.1 * vaultWeight = 226.67 Token
      //   Gnosis wallet should have  (4*400 + 4*1/3*400 + 2*1/6*400) * 0.01 * vaultWeight = 22.67 Token
      //   Staking contract should have the remaining: (4000 - 2266.67) * vaultWeight = 1733.33 * vaultWeight Token

      //   Alice should have: (v1 + v2*1/3 + v3*1/6) * 0.79 Gauge Reward Token
      //   Treasury should have  (v1 + v2*1/3 + v3*1/6) * 0.1 Gauge Reward Token
      //   Referral should have  (v1 + v2*1/3 + v3*1/6) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2*1/3 + v3*1/6) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v1 + v2 + v3) - (v1 + v2*1/3 + v3*1/6) = v2*2/3 + v3*5/6 Gauge Reward Token

      await time.increase(periodDuration * 2 * hour);
      await time.advanceBlock();

      vaultEarned3 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v3

      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address)

      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address)

      expect((await this.token.totalSupply()).sub(bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN).mul(HOUR)).abs()).to.lt(acceptableError)
      // expect(await this.token.balanceOf(alice.address)).to.equal(ZERO) // if there is one vault
      // (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79
      let tokenEarned1 = FOUR.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      let tokenEarned2 = FOUR.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      let tokenEarned3 = TWO.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));
      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);
      expectEqual(await this.veToken.lockedAmount(alice.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(percentageToBeLocked).div(HUN), acceptableError, true);
      let vsrTokenBalanceBefore = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);
      // expectEqual(await this.vsr.balanceOf(alice.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);
      
      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER)
      let treasuryFee = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(treasuryFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);
      let treasuryInflation = bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN).mul(HOUR).mul(treasuryInflationWeight).div(sumWeight);
      expectEqual(await this.token.balanceOf(this.treasury.address), treasuryFee/*.add(treasuryInflation)*/, acceptableError);

      expectEqual(await this.crv.balanceOf(this.treasury.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(treasuryFeeBps).div(BPS_BASE), MULTIPLIER)

      expectEqual(await this.token.balanceOf(this.referralProgram.address), (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError)
      let referalBalanceBefore = (tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);

      expectEqual(await this.crv.balanceOf(this.referralProgram.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(referralFeeBps).div(BPS_BASE), MULTIPLIER);


      expect(await this.token.balanceOf(bob.address)).to.equal(ZERO);
      expect(await this.crv.balanceOf(bob.address)).to.equal(initialCrvBalanceBob);
      expect(await this.token.balanceOf(charlie.address)).to.equal(ZERO);
      expect(await this.crv.balanceOf(charlie.address)).to.equal(initialCrvBalanceCharlie);

      expectEqual(await this.token.balanceOf(this.crvCvxCrvHiveVault.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(FIVE).div(SIX))).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);
      expectEqual(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(FIVE).div(SIX))), MULTIPLIER);

      // Bob withdraws 0.5 Staking tokens at period 23. At this point:
      //   Bob should have: (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.79 * vaultWeight = 1956.1904761905 * vaultWeight Token
      //   Treasury should have 226.67 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 474.289 * vaultWeight Token
      //   Referral should have 226.67 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.1 * vaultWeight = 474.289 * vaultWeight Token
      //   Gnosis wallet should have  22.667 + (4*2/3*400 + 2*2/6*400 + 10*2/7*400) * 0.01 * vaultWeight = 47.4289 * vaultWeight Token
      //   Staking contract should have the remaining: (1733.33 + 4000 - 2476.19) * vaultWeight = 3257.1428571429 * vaultWeight Token

      //   Bob should have: (v2*2/3 + v3*2/6 + v4*2/7) * 0.79 Gauge Reward Token
      //   Treasury should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.1 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.1 Gauge Reward Token
      //   Referral should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.1 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  ((v1 + v2*1/3 + v3*1/6) + (v2*2/3 + v3*2/6 + v4*2/7)) * 0.01 = (v1 + v2 + v3*3/6 + v4*2/7) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v2*2/3 + v3*5/6 + v4) - (v2*2/3 + v3*2/6 + v4*2/7) = v3*1/2 + v4*5/7 Gauge Reward Token


      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned4 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v4
      let tokenEarned4 = TEN.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));

      await this.crvCvxCrvHiveVault.connect(bob).withdrawAndHarvest(defaultAmount.div(TWO), bob.address);

      expectEqual(await this.token.totalSupply(), bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN.add(TEN)).mul(HOUR), acceptableError);

      expectEqual(await this.veToken.lockedAmount(bob.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(percentageToBeLocked).div(HUN), acceptableError, true);
      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);

      // expectEqual(await this.vsr.balanceOf(alice.address), vsrTokenBalanceBefore, acceptableError);

      vsrTokenBalanceBefore = (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight).add(vsrTokenBalanceBefore);

      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER, true);

      // expect(await this.token.balanceOf(alice.address)).to.equal(ZERO);

      // expectEqual(await this.vsr.balanceOf(bob.address), (tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError, true);
      expectEqual(await this.crv.balanceOf(bob.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(TWO).div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceBob), MULTIPLIER, true);

      treasuryFee = treasuryFee.add((tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(treasuryFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight));
      treasuryInflation = treasuryInflation.add(treasuryInflation);
      expectEqual(await this.token.balanceOf(this.treasury.address), treasuryFee/*.add(treasuryInflation)*/, acceptableError);

      expectEqual(await this.crv.balanceOf(this.treasury.address), (vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(treasuryFeeBps).div(BPS_BASE), MULTIPLIER);
      expectEqual(await this.token.balanceOf(this.referralProgram.address), referalBalanceBefore.add((tokenEarned2.mul(TWO).div(THREE).add(tokenEarned3.mul(TWO).div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN))).mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight)), acceptableError)
      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(TWO).div(SEVEN))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect(await this.token.balanceOf(charlie.address)).to.equal("0");
      expectEqual(await this.token.balanceOf(this.crvCvxCrvHiveVault.address), (tokenEarned3.div(TWO)).add(tokenEarned4.mul(FIVE).div(SEVEN)).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError);

      expectEqual(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address), vaultEarned3.div(TWO).add(vaultEarned4.mul(FIVE).div(SEVEN)), MULTIPLIER);

      // Alice withdraws 20 LPs at period 33.
      // Bob withdraws 15 LPs at period 43.
      // Carol withdraws 30 LPs at period 53.
      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned5 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v5
      let tokenEarned5 = TEN.mul(HOUR).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration));

      //   Alice should have: (4*400 + 4*1/3*400 + 2*1/6*400) * 0.79 + (10*2/7*400 + 10*2/6.5*400) * 0.79 * vaultWeight +  = 3665.8315018315 * vaultWeight Token
      //   Treasury should have 474.2857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 711.6483516483 * vaultWeight + 400 * 10 * treasuryWeight Token
      //   Referral should have 474.2857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.1 * vaultWeight = 711.6483516483 * vaultWeight Token
      //   Gnosis wallet should have  47.42857142857 + (10*2/7*400 + 10*2/6.5*400) * 0.01 * vaultWeight = 71.16483516483 * vaultWeight Token
      //   Staking contract should have the remaining: (3257.1428571429 + 4000 - (10*2/7*400 + 10*2/6.5*400)) * vaultWeight = 4883.5164835165 * vaultWeight Token

      //   Alice should have: (v1 + v2*1/3 + v3*1/6 + v4*2/7 + v5*2/6.5) * 0.79 +  Gauge Reward Token
      //   Treasury should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.1 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 Gauge Reward Token
      //   Referral should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.1 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2 + v3*3/6 + v4*2/7 + v4*2/7 + v5*2/6.5) * 0.01 =  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: (v3*1/2 + v4*5/7) + v5 - (v4*2/7 + v5*2/6.5) = v3*1/2 + v4*3/7 + v5*9/13   Gauge Reward Token

      await this.crvCvxCrvHiveVault.connect(alice).withdrawAndHarvest(defaultAmount.mul(TWO), alice.address);
      
      expect((await this.token.totalSupply()).sub(bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(TEN.add(TEN).add(TEN)).mul(HOUR))).to.lt(acceptableError);

      // expect((await this.vsr.balanceOf(alice.address)).sub((tokenEarned1.add(tokenEarned2.div(THREE)).add(tokenEarned3.div(SIX)).add(tokenEarned4.mul(TWO).div(SEVEN)).add(tokenEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight)).abs()).to.be.lt(acceptableError);
      // expect(await this.vsr.balanceOf(alice.address)).to.be.gt(ZERO);
      expectEqual(await this.crv.balanceOf(alice.address), (vaultEarned1.add(vaultEarned2.div(THREE)).add(vaultEarned3.div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice), MULTIPLIER, true);

      // expect(await this.token.balanceOf(alice.address)).to.equal(ZERO);

      expect((await this.crv.balanceOf(this.treasury.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(treasuryFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.treasury.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("4")).div(BigNumber.from("13")))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).sub(vaultEarned3.div(TWO).add(vaultEarned4.mul(THREE).div(SEVEN)).add(vaultEarned5.mul(NINE).div(BigNumber.from("13")))).abs()).to.lt(MULTIPLIER) //if there is one vault
      expect(await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.gt(ZERO);

      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      vaultEarned6 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address); // v6

      //   Bob should have: 1956.1904761905 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.79 * vaultWeight = 3738.7545787546 * vaultWeight Token
      //   Treasury should have 711.6483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.1 * vaultWeight + 400 * 10 * treasuryWeight = 937.2893772893 + 400 * 10 * treasuryWeight Token
      //   Referral should have 711.6483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.1 * vaultWeight = 937.2893772893 Token
      //   Gnosis wallet should have  71.16483516483 + (10*1.5/6.5*400 + 10*1.5/4.5*400) * 0.01 * vaultWeight = 93.72893772893 * vaultWeight Token
      //   Staking contract should have the remaining: (4883.5164835165 + 4000 - (10*1.5/6.5*400 + 10*1.5/4.5*400)) * vaultWeight = 6627.1062271062 * vaultWeight Token

      //   Bob should have: (v2*2/3 + v3*2/6 + v4*2/7 + v5*1.5/6.5 + v6*1.5/4.5) * 0.79 Gauge Reward Token
      //   Treasury should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.1 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.1   Gauge Reward Token
      //   Referral should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.1 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.1 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.1 Gauge Reward Token
      //   Gnosis wallet should have  (v1 + v2 + v3*1/2 + v4*4/7 + v5*2/6.5) * 0.01 + (v5*1.5/6.5 + v6*1.5/4.5) * 0.01 = (v1 + v2 + v3*1/2 + v4*4/7 + v5*3.5/6.5 + v6*1.5/4.5) * 0.01 Gauge Reward Token
      //   Staking contract should have the remaining: v3*1/2 + v4*3/7 + v5*9/13 + v6 - (v5*1.5/6.5 + v6*1.5/4.5) =  v3*1/2 + v4*3/7 + v5*6/13 + v6*2/3 Gauge Reward Token

      await this.crvCvxCrvHiveVault.connect(bob).withdrawAndHarvest(defaultAmount.mul(THREE).div(TWO), bob.address);

      expect(await this.crv.balanceOf(bob.address), (vaultEarned2.mul(TWO).div(THREE).add(vaultEarned3.mul(TWO).div(SIX)).add(vaultEarned4.mul(TWO).div(SEVEN)).add(vaultEarned5.mul(THREE).div(BigNumber.from("13"))).add(vaultEarned6.div(THREE))).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE), MULTIPLIER, true);

      // expect(await this.token.balanceOf(bob.address)).to.equal(ZERO);

      expect((await this.crv.balanceOf(this.treasury.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("7")).div(BigNumber.from("13")).add(vaultEarned6.div(THREE)))).mul(treasuryFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.treasury.address)).to.be.gt(ZERO);

      expect((await this.crv.balanceOf(this.referralProgram.address)).sub((vaultEarned1.add(vaultEarned2).add(vaultEarned3.div(TWO)).add(vaultEarned4.mul(FOUR).div(SEVEN)).add(vaultEarned5.mul(BigNumber.from("7")).div(BigNumber.from("13")).add(vaultEarned6.div(THREE)))).mul(referralFeeBps).div(BPS_BASE)).abs()).to.be.lt(MULTIPLIER);
      expect(await this.crv.balanceOf(this.referralProgram.address)).to.be.gt(ZERO);

      expect(await this.token.balanceOf(charlie.address)).to.equal("0");
      expect((await this.crv.balanceOf(this.crvCvxCrvHiveVault.address)).sub(vaultEarned3.div(TWO).add(vaultEarned4.mul(THREE).div(SEVEN)).add(vaultEarned5.mul(SIX).div(BigNumber.from("13"))).add(vaultEarned6.mul(TWO).div(THREE))).abs()).to.lt(MULTIPLIER) //if there is one vault

      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      await this.crvCvxCrvHiveVault.connect(charlie).withdrawAndHarvest(defaultAmount.mul(THREE), charlie.address);

      expectEqual(await this.crvCvxCrvLP.balanceOf(alice.address), aliceInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(alice.address), ZERO, ONE, false);
      expectEqual(await this.crvCvxCrvLP.balanceOf(bob.address), bobInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(bob.address), ZERO, ONE, false);
      expectEqual(await this.crvCvxCrvLP.balanceOf(charlie.address), charlieInitialBalance, acceptableError);
      expectEqual(await this.crvCvxCrvHiveVault.balanceOf(charlie.address), ZERO, ONE, false);
    })


    it("should return earned reward for gauge token", async() => {
      const defaultAmount = aliceInitialBalance.div(TEN);
      const initialCrvBalanceAlice = await this.crv.balanceOf(alice.address);
      const initialCrvBalanceBob = await this.crv.balanceOf(bob.address);

      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, aliceInitialBalance);
      await this.crvCvxCrvLP.connect(bob).approve(this.crvCvxCrvHiveVault.address, bobInitialBalance);

      // Alice deposits 1 LPs at period 1

      // await this.crv.connect(owner).approve(this.gauge.address, gaugeRewardTokenPerPeriod.mul(BigNumber.from("10")));
      // await this.gauge.connect(owner).notifyRewardAmount(this.crv.address, gaugeRewardTokenPerPeriod.mul(BigNumber.from("10")));
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address);
      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      // Bob deposits 1 LPs at period 11

      await this.crvCvxCrvHiveVault.connect(bob).depositFor(defaultAmount, bob.address);
      await time.increase(periodDuration * 10 * hour);
      await time.advanceBlock();

      const aliceEarned = await this.crvCvxCrvHiveVault.earned(alice.address, 1);
      const bobEarned = await this.crvCvxCrvHiveVault.earned(bob.address, 1);
      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address);
      await this.crvCvxCrvHiveVault.connect(bob).getReward(bob.address);
      await this.crvCvxCrvHiveVault.connect(owner).getReward(bob.address);
      expect((await this.crv.balanceOf(alice.address)).sub(aliceEarned.mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceAlice)).abs()).to.be.lt(MULTIPLIER);
      expect((await this.crv.balanceOf(bob.address)).sub(bobEarned.mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).add(initialCrvBalanceBob)).abs()).to.be.lt(MULTIPLIER);

    })

    it("should distribute all reward", async() => {
      const defaultAmount = aliceInitialBalance.div(TEN);

      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, aliceInitialBalance);
      await this.crvCvxCrvLP.connect(bob).approve(this.crvCvxCrvHiveVault.address, aliceInitialBalance);

      // Alice deposits 10 LPs at period 1
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address);

      // Bob deposits 10 LPs at period 27
      await time.increase(periodDuration * 30 * week);
      await time.advanceBlock();

      await this.crvCvxCrvHiveVault.connect(bob).depositFor(defaultAmount, bob.address);

      await time.increase(periodDuration * 70 * week);
      await time.advanceBlock();

      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address);
      let aliceBoost = await this.vsr.calculateBoostLevel(alice.address);


      await this.crvCvxCrvHiveVault.connect(bob).getReward(bob.address);
      let bobBoost = await this.vsr.calculateBoostLevel(bob.address);


      // Alice should have E * (30 + 70 * 0.5) 
      // Bob should have E * (70 * 0.5) 

      let aliceEarned = (TEN.mul(THREE).add(TEN.mul(THREE).add(FIVE))).mul(WEEK).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration)).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);
      let bobEarned = (TEN.mul(THREE).add(FIVE)).mul(WEEK).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration)).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);

      expectEqual(await this.veToken.lockedAmount(alice.address), aliceEarned.mul(percentageToBeLocked).div(HUN), acceptableError, true);
      expectEqual(await this.veToken.lockedAmount(bob.address), bobEarned.mul(percentageToBeLocked).div(HUN), acceptableError, true);

      expectEqual(await this.token.balanceOf(alice.address), aliceEarned.mul(HUN.sub(percentageToBeLocked)).div(HUN), acceptableError, true);
      expectEqual(await this.token.balanceOf(bob.address), bobEarned.mul(HUN.sub(percentageToBeLocked)).div(HUN), acceptableError, true);

      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO)
      expectEqual(await this.token.totalSupply(), bigTargetMinted, MULTIPLIER);


      let treasuryFee = bigTargetMinted.mul(treasuryFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight);
      let treasuryInflation = bigTargetMinted.mul(treasuryInflationWeight).div(sumWeight);

      expectEqual(await this.token.balanceOf(this.treasury.address), treasuryFee/*.add(treasuryInflation)*/, acceptableError)

      expectEqual(await this.token.balanceOf(this.referralProgram.address), bigTargetMinted.mul(referralFeeBps).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError)

      expectEqual(aliceEarned.add(bobEarned), bigTargetMinted.mul(CRVcvxCRVVaultWeight).div(sumWeight).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE), acceptableError, true);
      expect(await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.lt(acceptableError);
      expect(await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.gt(ZERO);

    })

    it("should distribute all reward if there is no stakers at some time", async() => {
      const defaultAmount = aliceInitialBalance.div(TEN);

      await time.increase(periodDuration * 2 * week);
      await time.advanceBlock();

      await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, defaultAmount);

      // Alice deposits 10 LPs at period 1
      await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address);

      await time.increase(periodDuration * 100 * week);
      await time.advanceBlock();


      await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address);

      // expectEqual(await this.vsr.balanceOf(alice.address), bigTargetMinted.mul(BigNumber.from("98")).div(BigNumber.from("100")).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError)

      // expect(await this.token.balanceOf(alice.address)).to.be.equal(ZERO);

      expectEqual(await this.token.balanceOf(alice.address), bigTargetMinted.mul(BigNumber.from("98")).div(BigNumber.from("100")).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight)/* .mul(percentageToBeLocked).div(HUN) */, acceptableError)
      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);


      expectEqual(await this.token.balanceOf(this.crvCvxCrvHiveVault.address), bigTargetMinted.mul(BigNumber.from("2")).div(BigNumber.from("100")).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError)

      await this.crvCvxCrvHiveVault.connect(owner).getReward(owner.address);

      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);
      expectEqual(await this.token.balanceOf(owner.address), bigTargetMinted.mul(BigNumber.from("2")).div(BigNumber.from("100")).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight)/* .mul(percentageToBeLocked).div(HUN) */, acceptableError)

      
      // expectEqual(await this.vsr.balanceOf(owner.address), bigTargetMinted.mul(BigNumber.from("2")).div(BigNumber.from("100")).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE).mul(CRVcvxCRVVaultWeight).div(sumWeight), acceptableError)

      expect(await this.token.balanceOf(this.vsr.address)).to.be.equal(ZERO);

      expectEqual(await this.token.totalSupply(), bigTargetMinted, acceptableError);

      expect(await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.lt(acceptableError);

    })

    it("should distribute all reward if Vault deployed not simultaneously with Inflation", async() => {
      const defaultAmount = aliceInitialBalance.div(TEN);

      await this.crvCvxCrvLP.connect(bob).approve(this.crvCvxCrvHiveVault.address, defaultAmount);

      // Bob deposits at the old vault 10 LPs at period 1
      await this.crvCvxCrvHiveVault.connect(bob).depositFor(defaultAmount, bob.address);

      await time.increase(periodDuration * 5 * week);
      await time.advanceBlock();

      const factory = await ethers.getContractFactory("ConvexVault");
      let lateVault = await factory.deploy(
        [
          this.token.address,
          this.crvCvxCrvLP.address,
          this.inflation.address,
          "Late Vault LP",
          "LVLP",
          this.referralProgram.address,
          this.booster.address,
          convexCvxCrvCrvPoolIndexLocal,
          this.crvReward.address,
          curveCrvCvxCrvPoolLocal,
          percentageToBeLocked,
          this.veToken.address
        ]
      );

      lateVault = await ethers.getContractAt('IVault', lateVault.address);

      await lateVault.setVotingStakingRewards(this.vsr.address);
    //   await this.vsr.setAddressWhoCanAutoStake(lateVault.address, true);

      await this.inflation.connect(owner).addReceiver(
        lateVault.address, 
        2500, 
        true,
        [
          2500,
          2500,
          2500
        ],
        [
          false,
          false,
          false
        ]
        ); // add new vault at 5 week and the same weight


      const distributors = [
        this.crvCvxCrvHiveVault.address,
        lateVault.address,
      ];

      await this.referralProgram.connect(owner).setFeeDistributors(distributors);

      await lateVault.addFeeReceiver(
        this.treasury.address,
        treasuryFeeBps,
        false,
        [
          this.token.address,
          this.crv.address,
          this.cvx.address
        ],
        [
          true,
          true,
          true
        ]
      );

      await lateVault.addFeeReceiver(
        this.referralProgram.address,
        referralFeeBps,
        true,
        [
          this.token.address,
          this.crv.address,
          this.cvx.address

        ],
        [
          true,
          true,
          true
        ]
      );

      await lateVault.setOnGetRewardFeesEnabled(true);
      await lateVault.addRewardToken(this.crv.address);

      await this.crvCvxCrvLP.connect(alice).approve(lateVault.address, defaultAmount);

      // Alice deposits at the new vault 10 LPs at period 6

      await lateVault.connect(alice).depositFor(defaultAmount, alice.address);

      await time.increase(periodDuration * 100 * week);
      await time.advanceBlock();

      expectEqual(await lateVault.earned(alice.address, 0), BigNumber.from('95').mul(WEEK).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration)).mul(BigNumber.from('2500')).div(BPS_BASE), acceptableError, true); // if there is only one vault
      expectEqual(await this.crvCvxCrvHiveVault.earned(bob.address, 0), bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(WEEK).mul(BigNumber.from('5').mul(CRVcvxCRVVaultWeight).add(BigNumber.from('95').mul(BigNumber.from('2500')))).div(BPS_BASE), acceptableError, true); // if there is only one vault

      await lateVault.connect(alice).getReward(alice.address);
      await this.crvCvxCrvHiveVault.connect(bob).getReward(bob.address);

      // expectEqual(await this.vsr.balanceOf(alice.address), BigNumber.from('95').mul(WEEK).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration)).mul(BigNumber.from('2500')).div(BPS_BASE).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE), acceptableError, true); // if there is only one vault
      // expectEqual(await this.vsr.balanceOf(bob.address), (BigNumber.from('95').add(FIVE.mul(TWO))).mul(WEEK).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration)).mul(BigNumber.from('2500')).div(BPS_BASE).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE), acceptableError, true); // if there is only one vault
      expectEqual(await this.token.balanceOf(alice.address), BigNumber.from('95').mul(WEEK).mul(bigTargetMinted).div(bigPeriodsCount.mul(bigPeriodDuration)).mul(BigNumber.from('2500')).div(BPS_BASE).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE), acceptableError, true);
      expectEqual(await this.token.balanceOf(bob.address), bigTargetMinted.div(bigPeriodsCount.mul(bigPeriodDuration)).mul(WEEK).mul(BigNumber.from('5').mul(CRVcvxCRVVaultWeight).add(BigNumber.from('95').mul(BigNumber.from('2500')))).div(BPS_BASE).mul(BPS_BASE.sub(totalRewardFeeBps)).div(BPS_BASE), acceptableError, true);

      expect(await this.token.balanceOf(lateVault.address)).to.be.lt(acceptableError);
      expect(await this.token.balanceOf(this.crvCvxCrvHiveVault.address)).to.be.lt(acceptableError);

    })


    it("should distribute reward if new reward token was added", async() => {
        const defaultAmount = aliceInitialBalance.div(TEN);

        const tokenFactory = await ethers.getContractFactory("MockToken");
        const newRewardToken = await tokenFactory.deploy("New Token", "NT", ethers.utils.parseEther('1000000'));

        await this.crvCvxCrvLP.connect(alice).approve(this.crvCvxCrvHiveVault.address, aliceInitialBalance);
        await this.crvCvxCrvLP.connect(bob).approve(this.crvCvxCrvHiveVault.address, bobInitialBalance);

        // Alice deposits 1 LPs at period 1

        await this.crvCvxCrvHiveVault.connect(alice).depositFor(defaultAmount, alice.address);
        await this.crvCvxCrvHiveVault.connect(bob).depositFor(defaultAmount, bob.address);

        await time.increase(periodDuration * 5 * week);
        await time.advanceBlock();

        // const v1 = await this.crvReward.earned(this.crvCvxCrvHiveVault.address);

        await this.crvCvxCrvHiveVault.connect(owner).addRewardToken(newRewardToken.address);
        expect(await this.crvCvxCrvHiveVault.rewardsCount()).to.be.equal(4);
        expect(await this.crvCvxCrvHiveVault.earned(alice.address, 3)).to.be.equal(ZERO);
        expect(await this.crvCvxCrvHiveVault.earned(bob.address, 3)).to.be.equal(ZERO);

        await time.increase(periodDuration * 5 * week);
        await time.advanceBlock();

        const totalReward = ethers.utils.parseEther('10');
        await newRewardToken.mint(this.crvCvxCrvHiveVault.address, totalReward);

        await time.increase(periodDuration * 5 * week);
        await time.advanceBlock();

        expectEqual(await this.crvCvxCrvHiveVault.earned(alice.address, 3), totalReward.div(TWO), ethers.utils.parseEther('0.0001'), true);
        expectEqual(await this.crvCvxCrvHiveVault.earned(bob.address, 3), totalReward.div(TWO), ethers.utils.parseEther('0.0001'), true);

        await this.crvCvxCrvHiveVault.connect(alice).getReward(alice.address);
        await this.crvCvxCrvHiveVault.connect(bob).getReward(bob.address);

        expectEqual(await newRewardToken.balanceOf(alice.address), totalReward.div(TWO), ethers.utils.parseEther('0.0001'), true);
        expectEqual(await newRewardToken.balanceOf(bob.address), totalReward.div(TWO), ethers.utils.parseEther('0.0001'), true);


      })

  });



});
