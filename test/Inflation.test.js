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
  groupsOfConstructorsArgumentsForVaultsLocal
} = require('../deploy/helpers.js');

const { expectEqual } = require('./helpers');
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
const acceptableError = targetMinted.div(bigPeriodsCount).mul(MINUTE);

let aliceInitialBalance;
let bobInitialBalance;
let charlieInitialBalance;

const gaugeRewardTokenPerPeriod = ethers.utils.parseEther("100");



describe('Inflation tests', async () => {
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
    
    this.vault = await deployments.get(groupsOfConstructorsArgumentsForVaultsLocal[4][0]);
    this.vault = new ethers.Contract(this.vault.address, this.vault.abi, ethers.provider);

    this.treasury = await deployments.get('Treasury');
    this.treasury = new ethers.Contract(this.treasury.address, this.treasury.abi, ethers.provider);

  });

  describe('Inflation tests', async () => {
   

    it('should correct set initial values', async() => {
      expect(await this.inflation.token()).to.be.equal(this.token.address);
      expect(await this.inflation.targetMinted()).to.be.equal(bigTargetMinted);
      expect(await this.inflation.periodicEmission()).to.be.equal(bigTargetMinted.div(periodsCount));
      expect(await this.inflation.periodDuration()).to.be.equal(periodDuration);
      expect(await this.inflation.receiversCount()).to.be.equal(THREE);
      expect(await this.inflation.receiverAt(0)).to.be.equal(this.treasury.address);
      expect(await this.inflation.receiverAt(1)).to.be.equal(gnosisWalletLocal);
      expect(await this.inflation.receiverAt(2)).to.be.equal(this.vault.address);

      expect(await this.inflation.weights(this.treasury.address)).to.be.equal(treasuryInflationWeight);
      expect(await this.inflation.weights(gnosisWalletLocal)).to.be.equal(gnosisInflationWeight);
      expect(await this.inflation.weights(this.vault.address)).to.be.equal(CRVcvxCRVVaultWeight);

    });

    it('should correct add new receiver', async() => {
      const weight = 1000
      const configure = false;
      const oldWeigths = [4000, 3000, 2000];
      const oldConfigures = [false, false, false];

      expectEqual(await this.inflation.claimable(this.treasury.address), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(this.vault.address), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(alice.address), ZERO, acceptableError, false);
      expectEqual(await this.token.balanceOf(this.inflation.address), ZERO, acceptableError, false);
      
      await time.increase(week);

      await expect(this.inflation.addReceiver(alice.address, weight, configure, [4000, 3000, 2000], [false, false, false, false])).to.be.revertedWith("lengths !equal");
      await expect(this.inflation.addReceiver(alice.address, weight, configure, [4000, 0, 2000], [false, false, false])).to.be.revertedWith("incorrect weight");
      await expect(this.inflation.addReceiver(alice.address, 0, configure, oldWeigths, oldConfigures)).to.be.revertedWith("incorrect weight");
      await expect(this.inflation.addReceiver(alice.address, weight, configure, [4000, 3000, 1000], [false, false, false])).to.be.revertedWith("incorrect sum");
      await this.inflation.addReceiver(alice.address, weight, configure, oldWeigths, oldConfigures);
      await expect(this.inflation.addReceiver(alice.address, weight, configure, [4000, 3000, 2000, 1000], [false, false, false, false])).to.be.revertedWith("already added");

      expectEqual(await this.token.balanceOf(this.inflation.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK), acceptableError, true);

      expect(await this.inflation.receiversCount()).to.be.equal(FOUR);
      expect(await this.inflation.receiverAt(0)).to.be.equal(this.treasury.address);
      expect(await this.inflation.receiverAt(1)).to.be.equal(gnosisWalletLocal);
      expect(await this.inflation.receiverAt(2)).to.be.equal(this.vault.address);
      expect(await this.inflation.receiverAt(3)).to.be.equal(alice.address);

      expect(await this.inflation.weights(this.treasury.address)).to.be.equal(4000);
      expect(await this.inflation.weights(gnosisWalletLocal)).to.be.equal(3000);
      expect(await this.inflation.weights(this.vault.address)).to.be.equal(2000);
      expect(await this.inflation.weights(alice.address)).to.be.equal(weight);

      expectEqual(await this.inflation.claimable(alice.address), ZERO, acceptableError, true);
      expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);

      const receivers = await this.inflation.getAllReceivers();
      expect(receivers[0]).to.be.equal(this.treasury.address);
      expect(receivers[1]).to.be.equal(gnosisWalletLocal);
      expect(receivers[2]).to.be.equal(this.vault.address);
      expect(receivers[3]).to.be.equal(alice.address);


    });


    it('should correct reconfigure receivers', async() => {
      const weight = 1000
      const configure = false;
      const oldWeigths = [4000, 3000, 2000];
      const oldConfigures = [false, false, false];

      const weigths = [5000, 2000, 1500, 1500]; // treasury, gnosis, vault, alice
      const callConfigures = [false, false, false, false];

      await time.increase(week);
      await this.inflation.addReceiver(alice.address, weight, configure, oldWeigths, oldConfigures);

      expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(alice.address), ZERO, acceptableError, false);
      expectEqual(await this.token.balanceOf(this.inflation.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK), acceptableError, true);
      
      await time.increase(week);

      await expect(this.inflation.reconfigureReceivers(weigths, [false, false, false])).to.be.revertedWith("lengths !equal");
      await expect(this.inflation.reconfigureReceivers([1, 1], [false, false])).to.be.revertedWith("lengths !equal");
      await expect(this.inflation.reconfigureReceivers([5000, 2000, 1500, 1], callConfigures)).to.be.revertedWith("incorrect sum");
      await this.inflation.reconfigureReceivers(weigths, callConfigures);

      expectEqual(await this.token.balanceOf(this.inflation.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(TWO), acceptableError, true);

      expect(await this.inflation.receiversCount()).to.be.equal(FOUR);
      expect(await this.inflation.receiverAt(0)).to.be.equal(this.treasury.address);
      expect(await this.inflation.receiverAt(1)).to.be.equal(gnosisWalletLocal);
      expect(await this.inflation.receiverAt(2)).to.be.equal(this.vault.address);
      expect(await this.inflation.receiverAt(3)).to.be.equal(alice.address);

      expect(await this.inflation.weights(this.treasury.address)).to.be.equal(5000);
      expect(await this.inflation.weights(gnosisWalletLocal)).to.be.equal(2000);
      expect(await this.inflation.weights(this.vault.address)).to.be.equal(1500);
      expect(await this.inflation.weights(alice.address)).to.be.equal(1500);

      expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000'))).div(sumWeight), acceptableError, true);

      await time.increase(week);
      await time.advanceBlock();

      expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('1500'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000')).add(BigNumber.from('5000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000')).add(BigNumber.from('2000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000')).add(BigNumber.from('1500'))).div(sumWeight), acceptableError, true);

    });


    it('should correct remove receiver', async() => {
      const weight = 1000
      const configure = false;
      const oldWeigths = [4000, 3000, 2000];
      const oldConfigures = [false, false, false];

      const weigths = [5000, 2000, 1500, 1500]; // treasury, gnosis, vault, alice
      const callConfigures = [false, false, false, false];

      const weightsAfterRemoving = [1500, 4500, 4000] //treasury, gnosis, alice
      const configuresAfterRemoving = [false, false, false];

      await time.increase(week);
      await this.inflation.addReceiver(alice.address, weight, configure, oldWeigths, oldConfigures);

      await time.increase(week);

      await this.inflation.reconfigureReceivers(weigths, callConfigures);

      expectEqual(await this.token.balanceOf(this.inflation.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(TWO), acceptableError, true);

      expect(await this.inflation.receiversCount()).to.be.equal(FOUR);
      expect(await this.inflation.receiverAt(0)).to.be.equal(this.treasury.address);
      expect(await this.inflation.receiverAt(1)).to.be.equal(gnosisWalletLocal);
      expect(await this.inflation.receiverAt(2)).to.be.equal(this.vault.address);
      expect(await this.inflation.receiverAt(3)).to.be.equal(alice.address);

      expect(await this.inflation.weights(this.treasury.address)).to.be.equal(5000);
      expect(await this.inflation.weights(gnosisWalletLocal)).to.be.equal(2000);
      expect(await this.inflation.weights(this.vault.address)).to.be.equal(1500);
      expect(await this.inflation.weights(alice.address)).to.be.equal(1500);

      expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000'))).div(sumWeight), acceptableError, true);

      await time.increase(week);

      await expect(this.inflation.removeReceiver(this.vault.address, false, weigths, callConfigures)).to.be.revertedWith('lengths !equal');
      await expect(this.inflation.removeReceiver(this.vault.address, false, weightsAfterRemoving, [false, false])).to.be.revertedWith('lengths !equal');
      await expect(this.inflation.removeReceiver(this.vault.address, false, [1, 1, 1], configuresAfterRemoving)).to.be.revertedWith('incorrect sum');
      await this.inflation.removeReceiver(this.vault.address, false, weightsAfterRemoving, configuresAfterRemoving);

      expect(await this.inflation.receiversCount()).to.be.equal(3);

      expect(await this.inflation.receiverAt(0)).to.be.equal(this.treasury.address);
      expect(await this.inflation.receiverAt(1)).to.be.equal(gnosisWalletLocal);
      expect(await this.inflation.receiverAt(2)).to.be.equal(alice.address);

      expect(await this.inflation.weights(this.treasury.address)).to.be.equal(1500);
      expect(await this.inflation.weights(gnosisWalletLocal)).to.be.equal(4500);
      expect(await this.inflation.weights(alice.address)).to.be.equal(4000);


      expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('1500'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000')).add(BigNumber.from('5000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000')).add(BigNumber.from('2000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000')).add(BigNumber.from('1500'))).div(sumWeight), acceptableError, true);

      await time.increase(week);
      await time.advanceBlock();

      expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('1500')).add(BigNumber.from('4000'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000')).add(BigNumber.from('5000')).add(BigNumber.from('1500'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000')).add(BigNumber.from('2000')).add(BigNumber.from('4500'))).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000')).add(BigNumber.from('1500'))).div(sumWeight), acceptableError, true);

    });


    it('should correct distribute token', async() => {

      await time.increase(week);

      const treasuryBalanceBefore = await this.token.balanceOf(this.treasury.address);
      await this.inflation.connect(alice)["getToken(address)"](this.treasury.address);
      const treasuryBalanceAfter = await this.token.balanceOf(this.treasury.address);
      expectEqual(treasuryBalanceAfter.sub(treasuryBalanceBefore), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500')).div(sumWeight), acceptableError, true);

      const gnosisBalanceBefore = await this.token.balanceOf(gnosisWalletLocal);
      await this.inflation.connect(alice)["getToken(address)"](gnosisWalletLocal);
      const gnosisBalanceAfter = await this.token.balanceOf(gnosisWalletLocal);
      expectEqual(gnosisBalanceAfter.sub(gnosisBalanceBefore), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500')).div(sumWeight), acceptableError, true);

      const vaultBalanceBefore = await this.token.balanceOf(this.vault.address);
      await this.inflation.connect(alice)["getToken(address)"](this.vault.address);
      const vaultBalanceAfter = await this.token.balanceOf(this.vault.address);
      expectEqual(vaultBalanceAfter.sub(vaultBalanceBefore), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);

      expectEqual(await this.inflation.claimable(this.treasury.address), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(this.vault.address), ZERO, acceptableError, false);

      await time.increase(week);
      await time.advanceBlock();

      expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500')).div(sumWeight), acceptableError, true);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);

      await this.inflation.connect(alice)["getToken(address)"](this.treasury.address);

      expectEqual(await this.inflation.claimable(this.treasury.address), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500')).div(sumWeight), acceptableError, false);
      expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, false);

      await time.increase(week);

      await this.inflation.connect(alice)["getToken()"]();

      expectEqual(await this.inflation.claimable(this.treasury.address), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(this.vault.address), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), ZERO, acceptableError, false);

      await time.increase(week);

      await this.inflation.connect(alice)["getToken(address[])"]([this.treasury.address, this.vault.address, gnosisWalletLocal]);

      expectEqual(await this.inflation.claimable(this.treasury.address), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(this.vault.address), ZERO, acceptableError, false);
      expectEqual(await this.inflation.claimable(gnosisWalletLocal), ZERO, acceptableError, false);

    });

    it('should correct add and remove receiver', async() => {

        const weight = 1000
        const configure = false;
        const oldWeigths = [4000, 3000, 2000];
        const oldConfigures = [false, false, false];
  
        await time.increase(week);

        await this.inflation.connect(owner).addReceiver(alice.address, weight, configure, oldWeigths, oldConfigures);

        expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(alice.address), ZERO, acceptableError, false);

        await time.increase(week);

        expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, false);

        await this.inflation.connect(owner)["getToken()"](); 
        expectEqual(await this.token.balanceOf(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);

        expectEqual(await this.inflation.claimable(this.treasury.address), ZERO, acceptableError, false);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), ZERO, acceptableError, false);
        expectEqual(await this.inflation.claimable(this.vault.address), ZERO, acceptableError, false);
        expectEqual(await this.inflation.claimable(alice.address), ZERO, acceptableError, false);

        await time.increase(week);

        expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('4000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('3000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, false);

        await this.inflation.connect(owner)["getToken()"](); 
        expectEqual(await this.token.balanceOf(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000')).add(BigNumber.from('4000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000')).add(BigNumber.from('3000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000')).add(BigNumber.from('2000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('1000'))).div(sumWeight), acceptableError, true);

        await time.increase(week);

        await this.inflation.reconfigureReceivers([1000, 2000, 6500, 500], [false, false, false, false]);

        expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('4000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('3000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, false);

        await this.inflation.connect(owner)["getToken(address[])"]([this.treasury.address, this.vault.address]); 
        expectEqual(await this.token.balanceOf(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000')).add(BigNumber.from('4000')).add(BigNumber.from('4000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000')).add(BigNumber.from('3000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000')).add(BigNumber.from('2000')).add(BigNumber.from('2000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('1000'))).div(sumWeight), acceptableError, true);

        await time.increase(week);

        expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2000').add(BigNumber.from('3000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('500'))).div(sumWeight), acceptableError, false);

        await this.inflation.removeReceiver(alice.address, false, [1000, 8500, 500], [false, false, false]);

        expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2000').add(BigNumber.from('3000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('500'))).div(sumWeight), acceptableError, false);

        await time.increase(week);

        expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('1000'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2000').add(BigNumber.from('3000')).add(BigNumber.from('8500'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('500'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('500'))).div(sumWeight), acceptableError, false);

        await this.inflation.connect(owner)["getToken(address)"](this.treasury.address); 
        expectEqual(await this.token.balanceOf(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000')).add(BigNumber.from('4000')).add(BigNumber.from('4000')).add(BigNumber.from('1000').add(BigNumber.from('1000')))).div(sumWeight), acceptableError, true);
        await this.inflation.connect(owner)["getToken(address)"](gnosisWalletLocal); 
        expectEqual(await this.token.balanceOf(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000')).add(BigNumber.from('3000')).add(BigNumber.from('2000').add(BigNumber.from('3000'))).add(BigNumber.from('8500'))).div(sumWeight), acceptableError, true);
        await this.inflation.connect(owner)["getToken(address)"](this.vault.address); 
        expectEqual(await this.token.balanceOf(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000')).add(BigNumber.from('2000')).add(BigNumber.from('2000')).add(BigNumber.from('6500').add(BigNumber.from('500')))).div(sumWeight), acceptableError, true);
        await this.inflation.connect(owner)["getToken(address)"](alice.address); 
        expectEqual(await this.token.balanceOf(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('1000')).add(BigNumber.from('1000').add(BigNumber.from('500')))).div(sumWeight), acceptableError, true);

        await time.increase(week);

        expectEqual(await this.inflation.claimable(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('8500')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('500')).div(sumWeight), acceptableError, true);
        expectEqual(await this.inflation.claimable(alice.address), ZERO, acceptableError, false);

        await this.inflation.connect(owner)["getToken()"](); 

        expectEqual(await this.token.balanceOf(this.treasury.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('2500').add(BigNumber.from('4000')).add(BigNumber.from('4000')).add(BigNumber.from('4000')).add(BigNumber.from('1000').add(BigNumber.from('1000').add(BigNumber.from('1000'))))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(gnosisWalletLocal), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('6500').add(BigNumber.from('3000')).add(BigNumber.from('3000')).add(BigNumber.from('2000').add(BigNumber.from('3000'))).add(BigNumber.from('8500')).add(BigNumber.from('8500'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(this.vault.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('2000')).add(BigNumber.from('2000')).add(BigNumber.from('2000')).add(BigNumber.from('6500').add(BigNumber.from('500'))).add(BigNumber.from('500'))).div(sumWeight), acceptableError, true);
        expectEqual(await this.token.balanceOf(alice.address), (bigTargetMinted.div(bigPeriodsCount)).mul(WEEK).mul(BigNumber.from('1000').add(BigNumber.from('1000')).add(BigNumber.from('1000').add(BigNumber.from('500')))).div(sumWeight), acceptableError, true);



    });

    

    



  });

});
