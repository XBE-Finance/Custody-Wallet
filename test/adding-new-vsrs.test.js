const { ethers, waffle } = require('hardhat');
const { BigNumber } = require('ethers');
const { expect } = require('chai');
const chai = require('chai');
const { time } = require('@openzeppelin/test-helpers');
const erc20Artifact = require('../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json');
const crvFactoryAbi = require('../deploy/abi/crv_factory.json')

const {
  targetMinted,
  periodsCount,
  periodDuration,
  treasuryFeeBps,
  referralFeeBps,
  gnosisWalletLocal,
  crvFactoryLocal,
  sumWeight,
  groupsOfConstructorsArgumentsForVaultsLocal,
  rewardsDurationLocal,
  percentageToBeLocked,
  crvTokenAddressMainnet,
  rewardsDurationMainnet
} = require('../deploy/helpers.js');

const { expectEqual, THO, HUN } = require('./helpers');
const {
  treasuryInflationWeight
} = require('../deploy/helpers_fantom');
const ether = require('@openzeppelin/test-helpers/src/ether');
const { TASK_EXPORT } = require('hardhat-deploy');
const { gnosisInflationWeight, CRVcvxCRVVaultWeight } = require('../deploy/helpers_ethereum');

chai.use(require('chai-bignumber')());

const MINUTE = BigNumber.from('60')
const WEEK = BigNumber.from("86400").mul(BigNumber.from("7"));
const week = 86400 * 7;
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

const BPS_BASE = BigNumber.from('10000');

const MULTIPLIER = BigNumber.from('1000000000000000000'); // 1e18

const totalRewardFeeBps = BigNumber.from(treasuryFeeBps + referralFeeBps);

const bigTargetMinted = BigNumber.from(targetMinted);
const bigPeriodsCount = BigNumber.from(periodsCount);
const acceptableError = ethers.utils.parseEther('0.000001');

let aliceInitialBalance;
let bobInitialBalance;
let charlieInitialBalance;

const gaugeRewardTokenPerPeriod = ethers.utils.parseEther("100");



