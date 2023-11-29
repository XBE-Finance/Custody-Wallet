const { ethers, waffle, deployments } = require('hardhat');
const util = require('util');
const { BigNumber } = require('ethers');
const { expect, use } = require('chai');
const chai = require('chai');
const fs = require('fs')
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const EthCrypto = require("eth-crypto");
const {readFileSync, promises: fsPromises} = require('fs');

const xbeInfoSnapshot = require('./data/snapshot_15866138.json');

const { time } = require('@openzeppelin/test-helpers');


let userInfo = [];
let userAddresses = [];

let migrator;


const {
    oldXbeAddress,
    oldBonusCampaignAddress,
    oldVeTokenAddress,
    oldVsrAddress,
    oldFraxVaultAddress,
    oldSushiVaultAddress,
    oldCrvCvxVaultAddress,
    oldReferralProgramAddress,
    vsrContract,
    bcContract,
    referralContract,
    xbeContract,
    vexbeContract,
    sushiVaultContract,
    fraxVaultContract,
    crvCvxVaultContract,
    convexBoosterAddressLocal,
    REGISTRATOR_ROLE,
    merkleTree,
    merkleRoot,
    feeBpsOnClaim
} = require("../deploy/helpers_ethereum")


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
  minLockDurationLocal,
  rewardsDurationLocal,
  startMintTimeLocal,
  stopRegisterTimeLocal,
  bonusCampaignRewardsDurationLocal,
  bonusEmissionAmount
} = require('../deploy/helpers.js');




// async function requestUserData(user) {
//     const xbeBalance = await xbeContract.balanceOf(user);
//     const vsrStaked = await vsrContract.balanceOf(user);
//     const vsrBoost = await vsrContract.calculateBoostLevel(user);
//     const vsrReward = await vsrContract.earned(user);
//     const bcStaked = await bcContract.balanceOf(user);
//     const bcReward = await bcContract.earned(user);
//     const referralReward = await referralContract.rewards(user, oldXbeAddress);
//     const vexbeBalance = await vexbeContract.balanceOf(user);
//     const vexbeLockedAmount = await vexbeContract.lockedAmount(user);
//     const vexbeLockedEnd = await vexbeContract.lockedEnd(user);
//     const sushiVaultEarned = await sushiVaultContract.earned(oldXbeAddress, user);
//     const fraxVaultEarned = await fraxVaultContract.earned(oldXbeAddress, user);
//     const crvCvxVaultEarned = await crvCvxVaultContract.earned(oldXbeAddress, user);
//     return [
//         xbeBalance,
//         vsrStaked,
//         vsrBoost,
//         vsrReward,
//         bcStaked,
//         bcReward,
//         referralReward,
//         vexbeBalance,
//         vexbeLockedAmount,
//         vexbeLockedEnd,
//         sushiVaultEarned,
//         fraxVaultEarned,
//         crvCvxVaultEarned
//     ];
// }

  


// async function getUsersData(users) {
//     console.log("here")
//     console.log(users)
//     for (const user of users) {

//         const [
//             xbeBalance,
//             vsrStaked,
//             vsrBoost,
//             bcStaked,
//             bcReward,
//             referralReward,
//             vexbeLockedAmount,
//             vexbeLockedEnd,
//             sushiVaultEarned,
//             fraxVaultEarned,
//             crvCvxVaultEarned
//         ] = await requestUserData(user);

//         console.log("user = ", user, xbeBalance.toString())
    
//         userInfo.push({
//             address: user,
//             xbeBalance,
//             vsrStaked,
//             vsrBoost,
//             bcStaked,
//             bcReward,
//             referralReward,
//             vexbeLockedAmount,
//             vexbeLockedEnd,
//             sushiVaultEarned,
//             fraxVaultEarned,
//             crvCvxVaultEarned
//         });
//     }
// }


