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
const ether = require('@openzeppelin/test-helpers/src/ether.js');

describe('ReferralProgram tests', async () => {
  const accounts = waffle.provider.getWallets();
  const owner = accounts[0];
  const alice = accounts[1];
  const referrer1 = accounts[2];
  const referrer2 = accounts[3];
  const referrer3 = accounts[4];
  const referrer4 = accounts[5];
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

  });


  describe('ReferralProgram tests', async () => {
   

    it('should correct set initial values', async() => {
      expect(await this.referralProgram.rootAddress()).to.be.equal(this.treasury.address);
      expect(await this.referralProgram.percentageToBeLocked()).to.be.equal(percentageToBeLocked);
      expect(await this.referralProgram.veToken()).to.be.equal(this.veToken.address);
      expect(await this.referralProgram.votingStakingRewards()).to.be.equal(this.vsr.address);
      const user = await this.referralProgram.users(this.treasury.address);
      expect(user.exists).to.be.true;
      expect(user.referrer).to.be.equal(this.treasury.address);
    });

    it('should correct distribute reward for 3 referrer tiers', async() => {
      await this.referralProgram.connect(owner).setFeeDistributors([owner.address]);

      await this.referralProgram.connect(referrer1)['registerUser(address)'](this.treasury.address);
      await this.referralProgram.connect(referrer2)['registerUser(address)'](referrer1.address);
      await this.referralProgram.connect(referrer3)['registerUser(address)'](referrer2.address);
      await this.referralProgram.connect(referrer4)['registerUser(address)'](referrer3.address);
      await this.referralProgram.connect(alice)['registerUser(address)'](referrer4.address);

      const rewardAmount = ethers.utils.parseEther('100');
      await this.token.connect(owner).mint(this.referralProgram.address, rewardAmount);
      await this.referralProgram.connect(owner).feeReceiving(alice.address, this.token.address, rewardAmount);

      const referrer2ExpectedReward = rewardAmount.div(TEN);
      const referrer3ExpectedReward = rewardAmount.mul(BigNumber.from('20')).div(HUN);
      const referrer4ExpectedReward = rewardAmount.mul(BigNumber.from('70')).div(HUN);

      expect(await this.referralProgram.rewards(referrer1.address, this.token.address)).to.be.equal(ZERO);
      expect(await this.referralProgram.rewards(referrer2.address, this.token.address)).to.be.equal(referrer2ExpectedReward);
      expect(await this.referralProgram.rewards(referrer3.address, this.token.address)).to.be.equal(referrer3ExpectedReward);
      expect(await this.referralProgram.rewards(referrer4.address, this.token.address)).to.be.equal(referrer4ExpectedReward);
      expect(await this.referralProgram.rewards(alice.address, this.token.address)).to.be.equal(ZERO);

      await this.referralProgram.connect(referrer2).claimRewards();
      await this.referralProgram.connect(referrer3).claimRewards();
      await this.referralProgram.connect(referrer4).claimRewards();

      expect(await this.veToken.lockedAmount(referrer2.address)).to.be.equal(referrer2ExpectedReward.mul(percentageToBeLocked).div(HUN));
      expect(await this.veToken.lockedAmount(referrer3.address)).to.be.equal(referrer3ExpectedReward.mul(percentageToBeLocked).div(HUN));
      expect(await this.veToken.lockedAmount(referrer4.address)).to.be.equal(referrer4ExpectedReward.mul(percentageToBeLocked).div(HUN));

      expect(await this.token.balanceOf(referrer2.address)).to.be.equal(referrer2ExpectedReward.mul(HUN.sub(percentageToBeLocked)).div(HUN));
      expect(await this.token.balanceOf(referrer3.address)).to.be.equal(referrer3ExpectedReward.mul(HUN.sub(percentageToBeLocked)).div(HUN));
      expect(await this.token.balanceOf(referrer4.address)).to.be.equal(referrer4ExpectedReward.mul(HUN.sub(percentageToBeLocked)).div(HUN));


    });


    it('should correct distribute reward in other token', async() => {
      await this.referralProgram.connect(owner).setFeeDistributors([owner.address]);
      const ERC20 = await ethers.getContractFactory('MockToken');
      const mockErc20 = await ERC20.deploy("Mock ERC20", "MERC20", ethers.utils.parseEther('100'));
      await this.referralProgram.connect(owner).setRewardTokens([this.token.address, mockErc20.address]);

      await this.referralProgram.connect(referrer1)['registerUser(address)'](this.treasury.address);
      await this.referralProgram.connect(referrer2)['registerUser(address)'](referrer1.address);
      await this.referralProgram.connect(referrer3)['registerUser(address)'](referrer2.address);
      await this.referralProgram.connect(referrer4)['registerUser(address)'](referrer3.address);
      await this.referralProgram.connect(alice)['registerUser(address)'](referrer4.address);

      const rewardAmount = ethers.utils.parseEther('100');
      await mockErc20.connect(owner).transfer(this.referralProgram.address, rewardAmount);
      await this.referralProgram.connect(owner).feeReceiving(alice.address, mockErc20.address, rewardAmount);

      const referrer2ExpectedReward = rewardAmount.div(TEN);
      const referrer3ExpectedReward = rewardAmount.mul(BigNumber.from('20')).div(HUN);
      const referrer4ExpectedReward = rewardAmount.mul(BigNumber.from('70')).div(HUN);

      expect(await this.referralProgram.rewards(referrer1.address, mockErc20.address)).to.be.equal(ZERO);
      expect(await this.referralProgram.rewards(referrer2.address, mockErc20.address)).to.be.equal(referrer2ExpectedReward);
      expect(await this.referralProgram.rewards(referrer3.address, mockErc20.address)).to.be.equal(referrer3ExpectedReward);
      expect(await this.referralProgram.rewards(referrer4.address, mockErc20.address)).to.be.equal(referrer4ExpectedReward);
      expect(await this.referralProgram.rewards(alice.address, mockErc20.address)).to.be.equal(ZERO);

      await this.referralProgram.connect(referrer2).claimRewards();
      await this.referralProgram.connect(referrer3).claimRewards();
      await this.referralProgram.connect(referrer4).claimRewards();

      expect(await mockErc20.balanceOf(referrer2.address)).to.be.equal(referrer2ExpectedReward);
      expect(await mockErc20.balanceOf(referrer3.address)).to.be.equal(referrer3ExpectedReward);
      expect(await mockErc20.balanceOf(referrer4.address)).to.be.equal(referrer4ExpectedReward);


    });

    it('should correct distribute reward between 100 and 101 week', async() => {
      await this.referralProgram.connect(owner).setFeeDistributors([owner.address]);

      await this.referralProgram.connect(referrer1)['registerUser(address)'](this.treasury.address);
      await this.referralProgram.connect(referrer2)['registerUser(address)'](referrer1.address);
      await this.referralProgram.connect(referrer3)['registerUser(address)'](referrer2.address);
      await this.referralProgram.connect(referrer4)['registerUser(address)'](referrer3.address);
      await this.referralProgram.connect(alice)['registerUser(address)'](referrer4.address);

      const rewardAmount = ethers.utils.parseEther('100');

      await time.increase(time.duration.weeks(100));
      await time.advanceBlock();

      await this.token.connect(owner).mint(this.referralProgram.address, rewardAmount);
      await this.referralProgram.connect(owner).feeReceiving(alice.address, this.token.address, rewardAmount);

      const referrer2ExpectedReward = rewardAmount.div(TEN);
      const referrer3ExpectedReward = rewardAmount.mul(BigNumber.from('20')).div(HUN);
      const referrer4ExpectedReward = rewardAmount.mul(BigNumber.from('70')).div(HUN);

      expect(await this.referralProgram.rewards(referrer1.address, this.token.address)).to.be.equal(ZERO);
      expect(await this.referralProgram.rewards(referrer2.address, this.token.address)).to.be.equal(referrer2ExpectedReward);
      expect(await this.referralProgram.rewards(referrer3.address, this.token.address)).to.be.equal(referrer3ExpectedReward);
      expect(await this.referralProgram.rewards(referrer4.address, this.token.address)).to.be.equal(referrer4ExpectedReward);
      expect(await this.referralProgram.rewards(alice.address, this.token.address)).to.be.equal(ZERO);

      await this.referralProgram.connect(referrer2).claimRewards();
      await this.referralProgram.connect(referrer3).claimRewards();
      await this.referralProgram.connect(referrer4).claimRewards();

      expect(await this.veToken.lockedAmount(referrer2.address)).to.be.equal(referrer2ExpectedReward.mul(percentageToBeLocked).div(HUN));
      expect(await this.veToken.lockedAmount(referrer3.address)).to.be.equal(referrer3ExpectedReward.mul(percentageToBeLocked).div(HUN));
      expect(await this.veToken.lockedAmount(referrer4.address)).to.be.equal(referrer4ExpectedReward.mul(percentageToBeLocked).div(HUN));

      expect(await this.token.balanceOf(referrer2.address)).to.be.equal(referrer2ExpectedReward.mul(HUN.sub(percentageToBeLocked)).div(HUN));
      expect(await this.token.balanceOf(referrer3.address)).to.be.equal(referrer3ExpectedReward.mul(HUN.sub(percentageToBeLocked)).div(HUN));
      expect(await this.token.balanceOf(referrer4.address)).to.be.equal(referrer4ExpectedReward.mul(HUN.sub(percentageToBeLocked)).div(HUN));
    });

    it('should correct distribute reward after distribution program', async() => {
      await this.referralProgram.connect(owner).setFeeDistributors([owner.address]);

      await this.referralProgram.connect(referrer1)['registerUser(address)'](this.treasury.address);
      await this.referralProgram.connect(referrer2)['registerUser(address)'](referrer1.address);
      await this.referralProgram.connect(referrer3)['registerUser(address)'](referrer2.address);
      await this.referralProgram.connect(referrer4)['registerUser(address)'](referrer3.address);
      await this.referralProgram.connect(alice)['registerUser(address)'](referrer4.address);

      const rewardAmount = ethers.utils.parseEther('100');

      await time.increase(time.duration.weeks(101));
      await time.advanceBlock();

      await this.token.connect(owner).mint(this.referralProgram.address, rewardAmount);
      await this.referralProgram.connect(owner).feeReceiving(alice.address, this.token.address, rewardAmount);

      const referrer2ExpectedReward = rewardAmount.div(TEN);
      const referrer3ExpectedReward = rewardAmount.mul(BigNumber.from('20')).div(HUN);
      const referrer4ExpectedReward = rewardAmount.mul(BigNumber.from('70')).div(HUN);

      expect(await this.referralProgram.rewards(referrer1.address, this.token.address)).to.be.equal(ZERO);
      expect(await this.referralProgram.rewards(referrer2.address, this.token.address)).to.be.equal(referrer2ExpectedReward);
      expect(await this.referralProgram.rewards(referrer3.address, this.token.address)).to.be.equal(referrer3ExpectedReward);
      expect(await this.referralProgram.rewards(referrer4.address, this.token.address)).to.be.equal(referrer4ExpectedReward);
      expect(await this.referralProgram.rewards(alice.address, this.token.address)).to.be.equal(ZERO);

      await this.referralProgram.connect(referrer2).claimRewards();
      await this.referralProgram.connect(referrer3).claimRewards();
      await this.referralProgram.connect(referrer4).claimRewards();

      expect(await this.token.balanceOf(referrer2.address)).to.be.equal(referrer2ExpectedReward);
      expect(await this.token.balanceOf(referrer3.address)).to.be.equal(referrer3ExpectedReward);
      expect(await this.token.balanceOf(referrer4.address)).to.be.equal(referrer4ExpectedReward);
    });

    
    it('should correct distribute reward if somebody has an expired lock', async() => {
      await this.referralProgram.connect(owner).setFeeDistributors([owner.address]);

      await this.referralProgram.connect(referrer1)['registerUser(address)'](this.treasury.address);
      await this.referralProgram.connect(referrer2)['registerUser(address)'](referrer1.address);
      await this.referralProgram.connect(referrer3)['registerUser(address)'](referrer2.address);
      await this.referralProgram.connect(referrer4)['registerUser(address)'](referrer3.address);
      await this.referralProgram.connect(alice)['registerUser(address)'](referrer4.address);

      const rewardAmount = ethers.utils.parseEther('100');
      await this.token.connect(owner).mint(this.referralProgram.address, rewardAmount);
      await this.token.connect(owner).mint(referrer2.address, rewardAmount);

      await this.token.connect(referrer2).approve(this.veToken.address, rewardAmount);
      const latest = await time.latest();
      await this.veToken.connect(referrer2).createLock(rewardAmount, +latest.toString() + 10 * week);

      const lockedEnd = await this.veToken.lockedEnd(referrer2.address);
      await this.referralProgram.connect(owner).feeReceiving(alice.address, this.token.address, rewardAmount);

      const referrer2ExpectedReward = rewardAmount.div(TEN);

      await this.referralProgram.connect(referrer2).claimRewards();

      expect(await this.veToken.lockedAmount(referrer2.address)).to.be.equal(rewardAmount.add(referrer2ExpectedReward.mul(percentageToBeLocked).div(HUN)));
      expect(await this.veToken.lockedEnd(referrer2.address)).to.be.equal(lockedEnd);



    });
    
    

  });

});