describe('Adding new VSRs tests', async () => {
  const accounts = waffle.provider.getWallets();
  const owner = accounts[0];
  const alice = accounts[1];
  const bob = accounts[2];
  const charlie = accounts[3];

  beforeEach('deployment', async() => {

    await deployments.fixture(['deploy_and_add_vsrs_local']); 

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

    this.bonusCampaign = await deployments.get('BonusCampaign');
    this.bonusCampaign = await ethers.getContractAt('BonusCampaign', this.bonusCampaign.address);

    this.veToken = await deployments.get('VeToken');
    this.veToken = new ethers.Contract(this.veToken.address, this.veToken.abi, ethers.provider);

    this.crv_vsr = await deployments.get('CRV_VSR');
    this.crv_vsr = new ethers.Contract(this.crv_vsr.address, this.crv_vsr.abi, ethers.provider);

    this.cvx_vsr = await deployments.get('CVX_VSR');
    this.cvx_vsr = new ethers.Contract(this.cvx_vsr.address, this.cvx_vsr.abi, ethers.provider);

    aliceInitialBalance = await this.crvCvxCrvLP.balanceOf(alice.address);
    bobInitialBalance = await this.crvCvxCrvLP.balanceOf(bob.address);
    charlieInitialBalance = await this.crvCvxCrvLP.balanceOf(charlie.address);

    await this.token.connect(owner).mint(alice.address, ethers.utils.parseEther('1000'));
    await this.token.connect(owner).mint(bob.address, ethers.utils.parseEther('1000'));
    await this.token.connect(owner).mint(charlie.address, ethers.utils.parseEther('1000'));


  });

  describe('Adding new VSRs tests', async () => {
   

    it('should correct add new VSRs to the existing system', async() => {

      expect(await this.crv_vsr.rewardsToken()).to.be.equal(this.crv.address);
      expect(await this.crv_vsr.stakingToken()).to.be.equal(this.token.address);
      expect(await this.crv_vsr.rewardsDistribution()).to.be.equal(this.crvCvxCrvHiveVault.address);
      expect(await this.crv_vsr.rewardsDuration()).to.be.equal(rewardsDurationMainnet);
      expect(await this.crv_vsr.bonusCampaign()).to.be.equal(this.bonusCampaign.address);

      expect(await this.cvx_vsr.rewardsToken()).to.be.equal(this.cvx.address);
      expect(await this.cvx_vsr.stakingToken()).to.be.equal(this.token.address);
      expect(await this.cvx_vsr.rewardsDistribution()).to.be.equal(this.crvCvxCrvHiveVault.address);
      expect(await this.cvx_vsr.rewardsDuration()).to.be.equal(rewardsDurationMainnet);
      expect(await this.cvx_vsr.bonusCampaign()).to.be.equal(this.bonusCampaign.address);


    });

    it('should correct deposit for the reward if in the BC', async() => {
 
      const amountToDeposit = charlieInitialBalance.div(TEN); 
      await this.crvCvxCrvLP.connect(charlie).approve(this.crvCvxCrvHiveVault.address, amountToDeposit);
      await this.crvCvxCrvHiveVault.connect(charlie).depositFor(amountToDeposit, charlie.address);

      console.log("HERE0")

      const amountToLock = ethers.utils.parseEther('500');      

      await this.token.connect(alice).approve(this.veToken.address, amountToLock);
      latest = await time.latest();

      tx = await this.veToken.connect(alice).createLock(amountToLock, +latest + 100 * WEEK);
      console.log("HERE1")

      expect(await this.token.balanceOf(alice.address)).to.be.equal(ethers.utils.parseEther('500'));
      expect(await this.token.balanceOf(this.veToken.address)).to.be.equal(ethers.utils.parseEther('500'));
      const boost_crv = await this.crv_vsr.calculateBoostLevel(alice.address);
      const boost_cvx = await this.cvx_vsr.calculateBoostLevel(alice.address);
      const stake_crv = await this.crv_vsr.balanceOf(alice.address);
      const stake_cvx = await this.cvx_vsr.balanceOf(alice.address);
      expect(boost_crv).to.be.equal(ethers.utils.parseEther('2.5'));
      expect(boost_cvx).to.be.equal(ethers.utils.parseEther('2.5'));
      expect(stake_crv).to.be.equal(amountToLock.mul(boost_crv).div(MULTIPLIER));
      expect(stake_cvx).to.be.equal(amountToLock.mul(boost_cvx).div(MULTIPLIER));
      expect(await this.crv_vsr.totalSupply()).to.be.equal(amountToLock.mul(boost_crv).div(MULTIPLIER));
      expect(await this.cvx_vsr.totalSupply()).to.be.equal(amountToLock.mul(boost_cvx).div(MULTIPLIER));


      expect(await this.crv_vsr.earned(alice.address)).to.be.equal(ZERO);
      expect(await this.cvx_vsr.earned(alice.address)).to.be.equal(ZERO);

      await time.increase(time.duration.days(1));
      await time.advanceBlock();

      console.log("HERE2")

      const charlieCrvEarned = await this.crvCvxCrvHiveVault.earned(charlie.address, 1);
      const charlieCvxEarned = await this.crvCvxCrvHiveVault.earned(charlie.address, 2);
      const ownerCrvEarned = await this.crvCvxCrvHiveVault.earned(owner.address, 1);
      const ownerCvxEarned = await this.crvCvxCrvHiveVault.earned(owner.address, 2);

      console.log("owner after: ", ethers.utils.formatEther(ownerCrvEarned));
      console.log("owner after: ", ethers.utils.formatEther(ownerCvxEarned));

      console.log("totalBalance_crv before: ", ethers.utils.formatEther(await this.crv.balanceOf(this.crv_vsr.address)));
      console.log("totalBalance_cvx before: ", ethers.utils.formatEther(await this.cvx.balanceOf(this.cvx_vsr.address)));

      await this.crvCvxCrvHiveVault.connect(charlie).getReward(charlie.address);

      const totalBalance_crv = await this.crv.balanceOf(this.crv_vsr.address);
      const totalBalance_cvx = await this.cvx.balanceOf(this.cvx_vsr.address);

      expectEqual(totalBalance_crv, charlieCrvEarned.mul(BigNumber.from(treasuryFeeBps)).div(BPS_BASE), ethers.utils.parseEther('0.000001'), true);
      expectEqual(totalBalance_cvx, charlieCvxEarned.mul(BigNumber.from(treasuryFeeBps)).div(BPS_BASE), ethers.utils.parseEther('0.000001'), true);

      console.log("totalBalance_crv after: ", ethers.utils.formatEther(totalBalance_crv));
      console.log("totalBalance_cvx after: ", ethers.utils.formatEther(totalBalance_cvx));

      expect(await this.crv_vsr.earned(alice.address)).to.be.equal(ZERO);
      expect(await this.cvx_vsr.earned(alice.address)).to.be.equal(ZERO);

      await time.increase(time.duration.days(10));
      await time.advanceBlock();

      console.log("alice earned: ", ethers.utils.formatEther(await this.crv_vsr.earned(alice.address)));

      expectEqual(await this.crv_vsr.earned(alice.address), totalBalance_crv, totalBalance_crv.div(HUN), true);
      expectEqual(await this.cvx_vsr.earned(alice.address), totalBalance_cvx, totalBalance_cvx.div(HUN), true);

      const lockEnd = await this.veToken.lockedEnd(alice.address);
      const crv_balanceBefore = await this.crv.balanceOf(alice.address);
      const cvx_balanceBefore = await this.cvx.balanceOf(alice.address);
      const lockBefore = await this.veToken.lockedAmount(alice.address);
      await this.crv_vsr.connect(alice).getReward();
      await this.cvx_vsr.connect(alice).getReward();
      const crv_balanceAfter = await this.crv.balanceOf(alice.address);
      const cvx_balanceAfter = await this.cvx.balanceOf(alice.address);
      const lockAfter = await this.veToken.lockedAmount(alice.address);

      expectEqual(crv_balanceAfter.sub(crv_balanceBefore), totalBalance_crv, totalBalance_crv.div(HUN), true);
      expectEqual(cvx_balanceAfter.sub(cvx_balanceBefore), totalBalance_cvx, totalBalance_cvx.div(HUN), true);
      expect(lockAfter.sub(lockBefore)).to.be.equal(ZERO);
      expect(await this.veToken.lockedEnd(alice.address)).to.be.equal(lockEnd);

    });


  });

});
