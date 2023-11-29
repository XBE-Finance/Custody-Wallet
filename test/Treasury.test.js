const { ethers, waffle } = require('hardhat');
const { BigNumber } = require('ethers');
const { expect } = require('chai');
const chai = require('chai');
const { time } = require('@openzeppelin/test-helpers');
const routerAbi = require('../deploy/abi/routerAbi.json');

const {
  uniswapRouterAddressLocal
} = require('../deploy/helpers.js');

chai.use(require('chai-bignumber')());

const MINUTE = BigNumber.from('60')
const WEEK = BigNumber.from("86400").mul(BigNumber.from("7"));
const day = 86400;
const DAY = BigNumber.from("86400");
const week = day * 7;
const hour = 3600;
const HOUR = BigNumber.from("3600");


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


describe('Treasury tests', async () => {
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

    this.crv = await deployments.get('CRV');
    this.crv = await ethers.getContractAt(this.crv.abi, this.crv.address);

    this.cvx = await deployments.get('CVX');
    this.cvx = await ethers.getContractAt(this.cvx.abi, this.cvx.address);


    await this.token.connect(owner).mint(alice.address, ethers.utils.parseEther('100'));
    await this.token.connect(owner).mint(bob.address, ethers.utils.parseEther('100'));
  });

  describe('tests', async () => {
   

    it('should correct set initial values', async() => {
      expect(await this.treasury.uniswapRouter()).to.be.equal(uniswapRouterAddressLocal);
      expect(await this.treasury.rewardsDistributionRecipientContract()).to.be.equal(this.vsr.address);
      expect(await this.treasury.rewardToken()).to.be.equal(this.token.address);
      expect(await this.treasury.authorized(owner.address)).to.be.true;
      expect(await this.treasury.tokensToConvertCount()).to.be.equal(TWO);
      expect(await this.treasury.tokensToConvertAt(0)).to.be.equal(this.crv.address);
      expect(await this.treasury.tokensToConvertAt(1)).to.be.equal(this.cvx.address);
      expect(await this.treasury.isTokenAllowedToConvert(this.cvx.address)).to.be.true;
      expect(await this.treasury.isTokenAllowedToConvert(this.crv.address)).to.be.true;

    });

    it('should correct add and remove reward token', async() => {
      
      const MockToken = await ethers.getContractFactory('MockToken');
      const newRewardToken = await MockToken.deploy("Mock Token", "MT", ethers.utils.parseEther('1000000'));
      
      expect(await this.treasury.isTokenAllowedToConvert(newRewardToken.address)).to.be.false;
      await this.treasury.connect(owner).addTokenToConvert(newRewardToken.address);
      await expect(this.treasury.connect(owner).addTokenToConvert(newRewardToken.address)).to.be.revertedWith("alreadyExists")
      expect(await this.treasury.isTokenAllowedToConvert(newRewardToken.address)).to.be.true;
      expect(await this.treasury.tokensToConvertCount()).to.be.equal(THREE);
      expect(await this.treasury.tokensToConvertAt(2)).to.be.equal(newRewardToken.address);
      await this.treasury.connect(owner).removeTokenToConvert(newRewardToken.address);
      await expect(this.treasury.connect(owner).removeTokenToConvert(newRewardToken.address)).to.be.revertedWith("doesntExist")
      expect(await this.treasury.tokensToConvertCount()).to.be.equal(TWO);
      expect(await this.treasury.isTokenAllowedToConvert(newRewardToken.address)).to.be.false;

    });

    it('should correct convert token', async() => {
      const MockToken = await ethers.getContractFactory('MockToken');
      const newRewardToken = await MockToken.deploy("Mock Token", "MT", ethers.utils.parseEther('1000000'));
      await this.treasury.connect(owner).addTokenToConvert(newRewardToken.address);

      await this.token.connect(owner).mint(owner.address, ethers.utils.parseEther('100'));
      this.router = await ethers.getContractAt(routerAbi, uniswapRouterAddressLocal);

      await newRewardToken.connect(owner).approve(this.router.address, ethers.utils.parseEther('50'));
      await this.token.connect(owner).approve(this.router.address, ethers.utils.parseEther('50'));

      const latest = await time.latest();

      await this.router.addLiquidityETH(
        newRewardToken.address,
        ethers.utils.parseEther('50'),
        0,
        0,
        owner.address,
        +latest.toString() + 3600,
        {value: ethers.utils.parseEther('1')}
      ); 

      await this.router.addLiquidityETH(
        this.token.address,
        ethers.utils.parseEther('50'),
        0,
        0,
        owner.address,
        +latest.toString() + 3600,
        {value: ethers.utils.parseEther('1')}
      );

      await newRewardToken.connect(owner).transfer(this.treasury.address, ethers.utils.parseEther('50'));

      const vsrBalanceBefore = await this.token.balanceOf(this.vsr.address);
      await this.treasury.connect(owner).toVoters(
        newRewardToken.address,
        ethers.utils.parseEther('50'),
        0,
        +latest.toString() + 3600,
      );

      const vsrBalanceAfter = await this.token.balanceOf(this.vsr.address);

      expect(vsrBalanceAfter.sub(vsrBalanceBefore)).to.be.gt(ZERO);
    });


    

  });

});
