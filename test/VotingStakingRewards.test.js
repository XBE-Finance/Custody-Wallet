const { ethers, waffle } = require('hardhat');
const { BigNumber } = require('ethers');
const { expect } = require('chai');
const chai = require('chai');
const { time } = require('@openzeppelin/test-helpers');

const {
  targetMinted,
  periodsCount,
  treasuryInflationWeight,
  percentageToBeLocked
} = require('../deploy/helpers.js');

chai.use(require('chai-bignumber')());

const WEEK = BigNumber.from("86400").mul(BigNumber.from("7"));
const day = 86400;
const week = day * 7;

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
const acceptableError = targetMinted.div(bigPeriodsCount).mul(treasuryInflationWeight).div(BPS_BASE); // 1 seconds inflation

const { expectEqual } = require('./helpers');

describe('VSR tests', async () => {
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

    this.veToken = await deployments.get('VeToken');
    this.veToken = new ethers.Contract(this.veToken.address, this.veToken.abi, ethers.provider);

    await this.token.connect(owner).mint(alice.address, ethers.utils.parseEther('100'));
    await this.token.connect(owner).mint(bob.address, ethers.utils.parseEther('100'));
    await this.token.connect(owner).mint(charlie.address, ethers.utils.parseEther('100'));

  });


  describe('VSR tests', async () => {
   

    it('should correct set initial values', async() => {
      expect(await this.vsr.rewardsToken()).to.be.equal(this.token.address);
      expect(await this.vsr.stakingToken()).to.be.equal(this.token.address);
      expect(await this.vsr.periodFinish()).to.be.equal(ZERO);
      expect(await this.vsr.rewardRate()).to.be.equal(ZERO);
      expect(await this.vsr.rewardsDuration()).to.be.equal(ethers.BigNumber.from(time.duration.days(7).toString()));
      expect(await this.vsr.lastUpdateTime()).to.be.equal(ZERO);
      expect(await this.vsr.rewardPerTokenStored()).to.be.equal(ZERO);
      expect(await this.vsr.rewardsDistribution()).to.be.equal(this.treasury.address);

    });

    it('should correct deposit for the reward if in the BC', async() => {
 
      const amountToLock = ethers.utils.parseEther('50');      

      await this.token.connect(alice).approve(this.veToken.address, amountToLock);
      latest = await time.latest();

      tx = await this.veToken.connect(alice).createLock(amountToLock, +latest + 100 * WEEK);

      expect(await this.token.balanceOf(alice.address)).to.be.equal(ethers.utils.parseEther('50'));
      expect(await this.token.balanceOf(this.veToken.address)).to.be.equal(ethers.utils.parseEther('50'));
      const boost = await this.vsr.calculateBoostLevel(alice.address);
      const stake = await this.vsr.balanceOf(alice.address);
      expect(boost).to.be.equal(ethers.utils.parseEther('2.5'));
      expect(stake).to.be.equal(amountToLock.mul(boost).div(MULTIPLIER));
      expect(await this.vsr.totalSupply()).to.be.equal(amountToLock.mul(boost).div(MULTIPLIER));

      expect(await this.vsr.earned(alice.address)).to.be.equal(ZERO);


      await time.increase(time.duration.days(1));
      await time.advanceBlock();

      await this.inflation.connect(owner)["getToken()"]();
      await this.treasury.connect(owner).toVoters(
        this.token.address,
        ZERO,
        ZERO,
        ZERO
      );

      const totalBalance = await this.token.balanceOf(this.vsr.address);

      expect(await this.vsr.earned(alice.address)).to.be.equal(ZERO);

      await time.increase(time.duration.days(10));
      await time.advanceBlock();

      expectEqual(await this.vsr.earned(alice.address), totalBalance, acceptableError, true);

      const lockEnd = await this.veToken.lockedEnd(alice.address);
      const balanceBefore = await this.token.balanceOf(alice.address);
      const lockBefore = await this.veToken.lockedAmount(alice.address);
      await this.vsr.connect(alice).getReward();
      const balanceAfter = await this.token.balanceOf(alice.address);
      const lockAfter = await this.veToken.lockedAmount(alice.address);

      expectEqual(balanceAfter.sub(balanceBefore), totalBalance.mul(HUN.sub(percentageToBeLocked)).div(HUN), acceptableError, true);
      expectEqual(lockAfter.sub(lockBefore), totalBalance.mul(percentageToBeLocked).div(HUN), acceptableError, true);
      expect(await this.veToken.lockedEnd(alice.address)).to.be.equal(lockEnd);

    });

    it('should correct deposit for the reward if not in BC', async() => {
 
      const amountToLock = ethers.utils.parseEther('50');      


      await this.token.connect(alice).approve(this.veToken.address, amountToLock);
      latest = await time.latest();

      tx = await this.veToken.connect(alice).createLock(amountToLock, +latest + 10 * WEEK);

      expect(await this.token.balanceOf(alice.address)).to.be.equal(ethers.utils.parseEther('50'));
      expect(await this.token.balanceOf(this.veToken.address)).to.be.equal(ethers.utils.parseEther('50'));
      const boost = await this.vsr.calculateBoostLevel(alice.address);
      const stake = await this.vsr.balanceOf(alice.address);

      const base = ethers.utils.parseEther('1')
      const expectedBoost = base.add(TEN.add(FIVE).mul(base).mul(amountToLock.div(TEN)).div(TEN.mul(amountToLock.add(amountToLock))));

      expectEqual(boost, expectedBoost, ethers.utils.parseEther('0.005'), true);


      expectEqual(stake, amountToLock.mul(boost).div(MULTIPLIER), acceptableError, true);

      expect(await this.vsr.totalSupply()).to.be.equal(amountToLock.mul(boost).div(MULTIPLIER));

      expect(await this.vsr.earned(alice.address)).to.be.equal(ZERO);

      await time.increase(time.duration.days(1));
      await time.advanceBlock();

      await this.inflation.connect(owner)["getToken()"]();
      await this.treasury.connect(owner).toVoters(
        this.token.address,
        ZERO,
        ZERO,
        ZERO
      );

      const totalBalance = await this.token.balanceOf(this.vsr.address);

      expect(await this.vsr.earned(alice.address)).to.be.equal(ZERO);

      await time.increase(time.duration.days(7));
      await time.advanceBlock();

      expectEqual(await this.vsr.earned(alice.address), totalBalance, acceptableError, true);

    });

    it('should correct withdraw', async() => {
 
      const amountToLock = ethers.utils.parseEther('50');      


      await this.token.connect(alice).approve(this.veToken.address, amountToLock);
      latest = await time.latest();

      tx = await this.veToken.connect(alice).createLock(amountToLock, +latest + 10 * WEEK);

      expect(await this.token.balanceOf(alice.address)).to.be.equal(ethers.utils.parseEther('50'));
      expect(await this.token.balanceOf(this.veToken.address)).to.be.equal(ethers.utils.parseEther('50'));
      const boost = await this.vsr.calculateBoostLevel(alice.address);
      const stake = await this.vsr.balanceOf(alice.address);

      const base = ethers.utils.parseEther('1')
      const expectedBoost = base.add(TEN.add(FIVE).mul(base).mul(amountToLock.div(TEN)).div(TEN.mul(amountToLock.add(amountToLock))));

      expectEqual(boost, expectedBoost, ethers.utils.parseEther('0.005'), true);

      expectEqual(stake, amountToLock.mul(boost).div(MULTIPLIER), acceptableError, true);

      expect(await this.vsr.totalSupply()).to.be.equal(amountToLock.mul(boost).div(MULTIPLIER));

      expect(await this.vsr.earned(alice.address)).to.be.equal(ZERO);

      await time.increase(time.duration.days(1));
      await time.advanceBlock();

      await this.inflation.connect(owner)["getToken()"]();
      await this.treasury.connect(owner).toVoters(
        this.token.address,
        ZERO,
        ZERO,
        ZERO
      );

      let totalBalance = await this.token.balanceOf(this.vsr.address);

      expect(await this.vsr.earned(alice.address)).to.be.equal(ZERO);

      await time.increase(time.duration.days(7));
      await time.advanceBlock();

      expectEqual(await this.vsr.earned(alice.address), totalBalance, acceptableError, true);

      await time.increase(time.duration.weeks(9));
      await time.advanceBlock();

      await this.inflation.connect(owner)["getToken()"]();
      await this.treasury.connect(owner).toVoters(
        this.token.address,
        ZERO,
        ZERO,
        ZERO
      );

      await expect(this.vsr.connect(alice).getReward()).to.be.revertedWith('withdraw the lock first');

      expect(await this.veToken['balanceOf(address)'](alice.address)).to.be.equal(ZERO);

      const aliceBalanceBefore = await this.token.balanceOf(alice.address);
      await this.veToken.connect(alice).withdraw();
      const aliceBalanceAfter = await this.token.balanceOf(alice.address);
      const veTokenBalanceAfter = await this.token.balanceOf(this.veToken.address);

      expect(await this.vsr.balanceOf(alice.address)).to.be.equal(ZERO);
      expect(await this.vsr.totalSupply()).to.be.equal(ZERO);
      expect(veTokenBalanceAfter).to.be.equal(ZERO);
      expect(await this.veToken.lockedAmount(alice.address)).to.be.equal(ZERO);
      expect(await this.veToken.lockedEnd(alice.address)).to.be.equal(ZERO);
      expect(aliceBalanceAfter.sub(aliceBalanceBefore)).to.be.equal(amountToLock);
      expect(await this.vsr.calculateBoostLevel(alice.address)).to.be.equal(ethers.utils.parseEther('1'));

      const lockBefore = await this.veToken.lockedAmount(alice.address);
      await this.vsr.connect(alice).getReward();
      latest = await time.latest();
      const aliceBalanceAfterClaim = await this.token.balanceOf(alice.address);
      const lockAfter = await this.veToken.lockedAmount(alice.address);
      
      expectEqual(aliceBalanceAfterClaim.sub(aliceBalanceAfter), totalBalance.mul(HUN.sub(percentageToBeLocked)).div(HUN), ethers.utils.parseEther('0.001'), true);
      expectEqual(lockAfter.sub(lockBefore), totalBalance.mul(percentageToBeLocked).div(HUN), ethers.utils.parseEther('0.005'), true);
      const initialPoint = await this.veToken.pointHistory(0);
      expect(await this.veToken.lockedEnd(alice.address)).to.be.equal(Math.round((+initialPoint.ts + 100 * week) / week) * week);
       
    });

    
    it('should correct calculate boost if locked all the tokens but not for the full term', async() => {
      
      const amountToLock = ethers.utils.parseEther('100');      

      await this.token.connect(alice).approve(this.veToken.address, amountToLock);
      latest = await time.latest();

      tx = await this.veToken.connect(alice).createLock(amountToLock, +latest + 10 * WEEK);

      expect(await this.token.balanceOf(alice.address)).to.be.equal(ZERO);
      expect(await this.token.balanceOf(this.veToken.address)).to.be.equal(ethers.utils.parseEther('100'));
      let boost = await this.vsr.calculateBoostLevel(alice.address);
      const stake = await this.vsr.balanceOf(alice.address);

      expectEqual(boost, ethers.utils.parseEther('1.15'), ethers.utils.parseEther('0.005'), true);

      expectEqual(stake, amountToLock.mul(boost).div(MULTIPLIER), acceptableError, true);

      await time.increase(time.duration.weeks(5));
      await time.advanceBlock();

      boost = await this.vsr.calculateBoostLevel(alice.address);
      expectEqual(boost, ethers.utils.parseEther('1.075'), ethers.utils.parseEther('0.005'), true);

      await time.increase(time.duration.weeks(5));
      await time.advanceBlock();

      boost = await this.vsr.calculateBoostLevel(alice.address);
      expectEqual(boost, ethers.utils.parseEther('1'), ethers.utils.parseEther('0.005'), true);

    });


    it('should correct distribute reward', async() => {
      
      const amountToLock = ethers.utils.parseEther('50');      

      await this.token.connect(alice).approve(this.veToken.address, amountToLock);
      await this.token.connect(bob).approve(this.veToken.address, amountToLock);
      await this.token.connect(charlie).approve(this.veToken.address, amountToLock);

      const base = ethers.utils.parseEther('1');

      await time.increase(time.duration.weeks(1));
      await time.advanceBlock();

      await this.inflation.connect(owner)["getToken()"]();
      await this.treasury.connect(owner).toVoters(
        this.token.address,
        ZERO,
        ZERO,
        ZERO
      );

      const totalBalance = await this.token.balanceOf(this.vsr.address);

      let latest = await time.latest();

      await this.veToken.connect(alice).createLock(amountToLock, +latest + 10 * WEEK);
      let aliceBoost = await this.vsr.calculateBoostLevel(alice.address);
      let aliceExpectedBoost = base.add(TEN.add(FIVE).mul(base).div(TEN).div(TEN.mul(TWO)));
      let aliceExpectedStake = aliceBoost.mul(amountToLock).div(base);

      expectEqual(aliceBoost, aliceExpectedBoost, ethers.utils.parseEther('0.005'), true);
      expectEqual(await this.vsr.balanceOf(alice.address), aliceExpectedStake, ethers.utils.parseEther('0.006'), true);

      await time.increase(time.duration.days(1));

      await this.veToken.connect(bob).createLock(amountToLock, +latest + 20 * WEEK);

      let bobBoost = await this.vsr.calculateBoostLevel(bob.address);
      let bobExpectedBoost = base.add(TEN.add(FIVE).mul(base).mul(TWO).div(TEN).div(TEN.mul(TWO)));
      let bobExpectedStake = bobBoost.mul(amountToLock).div(base);

      expectEqual(bobBoost, bobExpectedBoost, ethers.utils.parseEther('0.006'), true);
      expectEqual(await this.vsr.balanceOf(bob.address), bobExpectedStake, ethers.utils.parseEther('0.006'), true);


      await time.increase(time.duration.days(1));

      await this.veToken.connect(charlie).createLock(amountToLock, +latest + 30 * WEEK);

      let charlieBoost = await this.vsr.calculateBoostLevel(charlie.address);
      let charlieExpectedBoost = base.add(TEN.add(FIVE).mul(base).mul(THREE).div(TEN).div(TEN.mul(TWO)));
      let charlieExpectedStake = charlieBoost.mul(amountToLock).div(base);

      expectEqual(charlieBoost, charlieExpectedBoost, ethers.utils.parseEther('0.008'), true);
      expectEqual(await this.vsr.balanceOf(charlie.address), charlieExpectedStake, ethers.utils.parseEther('0.005'), true);

      expectEqual(await this.vsr.totalSupply(), aliceExpectedStake.add(bobExpectedStake).add(charlieExpectedStake), ethers.utils.parseEther('0.005'), true);

      await time.increase(time.duration.days(1));
      await time.advanceBlock();

      const rewardPerDay = totalBalance.div(SEVEN);

      let aliceEarned = await this.vsr.earned(alice.address);

      let aliceExpectedEarned = rewardPerDay.
        add(rewardPerDay.mul(aliceExpectedStake).div(aliceExpectedStake.add(bobExpectedStake))).
        add(rewardPerDay.mul(aliceExpectedStake).div(aliceExpectedStake.add(bobExpectedStake).add(charlieExpectedStake)));
      
      expectEqual(aliceEarned, aliceExpectedEarned, ethers.utils.parseEther('0.001'), true);


      let bobEarned = await this.vsr.earned(bob.address);
      let bobExpectedEarned = rewardPerDay.mul(bobExpectedStake).div(aliceExpectedStake.add(bobExpectedStake)).
        add(rewardPerDay.mul(bobExpectedStake).div(aliceExpectedStake.add(bobExpectedStake).add(charlieExpectedStake)));
      expectEqual(bobEarned, bobExpectedEarned, ethers.utils.parseEther('0.001'), true);

      let charlieEarned = await this.vsr.earned(charlie.address);
      let charlieExpectedEarned = rewardPerDay.mul(charlieExpectedStake).div(aliceExpectedStake.add(bobExpectedStake).add(charlieExpectedStake));
      expectEqual(charlieEarned, charlieExpectedEarned, ethers.utils.parseEther('0.001'), true);

      await time.increase(time.duration.days(1));
      await time.advanceBlock();

      await this.token.connect(alice).approve(this.veToken.address, amountToLock);

      await this.veToken.connect(alice).increaseAmount(amountToLock);

      const aliceVeBalance = await this.veToken['balanceOf(address)'](alice.address);
      let aliceBoost2 = await this.vsr.calculateBoostLevel(alice.address);

      let aliceExpectedStake2 = aliceBoost.mul(amountToLock).div(base).
        add(aliceBoost2.mul(amountToLock).div(base));
      
      await time.increase(time.duration.days(3));
      await time.advanceBlock();

      
      for (let i = 0; i < 20; i++) {
        await this.inflation.connect(owner)["getToken()"]();
        await this.treasury.connect(owner).toVoters(
          this.token.address,
          ZERO,
          ZERO,
          ZERO
        );
        await time.increase(time.duration.weeks(1));
        await time.advanceBlock();
      }

      await this.veToken.connect(bob).withdraw();

      

      expect(await this.vsr.balanceOf(bob.address)).to.be.equal(ZERO);
      expect(await this.token.balanceOf(bob.address)).to.be.equal(ethers.utils.parseEther('100'));
      expectEqual(await this.vsr.totalSupply(), aliceExpectedStake2.add(charlieExpectedStake), ethers.utils.parseEther('0.0001'), true);

      /// BOBs ans ALICEs boosts are x1 now
      expect(await this.vsr.calculateBoostLevel(bob.address)).to.be.equal(ethers.utils.parseEther('1'));
      expect(await this.vsr.calculateBoostLevel(alice.address)).to.be.equal(ethers.utils.parseEther('1'));
      // 30 weeks = 30 * 7 = 210
      // 21 weeks = 21 * 7 = 147
      expectEqual(await this.vsr.calculateBoostLevel(charlie.address), base.add(charlieExpectedBoost.sub(base).mul(BigNumber.from('63')).div(BigNumber.from('210'))), ethers.utils.parseEther('0.004'), true);

      let aliceEarned2 = await this.vsr.earned(alice.address);
      let bobEarned2 = await this.vsr.earned(bob.address);
      let charlieEarned2 = await this.vsr.earned(charlie.address);

      let aliceExpectedEarned2 = aliceExpectedEarned.
        add(rewardPerDay.mul(aliceExpectedStake).div(aliceExpectedStake.add(bobExpectedStake).add(charlieExpectedStake))).
        add(rewardPerDay.mul(BigNumber.from('143')).mul(aliceExpectedStake2).div(aliceExpectedStake2.add(bobExpectedStake).add(charlieExpectedStake)))
      expectEqual(aliceEarned2, aliceExpectedEarned2, ethers.utils.parseEther('0.1'), true);


      let bobExpectedEarned2 = bobExpectedEarned.
        add(rewardPerDay.mul(bobExpectedStake).div(aliceExpectedStake.add(bobExpectedStake).add(charlieExpectedStake))).
        add(rewardPerDay.mul(BigNumber.from('143')).mul(bobExpectedStake).div(aliceExpectedStake2.add(bobExpectedStake).add(charlieExpectedStake)))
      expectEqual(bobEarned2, bobExpectedEarned2, ethers.utils.parseEther('0.1'), true);



      let charlieExpectedEarned2 = charlieExpectedEarned.
        add(rewardPerDay.mul(charlieExpectedStake).div(aliceExpectedStake.add(bobExpectedStake).add(charlieExpectedStake))).
        add(rewardPerDay.mul(BigNumber.from('143')).mul(charlieExpectedStake).div(aliceExpectedStake2.add(bobExpectedStake).add(charlieExpectedStake)))
      expectEqual(charlieEarned2, charlieExpectedEarned2, ethers.utils.parseEther('0.1'), true);

      

      await this.inflation.connect(owner)["getToken()"]();
        await this.treasury.connect(owner).toVoters(
          this.token.address,
          ZERO,
          ZERO,
          ZERO
        );
        await time.increase(time.duration.weeks(1));
        await time.advanceBlock();


        let aliceEarned3 = await this.vsr.earned(alice.address);
        let bobEarned3 = await this.vsr.earned(bob.address);
        let charlieEarned3 = await this.vsr.earned(charlie.address);
  

        let aliceExpectedEarned3 = aliceExpectedEarned2.
          add(rewardPerDay.mul(SEVEN).mul(aliceExpectedStake2).div(aliceExpectedStake2.add(charlieExpectedStake)))
        expectEqual(aliceEarned3, aliceExpectedEarned3, ethers.utils.parseEther('0.1'), true);

        expectEqual(bobEarned3, bobEarned2, ethers.utils.parseEther('0.1'), true);

        let charlieExpectedEarned3 = charlieExpectedEarned2.
          add(rewardPerDay.mul(SEVEN).mul(charlieExpectedStake).div(aliceExpectedStake2.add(charlieExpectedStake)))
        expectEqual(charlieEarned3, charlieExpectedEarned3, ethers.utils.parseEther('0.1'), true);

        const aliceBalanceBefore = await this.token.balanceOf(alice.address);
        const bobBalanceBefore = await this.token.balanceOf(bob.address);

        await this.veToken.connect(alice).withdraw();
        await this.vsr.connect(alice).getReward();

        await this.vsr.connect(bob).getReward();

        await this.vsr.connect(charlie).getReward();
        const aliceBalanceAfter = await this.token.balanceOf(alice.address);
        const bobBalanceAfter = await this.token.balanceOf(bob.address);

        expectEqual(aliceBalanceAfter.sub(aliceBalanceBefore), ethers.utils.parseEther('100').add(aliceExpectedEarned3.mul(HUN.sub(percentageToBeLocked)).div(HUN)), ethers.utils.parseEther('0.02'), true);
        expectEqual(await this.veToken.lockedAmount(alice.address), aliceExpectedEarned3.mul(percentageToBeLocked).div(HUN), ethers.utils.parseEther('0.1'), true);
        expectEqual(bobBalanceAfter.sub(bobBalanceBefore), bobEarned3.mul(HUN.sub(percentageToBeLocked)).div(HUN), ethers.utils.parseEther('0.1'), true);
        expectEqual(await this.veToken.lockedAmount(bob.address), bobEarned3.mul(percentageToBeLocked).div(HUN), ethers.utils.parseEther('0.1'), true);
    
    });


    it('should correct distribute all the reward', async() => {
 
      const amountToLock = ethers.utils.parseEther('50');      

      await this.token.connect(alice).approve(this.veToken.address, amountToLock);
      await this.token.connect(bob).approve(this.veToken.address, amountToLock);
      latest = await time.latest();

      const base = ethers.utils.parseEther('1');

      await this.veToken.connect(alice).createLock(amountToLock, +latest + 100 * WEEK);
      const aliceBoost = await this.vsr.calculateBoostLevel(alice.address);
      const aliceStake = await this.vsr.balanceOf(alice.address);
      const aliceExpectedBoost = base.add(TEN.add(FIVE).mul(base).mul(amountToLock).div(TEN.mul(amountToLock.add(amountToLock))));

      const premium = ethers.utils.parseEther('100');
      await this.token.connect(owner).mint(this.vsr.address, premium);
      await this.vsr.connect(owner).notifyRewardAmount(premium);

      for (let i = 0; i < 50; i++) {
        await this.inflation.connect(owner)["getToken()"]();
        await this.treasury.connect(owner).toVoters(
          this.token.address,
          ZERO,
          ZERO,
          ZERO
        );
        await time.increase(time.duration.weeks(1));
        await time.advanceBlock();
      }
      latest = await time.latest();

      await this.veToken.connect(bob).createLock(amountToLock, +latest + 50 * WEEK);
      const bobStake = await this.vsr.balanceOf(bob.address);
      
      for (let i = 0; i < 50; i++) {
        await this.inflation.connect(owner)["getToken()"]();
        await this.treasury.connect(owner).toVoters(
          this.token.address,
          ZERO,
          ZERO,
          ZERO
        );
        await time.increase(time.duration.weeks(1));
        await time.advanceBlock();
      }

      await this.inflation.connect(owner)["getToken()"]();
        await this.treasury.connect(owner).toVoters(
          this.token.address,
          ZERO,
          ZERO,
          ZERO
        );
      await time.increase(time.duration.weeks(1));
      await time.advanceBlock();

      const aliceEarned = await this.vsr.earned(alice.address);
      const bobEarned = await this.vsr.earned(bob.address);

      const aliceExpectedEarned = premium.add(bigTargetMinted.mul(treasuryInflationWeight).div(TWO).div(BPS_BASE)).add(bigTargetMinted.mul(treasuryInflationWeight).div(TWO).div(BPS_BASE).mul(aliceStake).div(aliceStake.add(bobStake)));
      const bobExpectedEarned = bigTargetMinted.mul(treasuryInflationWeight).div(TWO).div(BPS_BASE).mul(bobStake).div(aliceStake.add(bobStake));

      expectEqual(aliceEarned, aliceExpectedEarned, ethers.utils.parseEther('30'), true);
      expectEqual(bobEarned, bobExpectedEarned, ethers.utils.parseEther('30'), true);
      expectEqual(bobEarned.add(aliceEarned), premium.add(bigTargetMinted.mul(treasuryInflationWeight).div(BPS_BASE)), ethers.utils.parseEther('0.01'), true);

      const aliceBalanceBefore = await this.token.balanceOf(alice.address);
      const bobBalanceBefore = await this.token.balanceOf(bob.address);

      await this.veToken.connect(alice).withdraw();
      await this.vsr.connect(alice).getReward();

      await this.veToken.connect(bob).withdraw();
      await this.vsr.connect(bob).getReward();

      const aliceBalanceAfter = await this.token.balanceOf(alice.address);
      const bobBalanceAfter = await this.token.balanceOf(bob.address);

      expectEqual(aliceBalanceAfter.sub(aliceBalanceBefore), aliceEarned.add(ethers.utils.parseEther('50')), ethers.utils.parseEther('0.001'), true);
      expectEqual(bobBalanceAfter.sub(bobBalanceBefore), bobEarned.add(ethers.utils.parseEther('50')), ethers.utils.parseEther('0.001'), true);
      expectEqual(await this.token.balanceOf(this.vsr.address), ZERO, ethers.utils.parseEther('0.001'), false);
      expectEqual(await this.veToken.lockedAmount(alice.address), ZERO, ethers.utils.parseEther('0.001'), false);
      expectEqual(await this.veToken.lockedAmount(bob.address), ZERO, ethers.utils.parseEther('0.001'), false);
      expectEqual(await this.veToken.lockedEnd(alice.address), ZERO, ethers.utils.parseEther('0.001'), false);
      expectEqual(await this.veToken.lockedEnd(bob.address), ZERO, ethers.utils.parseEther('0.001'), false);


    });


  });

});