// function makeSnapshot() {
//     for (const user of userInfo) {
//         fs.appendFile('./snapshot.txt', 
//             user.address + '\t' + 
//             ethers.utils.formatEther(user.xbeBalance) + '\t' +
//             ethers.utils.formatEther(user.vsrStaked) + '\t' +
//             ethers.utils.formatEther(user.vsrBoost) + '\t' +
//             ethers.utils.formatEther(user.bcStaked) + '\t' +
//             ethers.utils.formatEther(user.bcReward) + '\t' +
//             ethers.utils.formatEther(user.referralReward) + '\t' +
//             ethers.utils.formatEther(user.vexbeLockedAmount) + '\t' +
//             vexbeLockedEnd.toString(),
//             ethers.utils.formatEther(user.sushiVaultEarned) + '\t' +
//             ethers.utils.formatEther(user.fraxVaultEarned) + '\t' +
//             ethers.utils.formatEther(user.crvCvxVaultEarned) + '\t'
//             + "\n", err => {
//                 if (err) {
//                     console.error(err)
//                     return
//                 }
//             }
//         )
//     }
    
// }



function syncReadFile(filename) {
    const contents = readFileSync(filename, 'utf-8');
  
    const arr = contents.split(/\r?\n/);
  
    console.log(arr); // 👉️ ['One', 'Two', 'Three', 'Four']
  
    return arr;
  }

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

const { expectEqual, HUN, MINTER_ROLE } = require('./helpers');
const { formatEther } = require('ethers/lib/utils');
const { threadId } = require('worker_threads');

