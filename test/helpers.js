const hre = require("hardhat");
const { time } = require('@openzeppelin/test-helpers');
const { ethers } = hre;
const chai = require('chai');
const { expect } = require('chai');



const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const DEAD_WALLET = '0x000000000000000000000000000000000000dEaD';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const ZERO = ethers.BigNumber.from('0');
const ONE = ethers.BigNumber.from('1');
const TWO = ethers.BigNumber.from('2');
const THREE = ethers.BigNumber.from('3');
const FOUR = ethers.BigNumber.from('4');
const FIVE = ethers.BigNumber.from('5');
const TEN = ethers.BigNumber.from('10');
const HUN = ethers.BigNumber.from('100');
const THO = ethers.BigNumber.from('1000');

const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";

const days = (n) => ethers.BigNumber.from('60').mul(ethers.BigNumber.from('1440').mul(ethers.BigNumber.from(n)));
const months = (n) => days('30').mul(ethers.BigNumber.from(n));
const YEAR = ethers.BigNumber.from('86400').mul(ethers.BigNumber.from('365'));
const MULTIPLIER = ethers.BigNumber.from('10').pow(ethers.BigNumber.from('18'));

chai.use(require('chai-bignumber')());

function logBN(name, value) {
  console.log(`${name}: ${value}`);
}

function logBNFromWei(name, value) {
  logBN(name, web3.utils.fromWei(value.toString(), 'ether'));
}

function logBNTimestamp(name, value) {
  console.log(`${name}: ${
    new Date(value * 1000)
  }`);
}

function expectEqual(num1, num2, accuracy, checkZero = true) {
  expect(num1.sub(num2).abs()).to.be.lte(accuracy);
  if(checkZero) expect(num1).to.be.gt(ZERO);
} 

class UniversalTracker {
  constructor(acc, getValueFn, unit) {
    this.account = acc;
    this.unit = unit;
    this.getValueFn = getValueFn;
  }

  async valueCurrent() {
    return ethers.BigNumber.from(
      (await this.getValueFn(this.account)).toString()
    );
  }

  async delta() {
    const current = await this.valueCurrent(this.account);
    const delta = current.sub(this.prev);
    this.prev = current;
    return delta;
  }

  async deltaInvertedSign() {
    console.log(ethers.BigNumber.from('-1').toString());
    return (await this.delta()).mul(ethers.BigNumber.from('-1'));
  }

  async get() {
    this.prev = await this.valueCurrent(this.account);
    return this.prev;
  }

  async log(unit=this.unit) {
    const value = await this.get(unit);
    console.log(value.toString());
  }
}

async function createTrackerInstance(owner, getBalanceFn, unit = 'wei') {
  const tracker = new UniversalTracker(owner, getBalanceFn, unit);
  await tracker.get();
  return tracker;
}

async function getLatestFullWeek(veToken) {
  const latestTimestamp = ethers.BigNumber.from((await time.latest()).toString());
  const WEEK = await veToken.WEEK();
  return latestTimestamp.div(WEEK).mul(WEEK);
}

async function getLatestFullWeekFromBlock(veToken) {
  const latestTimestamp = ethers.BigNumber.from((await time.latest()).toString());
  const WEEK = await veToken.WEEK();
  return latestTimestamp.div(WEEK).mul(WEEK);
}

async function shiftToWeeks(weeks, veToken) {
  const latestTimestamp = ethers.BigNumber.from((await time.latest()).toString());
  const WEEK = await veToken.WEEK();
  const latestFullWeek = latestTimestamp.div(WEEK).mul(WEEK);
  const timeShift = days(7).mul(ethers.BigNumber.from(weeks)).sub(latestTimestamp.sub(latestFullWeek));
  await time.increase(timeShift);
}

async function getValueTrackers(account, sources) {
  const trackers = {};
  for (const source in sources) {
    if (sources.hasOwnProperty(source)) {
      trackers[source] = await new UniversalTracker(account, sources[source]);
    }
  }
  return trackers;
}

async function startBonusCampaign(bonusCampaign, expect) {
  const bonusEmission = await bonusCampaign.bonusEmission();
  await expect(bonusCampaign.startMint()).to.emit(bonusCampaign, "RewardAdded").withArgs(bonusEmission);
}

async function mintForInflationAndSendToVoters(inflation, votingStakingRewards, token, treasury, expect) {
  /* ========== MINT FROM INFLATION AND SEND TO VOTERS ========== */
  const votingStakingRewardsTokenTracker = new UniversalTracker(
    votingStakingRewards.address,
    token.balanceOf,
  );
  console.log(await votingStakingRewardsTokenTracker.get());
  const treasuryRewardBalance = await token.balanceOf(
    treasury.address,
  );
  await votingStakingRewardsTokenTracker.get();
  console.log(await token.balanceOf(treasury.address));
  const votingStakingRewardsReceipt = await treasury.toVoters(
    token.address,
    ZERO,
    ZERO,
    ZERO
  );
  console.log(await token.balanceOf(treasury.address));
  expect(ethers.BigNumber.from(await votingStakingRewardsTokenTracker.delta())).to.be
    .gt(ZERO)
    .equal(treasuryRewardBalance);
  logBNFromWei('votingStakingRewards Token balance', await votingStakingRewardsTokenTracker.get());
}

const processEventArgs = async (result, eventName, processArgs) => {
  if (result == null) {
    throw new Error(`Result of tx is: ${result}`);
  }
  const filteredLogs = result.logs.filter((l) => l.event === eventName);
  if (!filteredLogs || filteredLogs.length === 0) {
    throw new Error(`no ${eventName} event is emitted`);
  }
  const eventArgs = filteredLogs[0].args;
  await processArgs(eventArgs);
};

module.exports = {
    processEventArgs,
    logBN,
    logBNFromWei,
    logBNTimestamp,
    createTrackerInstance,
    days,
    getLatestFullWeek,
    getLatestFullWeekFromBlock,
    shiftToWeeks,
    getValueTrackers,
    startBonusCampaign,
    mintForInflationAndSendToVoters,
    processEventArgs,
    ethAddress,
    DEAD_WALLET,
    ZERO_ADDRESS,
    ZERO,
    ONE,
    TWO,
    THREE,
    FOUR,
    FIVE,
    TEN,
    HUN,
    THO,
    MINTER_ROLE,
    months,
    YEAR,
    MULTIPLIER,
    expectEqual
}
