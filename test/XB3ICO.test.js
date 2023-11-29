const { ethers, waffle, deployments } = require('hardhat');
const { BigNumber } = require('ethers');
const chai = require('chai');
const { expect } = require('chai');


// const {
//   targetMinted,
//   periodsCount,
//   periodDuration,
//   treasuryFeeBps,
//   treasuryInflationWeight,
//   referralFeeBps,
//   walletFeeBps,
//   gnosisWalletLocal,
//   crvFactoryLocal,
//   sumWeight,
//   crvTokenAddressLocal
// } = require('../deploy/helpers.js');


const {
    initialPrice,
    limitPrice,
    rateCoeff,
    point,
    maxSupply,
} = require('../deploy/helpers_ethereum');
// const ether = require('@openzeppelin/test-helpers/src/ether');
// const { TASK_EXPORT } = require('hardhat-deploy');

chai.use(require('chai-bignumber')());

const MINUTE = BigNumber.from('60')
const WEEK = BigNumber.from("86400").mul(BigNumber.from("7"));
const week = 86400 * 7;
const hour = 3600;
const day = 86400;
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

const BPS_BASE = BigNumber.from('10000');

const MULTIPLIER =  ethers.utils.parseEther('0.0005');

const { expectEqual } = require('./helpers');
const { time } = require('@openzeppelin/test-helpers');