describe('Migrator tests', async () => {

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

    const GovernanceToken = await ethers.getContractFactory('GovernanceToken');
    this.token = await GovernanceToken.deploy()

    const LockSubscription = await ethers.getContractFactory('LockSubscription');
    this.lockSubscription = await LockSubscription.deploy();

    const VeToken = await ethers.getContractFactory('VeToken');
    this.veToken = await VeToken.deploy(
        this.token.address,
        this.lockSubscription.address,
        minLockDurationLocal,
        "name",
        "symbol",
        "0.0.1"
    )

    const now = BigNumber.from(Math.round(Date.now() / 1000))

    const BonusCampaign = await ethers.getContractFactory('BonusCampaign');
    this.bonusCampaign = await BonusCampaign.deploy(
        this.token.address,
        this.veToken.address,
        now.add(startMintTimeLocal),
        now.add(stopRegisterTimeLocal),
        bonusCampaignRewardsDurationLocal,
        bonusEmissionAmount
    )

    await this.bonusCampaign.connect(owner).grantRole(REGISTRATOR_ROLE, this.lockSubscription.address)
    await this.lockSubscription.connect(owner).addLockSubscriber(this.bonusCampaign.address)

    
    const VSR = await ethers.getContractFactory('VotingStakingRewardsForLockers');
    this.vsr = await VSR.deploy(
        owner.address,
        this.token.address,
        this.token.address,
        rewardsDurationLocal,
        this.bonusCampaign.address,
        percentageToBeLocked
    )

    
    await this.lockSubscription.connect(owner).setEventSource(this.veToken.address)


    await this.veToken.connect(owner).setVotingStakingRewards(this.vsr.address)
    await this.veToken.connect(owner).setAllowedToActWithoutPermission(this.vsr.address, true)
    await this.vsr.connect(owner).setVeToken(this.veToken.address)
    await this.vsr.connect(owner).grantRole(REGISTRATOR_ROLE, this.lockSubscription.address)
    await this.lockSubscription.connect(owner).addLockSubscriber(this.vsr.address)
    await this.lockSubscription.connect(owner).addUnlockSubscriber(this.vsr.address)



    const ReferralProgram = await ethers.getContractFactory('ReferralProgram');
    this.referralProgram = await ReferralProgram.deploy(
        owner.address,
        percentageToBeLocked,
        this.veToken.address,
        this.vsr.address
    )

    await this.referralProgram.connect(owner).setVotingStakingRewards(this.vsr.address)



    const Migrator = await ethers.getContractFactory('XBE2XB3MigratorTest');
    this.migrator = await Migrator.deploy(
        alice.address,
        this.token.address,
        this.veToken.address,
        feeBpsOnClaim,
        merkleRoot
    )

    await this.token.connect(owner).grantRole(MINTER_ROLE, this.migrator.address)
    await this.veToken.connect(owner).setAllowedToActWithoutPermission(this.migrator.address, true);
  });

  describe('Migrator tests', async () => {

    


    it('should correct set initial values', async() => {
        expect(await this.migrator.oldToken()).to.be.equal(oldXbeAddress);
        expect(await this.migrator.newToken()).to.be.equal(this.token.address);
        expect(await this.migrator.oldBonusCampaign()).to.be.equal(oldBonusCampaignAddress);
        expect(await this.migrator.newBonusCampaign()).to.be.equal(this.bonusCampaign.address);
        expect(await this.migrator.oldVeToken()).to.be.equal(oldVeTokenAddress);
        expect(await this.migrator.newVeToken()).to.be.equal(this.veToken.address);
        expect(await this.migrator.oldVotingStakingReward()).to.be.equal(oldVsrAddress);
        expect(await this.migrator.oldReferralProgram()).to.be.equal(oldReferralProgramAddress);
        expect(await this.migrator.vaultAt(0)).to.be.equal(oldFraxVaultAddress);
        expect(await this.migrator.vaultAt(1)).to.be.equal(oldSushiVaultAddress);
        expect(await this.migrator.vaultAt(2)).to.be.equal(oldCrvCvxVaultAddress);

    });

    it('should migrate existing users correctly', async() => {

        for (let i = 0; i < xbeInfoSnapshot.length; i++) {
            // if (!users.includes(xbeInfoSnapshot[i].address)) continue;
            const migrationArgs = [
                xbeInfoSnapshot[i].address,
                BigNumber.from(xbeInfoSnapshot[i].xbe_balance),
                BigNumber.from(xbeInfoSnapshot[i].vsr_staked),
                BigNumber.from(xbeInfoSnapshot[i].vsr_reward),
                BigNumber.from(xbeInfoSnapshot[i].bc_staked),
                BigNumber.from(xbeInfoSnapshot[i].bc_reward),
                BigNumber.from(xbeInfoSnapshot[i].referral_reward),
                BigNumber.from(xbeInfoSnapshot[i].vexbe_locked_amount),
                BigNumber.from(xbeInfoSnapshot[i].vexbe_locked_end),
                BigNumber.from(xbeInfoSnapshot[i].sushi_vault_earned),
                BigNumber.from(xbeInfoSnapshot[i].fraux_vault_earned),
                BigNumber.from(xbeInfoSnapshot[i].crv_cvx_vault_earned)
            ]

            // console.log(migrationArgs)
            // console.log(xbeInfoSnapshot[i].merkle_proof)

            await this.migrator.connect(owner).migrate(
                migrationArgs, 
                xbeInfoSnapshot[i].merkle_proof
            );

            const newFreeBalance = await this.token.balanceOf(xbeInfoSnapshot[i].address);

            const newVsrBoost = await this.vsr.calculateBoostLevel(xbeInfoSnapshot[i].address);

            const newBCStaked = await this.bonusCampaign.balanceOf(xbeInfoSnapshot[i].address);

            const newVexbeBalance = await this.veToken["balanceOf(address)"](xbeInfoSnapshot[i].address);

            const newLockedAmount = await this.veToken.lockedAmount(xbeInfoSnapshot[i].address);

            const newLockedEnd = await this.veToken.lockedEnd(xbeInfoSnapshot[i].address);

            fs.appendFile('./snapshot_with_contracts.txt', 
                xbeInfoSnapshot[i].address + '\t' + 
                ethers.utils.formatEther(xbeInfoSnapshot[i].xbe_balance) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].vsr_staked) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].vsr_boost) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].vsr_reward) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].bc_staked) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].bc_reward) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].referral_reward) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].vexbe_balance) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].vexbe_locked_amount) + '\t' +
                xbeInfoSnapshot[i].vexbe_locked_end.toString() + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].sushi_vault_earned) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].fraux_vault_earned) + '\t' +
                ethers.utils.formatEther(xbeInfoSnapshot[i].crv_cvx_vault_earned) + '\t' +

                ethers.utils.formatEther(newFreeBalance) + '\t' +
                ethers.utils.formatEther(newVsrBoost) + '\t' +
                ethers.utils.formatEther(newBCStaked) + '\t' +
                ethers.utils.formatEther(newVexbeBalance) + '\t' +
                ethers.utils.formatEther(newLockedAmount) + '\t' +
                newLockedEnd.toString() + '\t' +
                "\n", err => {
                    if (err) {
                        console.error(err)
                        return
                    }
                }
            )
            console.log('i = ', i);
            

        }



    })
    describe('Local migrator tests', async () => {

        xit('should migrate correctly if user have zero position', async() => {
            

            await migrator.connect(owner).migrate(bob.address);
            const newFreeBalance = await this.token.balanceOf(bob.address);
            const newVsrBoost = await this.vsr.calculateBoostLevel(bob.address);
            const newBCStaked = await this.bonusCampaign.balanceOf(bob.address);
            const newVexbeBalance = await this.veToken["balanceOf(address)"](bob.address);
            const newLockedAmount = await this.veToken.lockedAmount(bob.address);
            const newLockedEnd = await this.veToken.lockedEnd(bob.address);

            expect(newFreeBalance).to.be.equal(ZERO);
            expect(newVsrBoost).to.be.equal(ethers.utils.parseEther('1'));
            expect(newBCStaked).to.be.equal(ZERO);
            expect(newVexbeBalance).to.be.equal(ZERO);
            expect(newLockedAmount).to.be.equal(ZERO);
            expect(newLockedEnd).to.be.equal(ZERO);

        })

        it('should migrate correctly if user have non zero position (in BC)', async() => {

            const userInfo = xbeInfoSnapshot[owner.address];
            
            const hash = EthCrypto.hash.keccak256([
                { type: "address", value: owner.address },
                { type: "uint256", value: BigNumber.from(userInfo.xbeBalance) },
                { type: "uint256", value: BigNumber.from(userInfo.vsrStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcReward) },
                { type: "uint256", value: BigNumber.from(userInfo.referralReward) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedAmount) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedEnd) },
                { type: "uint256", value: BigNumber.from(userInfo.sushiVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.fraxVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.crvCvxVaultEarned) }
            ]);

            const badHash = EthCrypto.hash.keccak256([
                { type: "address", value: owner.address },
                { type: "uint256", value: BigNumber.from(userInfo.xbeBalance).add(ONE) },
                { type: "uint256", value: BigNumber.from(userInfo.vsrStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcReward) },
                { type: "uint256", value: BigNumber.from(userInfo.referralReward) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedAmount) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedEnd) },
                { type: "uint256", value: BigNumber.from(userInfo.sushiVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.fraxVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.crvCvxVaultEarned) }
            ]);

            const proof = merkleTree.getHexProof(hash);
            const badProof = merkleTree.getHexProof(badHash);

            await expect(this.migrator.connect(owner).migrate(
                [
                    owner.address,
                    BigNumber.from(userInfo.xbeBalance).add(ONE),
                    userInfo.vsrStaked,
                    userInfo.bcStaked,
                    userInfo.bcReward,
                    userInfo.referralReward,
                    userInfo.vexbeLockedAmount,
                    userInfo.vexbeLockedEnd,
                    userInfo.sushiVaultEarned,
                    userInfo.fraxVaultEarned,
                    userInfo.crvCvxVaultEarned,
                ],
                badProof
            )).to.be.revertedWith('incorrect proof');

            await this.migrator.connect(owner).migrate(
                [
                    owner.address,
                    userInfo.xbeBalance,
                    userInfo.vsrStaked,
                    userInfo.bcStaked,
                    userInfo.bcReward,
                    userInfo.referralReward,
                    userInfo.vexbeLockedAmount,
                    userInfo.vexbeLockedEnd,
                    userInfo.sushiVaultEarned,
                    userInfo.fraxVaultEarned,
                    userInfo.crvCvxVaultEarned,
                ],
                proof
            );
            const newFreeBalance = await this.token.balanceOf(owner.address);
            const newVsrBoost = await this.vsr.calculateBoostLevel(owner.address);
            const newBCStaked = await this.bonusCampaign.balanceOf(owner.address);
            const newVexbeBalance = await this.veToken["balanceOf(address)"](owner.address);
            const newLockedAmount = await this.veToken.lockedAmount(owner.address);
            const newLockedEnd = await this.veToken.lockedEnd(owner.address);

            expect(newFreeBalance).to.be.equal(
                BigNumber.from(userInfo.xbeBalance).
                add(BigNumber.from(userInfo.vsrStaked)).
                add(BigNumber.from(userInfo.bcReward)).
                add(BigNumber.from(userInfo.referralReward)).
                add(BigNumber.from(userInfo.sushiVaultEarned)).
                add(BigNumber.from(userInfo.fraxVaultEarned)).
                add(BigNumber.from(userInfo.crvCvxVaultEarned))
            );
            // expect(newVsrBoost).to.be.equal(ethers.utils.parseEther('2.5'));
            expectEqual(newBCStaked, BigNumber.from(userInfo.bcStaked), ethers.utils.parseEther('0.01'), true);
            expect(newVexbeBalance).to.be.gte(ZERO);
            expect(newLockedAmount).to.be.equal(BigNumber.from(userInfo.vexbeLockedAmount));
            expect(newLockedEnd).to.be.gte(BigNumber.from(userInfo.vexbeLockedEnd));

            await expect(this.migrator.connect(owner).migrate(
                [
                    owner.address,
                    userInfo.xbeBalance,
                    userInfo.vsrStaked,
                    userInfo.bcStaked,
                    userInfo.bcReward,
                    userInfo.referralReward,
                    userInfo.vexbeLockedAmount,
                    userInfo.vexbeLockedEnd,
                    userInfo.sushiVaultEarned,
                    userInfo.fraxVaultEarned,
                    userInfo.crvCvxVaultEarned,
                ],
                proof
            )).to.be.revertedWith('already migrated');

        });

        it('should migrate correctly if user have non zero position (not in BC)', async() => {

            const userInfo = xbeInfoSnapshot[alice.address];
            
            const hash = EthCrypto.hash.keccak256([
                { type: "address", value: alice.address },
                { type: "uint256", value: BigNumber.from(userInfo.xbeBalance) },
                { type: "uint256", value: BigNumber.from(userInfo.vsrStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcReward) },
                { type: "uint256", value: BigNumber.from(userInfo.referralReward) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedAmount) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedEnd) },
                { type: "uint256", value: BigNumber.from(userInfo.sushiVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.fraxVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.crvCvxVaultEarned) }
            ]);

            const proof = merkleTree.getHexProof(hash);

            await this.migrator.connect(owner).migrate(
                [
                    alice.address,
                    userInfo.xbeBalance,
                    userInfo.vsrStaked,
                    userInfo.bcStaked,
                    userInfo.bcReward,
                    userInfo.referralReward,
                    userInfo.vexbeLockedAmount,
                    userInfo.vexbeLockedEnd,
                    userInfo.sushiVaultEarned,
                    userInfo.fraxVaultEarned,
                    userInfo.crvCvxVaultEarned,
                ],
                proof
            );
            const newFreeBalance = await this.token.balanceOf(alice.address);
            const newVsrBoost = await this.vsr.calculateBoostLevel(alice.address);
            const newBCStaked = await this.bonusCampaign.balanceOf(alice.address);
            const newVexbeBalance = await this.veToken["balanceOf(address)"](alice.address);
            const newLockedAmount = await this.veToken.lockedAmount(alice.address);
            const newLockedEnd = await this.veToken.lockedEnd(alice.address);

            expect(newFreeBalance).to.be.equal(
                BigNumber.from(userInfo.xbeBalance).
                add(BigNumber.from(userInfo.vsrStaked)).
                add(BigNumber.from(userInfo.bcReward)).
                add(BigNumber.from(userInfo.referralReward)).
                add(BigNumber.from(userInfo.sushiVaultEarned)).
                add(BigNumber.from(userInfo.fraxVaultEarned)).
                add(BigNumber.from(userInfo.crvCvxVaultEarned))
            );
            expect(newBCStaked).to.be.equal(ZERO);
            expect(newVexbeBalance).to.be.gte(ZERO);
            expect(newLockedAmount).to.be.equal(BigNumber.from(userInfo.vexbeLockedAmount));
            expectEqual(newLockedEnd, BigNumber.from(userInfo.vexbeLockedEnd), WEEK, true);


        });


        it('should migrate correctly if user have non zero position (have no lock)', async() => {

            const userInfo = xbeInfoSnapshot[bob.address];
            
            const hash = EthCrypto.hash.keccak256([
                { type: "address", value: bob.address },
                { type: "uint256", value: BigNumber.from(userInfo.xbeBalance) },
                { type: "uint256", value: BigNumber.from(userInfo.vsrStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcReward) },
                { type: "uint256", value: BigNumber.from(userInfo.referralReward) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedAmount) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedEnd) },
                { type: "uint256", value: BigNumber.from(userInfo.sushiVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.fraxVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.crvCvxVaultEarned) }
            ]);

            const proof = merkleTree.getHexProof(hash);

            await this.migrator.connect(owner).migrate(
                [
                    bob.address,
                    userInfo.xbeBalance,
                    userInfo.vsrStaked,
                    userInfo.bcStaked,
                    userInfo.bcReward,
                    userInfo.referralReward,
                    userInfo.vexbeLockedAmount,
                    userInfo.vexbeLockedEnd,
                    userInfo.sushiVaultEarned,
                    userInfo.fraxVaultEarned,
                    userInfo.crvCvxVaultEarned,
                ],
                proof
            );
            const newFreeBalance = await this.token.balanceOf(bob.address);
            const newVsrBoost = await this.vsr.calculateBoostLevel(bob.address);
            const newBCStaked = await this.bonusCampaign.balanceOf(bob.address);
            const newVexbeBalance = await this.veToken["balanceOf(address)"](bob.address);
            const newLockedAmount = await this.veToken.lockedAmount(bob.address);
            const newLockedEnd = await this.veToken.lockedEnd(bob.address);

            expect(newFreeBalance).to.be.equal(
                BigNumber.from(userInfo.xbeBalance).
                add(BigNumber.from(userInfo.vsrStaked)).
                add(BigNumber.from(userInfo.referralReward))
            );
            expect(newBCStaked).to.be.equal(ZERO);
            expect(newVexbeBalance).to.be.equal(ZERO);
            expect(newLockedAmount).to.be.equal(ZERO);
            expect(newLockedEnd).to.be.equal(ZERO);


        });

        it('shouldnt migrate if user already have expired lock in the new protocol', async() => {

            await this.token.connect(owner).mint(owner.address, ethers.utils.parseEther('100'));
            await this.token.connect(owner).approve(this.veToken.address, ethers.utils.parseEther('100'));
            const latest = await time.latest()
            await this.veToken.connect(owner).createLock(ethers.utils.parseEther('100'), +latest.toString() + 10 * 7 * 86400);

            const userInfo = xbeInfoSnapshot[owner.address];
            
            const hash = EthCrypto.hash.keccak256([
                { type: "address", value: owner.address },
                { type: "uint256", value: BigNumber.from(userInfo.xbeBalance) },
                { type: "uint256", value: BigNumber.from(userInfo.vsrStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcReward) },
                { type: "uint256", value: BigNumber.from(userInfo.referralReward) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedAmount) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedEnd) },
                { type: "uint256", value: BigNumber.from(userInfo.sushiVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.fraxVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.crvCvxVaultEarned) }
            ]);

            const proof = merkleTree.getHexProof(hash);

            await time.increase(11 * 7 * 86400);

            await expect(this.migrator.connect(owner).migrate(
                [
                    owner.address,
                    userInfo.xbeBalance,
                    userInfo.vsrStaked,
                    userInfo.bcStaked,
                    userInfo.bcReward,
                    userInfo.referralReward,
                    userInfo.vexbeLockedAmount,
                    userInfo.vexbeLockedEnd,
                    userInfo.sushiVaultEarned,
                    userInfo.fraxVaultEarned,
                    userInfo.crvCvxVaultEarned,
                ],
                proof
            )).to.be.revertedWith('withdraw your lock first');


        });

        it('should migrate correctly if user already have non-expired new lock', async() => {

            await this.token.connect(owner).mint(alice.address, ethers.utils.parseEther('100'));
            await this.token.connect(alice).approve(this.veToken.address, ethers.utils.parseEther('100'));
            const latest = await time.latest()
            await this.veToken.connect(alice).createLock(ethers.utils.parseEther('100'), +latest.toString() + 10 * 7 * 86400);

            const userInfo = xbeInfoSnapshot[alice.address];
            
            const hash = EthCrypto.hash.keccak256([
                { type: "address", value: alice.address },
                { type: "uint256", value: BigNumber.from(userInfo.xbeBalance) },
                { type: "uint256", value: BigNumber.from(userInfo.vsrStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcStaked) },
                { type: "uint256", value: BigNumber.from(userInfo.bcReward) },
                { type: "uint256", value: BigNumber.from(userInfo.referralReward) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedAmount) },
                { type: "uint256", value: BigNumber.from(userInfo.vexbeLockedEnd) },
                { type: "uint256", value: BigNumber.from(userInfo.sushiVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.fraxVaultEarned) },
                { type: "uint256", value: BigNumber.from(userInfo.crvCvxVaultEarned) }
            ]);

            const proof = merkleTree.getHexProof(hash);

            await time.increase(5 * 7 * 86400);

            await this.migrator.connect(owner).migrate(
                [
                    alice.address,
                    userInfo.xbeBalance,
                    userInfo.vsrStaked,
                    userInfo.bcStaked,
                    userInfo.bcReward,
                    userInfo.referralReward,
                    userInfo.vexbeLockedAmount,
                    userInfo.vexbeLockedEnd,
                    userInfo.sushiVaultEarned,
                    userInfo.fraxVaultEarned,
                    userInfo.crvCvxVaultEarned,
                ],
                proof
            );

            const newFreeBalance = await this.token.balanceOf(alice.address);
            const newVsrBoost = await this.vsr.calculateBoostLevel(alice.address);
            const newBCStaked = await this.bonusCampaign.balanceOf(alice.address);
            const newVexbeBalance = await this.veToken["balanceOf(address)"](alice.address);
            const newLockedAmount = await this.veToken.lockedAmount(alice.address);
            const newLockedEnd = await this.veToken.lockedEnd(alice.address);

            expect(newFreeBalance).to.be.equal(
                BigNumber.from(userInfo.xbeBalance).
                add(BigNumber.from(userInfo.vsrStaked)).
                add(BigNumber.from(userInfo.bcReward)).
                add(BigNumber.from(userInfo.referralReward)).
                add(BigNumber.from(userInfo.sushiVaultEarned)).
                add(BigNumber.from(userInfo.fraxVaultEarned)).
                add(BigNumber.from(userInfo.crvCvxVaultEarned))
            );
            expect(newBCStaked).to.be.equal(ZERO);
            expect(newVexbeBalance).to.be.gte(ZERO);
            expect(newLockedAmount).to.be.equal(BigNumber.from(userInfo.vexbeLockedAmount).add(ethers.utils.parseEther('100')));

            const roundedLockEnd = Math.round(+userInfo.vexbeLockedEnd / week) * week;
            expect(newLockedEnd).to.be.equal(roundedLockEnd);



        });

    });


  });



});