describe('ICO tests', async () => {
  const accounts = waffle.provider.getWallets();
  const owner = accounts[0];
  const alice = accounts[1];
  const bob = accounts[2];
  const charlie = accounts[3];

  beforeEach('deployment', async() => {

    // await deployments.fixture(['main_local']); 
    const ICO = await ethers.getContractFactory('XB3ICO');
    const Token = await ethers.getContractFactory('MockToken');
    const PaymentToken = await ethers.getContractFactory('MockToken6dec');
    this.token = await Token.deploy("Name", "Symbol", ethers.utils.parseEther('1000000'));
    this.paymentToken = await PaymentToken.deploy("Name", "Symbol", "1000000000000");
    this.ico = await ICO.deploy(
        this.paymentToken.address,
        this.token.address,
        initialPrice,
        limitPrice,
        rateCoeff,
        point,
        maxSupply
    );

    await this.paymentToken.connect(owner).mint(alice.address, "1000000000000");  // 1 000 000 tokens
    await this.paymentToken.connect(owner).mint(bob.address, "1000000000000");  // 1 000 000 tokens

    await this.paymentToken.connect(alice).approve(this.ico.address, "1000000000000");  
    await this.paymentToken.connect(bob).approve(this.ico.address, "1000000000000");  

    await this.token.connect(owner).mint(this.ico.address, ethers.utils.parseEther('1100') );

    await this.ico.connect(owner).unpause();
    
  });

  describe('ICO tests', async () => {

    it('should correct buy', async() => {

        const paymentTokenBalanceBefore = await this.paymentToken.balanceOf(alice.address);
        const tokenBalanceBefore = await this.token.balanceOf(alice.address);

        let amountIn = 200000000;   // 200 USDC
        let latest = +(await time.latest()).toString();

        await time.increase('7200');
        await expect(this.ico.connect(alice).buy(amountIn, 0, latest + 3600)).to.be.revertedWith('expired');

        const {amountOut} = await this.ico._calculateAmountOut(amountIn);
        await expect(this.ico.connect(alice).buy(amountIn, amountOut.sub(ONE), latest + 3600)).to.be.revertedWith('expired');

        latest = +(await time.latest()).toString();
        await this.ico.connect(alice).buy(amountIn, 0, latest + 3600);

        const paymentTokenBalanceAfter = await this.paymentToken.balanceOf(alice.address);
        const tokenBalanceAfter = await this.token.balanceOf(alice.address);

        expect(paymentTokenBalanceBefore.sub(paymentTokenBalanceAfter)).to.be.equal(amountIn);
        expectEqual(tokenBalanceAfter.sub(tokenBalanceBefore), ethers.utils.parseEther('1.309832152'), ethers.utils.parseEther('0.001'), true);
    });

    it('should correct buy all', async() => {
        const paymentTokenBalanceBefore = await this.paymentToken.balanceOf(alice.address);
        const tokenBalanceBefore = await this.token.balanceOf(alice.address);

        let amountIn = 450000000000;   // 450 000 USDC
        let latest = +(await time.latest()).toString();
        await this.ico.connect(alice).buy(amountIn, 0, latest + 3600);

        const paymentTokenBalanceAfter = await this.paymentToken.balanceOf(alice.address);
        const tokenBalanceAfter = await this.token.balanceOf(alice.address);

        expectEqual(paymentTokenBalanceBefore.sub(paymentTokenBalanceAfter), 449393.2964 * 1e6, 10000, true);
        expect(tokenBalanceAfter.sub(tokenBalanceBefore), ethers.utils.parseEther('1000'));

    });

    it('should correct buy in the middle', async() => {

        let amountInAlice = 200000000;   // 200 USDC
        let latest = +(await time.latest()).toString();
        await this.ico.connect(alice).buy(amountInAlice, 0, latest + 3600);

        const paymentTokenBalanceBeforeBob = await this.paymentToken.balanceOf(bob.address);
        const tokenBalanceBeforeBob = await this.token.balanceOf(bob.address);

        let amountInBob = 200000000;   // 200 USDC
        latest = +(await time.latest()).toString();
        await this.ico.connect(bob).buy(amountInBob, 0, latest + 3600);


        const paymentTokenBalanceAfterBob = await this.paymentToken.balanceOf(bob.address);
        const tokenBalanceAfterBob = await this.token.balanceOf(bob.address);

        
        expect(paymentTokenBalanceBeforeBob.sub(paymentTokenBalanceAfterBob)).to.be.equal(amountInBob);
        expectEqual(tokenBalanceAfterBob.sub(tokenBalanceBeforeBob), ethers.utils.parseEther('1.2665'), ethers.utils.parseEther('0.001'), true);
        expectEqual(await this.ico.currentSupply(), ethers.utils.parseEther('2.5764'), ethers.utils.parseEther('0.001'), true); // 1,266579444 + 1,309832152 = 2.576411596
    });


    it('should correct buy all in the middle', async() => {

        const paymentTokenBalanceBeforeAlice = await this.paymentToken.balanceOf(alice.address);
        const tokenBalanceBeforeAlice = await this.token.balanceOf(alice.address);

        let amountInAlice = 10000000000;   // 10 000 USDC
        latest = +(await time.latest()).toString();
        await this.ico.connect(alice).buy(amountInAlice, 0, latest + 3600);

        

        const paymentTokenBalanceAfterAlice = await this.paymentToken.balanceOf(alice.address);
        const tokenBalanceAfterAlice = await this.token.balanceOf(alice.address);

        let current = await this.ico.currentSupply();
        expectEqual(current, ethers.utils.parseEther('44.78173082'), ethers.utils.parseEther('0.001'), true);
        expectEqual(tokenBalanceAfterAlice.sub(tokenBalanceBeforeAlice), ethers.utils.parseEther('44.78173082'), ethers.utils.parseEther('0.001'), true);
        expect(paymentTokenBalanceBeforeAlice.sub(paymentTokenBalanceAfterAlice)).to.be.equal(amountInAlice);

        const paymentTokenBalanceBeforeBob = await this.paymentToken.balanceOf(bob.address);
        const tokenBalanceBeforeBob = await this.token.balanceOf(bob.address);

        let amountInBob = 450000000000;   // 450 000 USDC
        latest = +(await time.latest()).toString();
        await this.ico.connect(bob).buy(amountInBob, 0, latest + 3600);

        const paymentTokenBalanceAfterBob = await this.paymentToken.balanceOf(bob.address);
        const tokenBalanceAfterBob = await this.token.balanceOf(bob.address);

        expect(await this.ico.currentSupply()).to.be.equal(ethers.utils.parseEther('1000'));
        expectEqual(tokenBalanceAfterBob.sub(tokenBalanceBeforeBob), ethers.utils.parseEther('955.21826918'), ethers.utils.parseEther('0.001'), true);
        expect(+paymentTokenBalanceAfterBob.sub(paymentTokenBalanceBeforeBob).toString() - 439393.2964 * 1e6).to.be.lt(0.001);

    });

    it('should correct withdraw', async() => {
        let amountInAlice = 10000000000;   // 10 000 USDC
        latest = +(await time.latest()).toString();
        await this.ico.connect(alice).buy(amountInAlice, 0, latest + 3600);

        
        const paymentTokenBalanceBefore = await this.paymentToken.balanceOf(owner.address);
        await this.ico.connect(owner)['withdraw(address,uint256)'](owner.address, 1000 * 1e6);
        const paymentTokenBalanceAfter = await this.paymentToken.balanceOf(owner.address);

        expect(paymentTokenBalanceAfter.sub(paymentTokenBalanceBefore)).to.be.equal(1000 * 1e6);
    });




  });



});
