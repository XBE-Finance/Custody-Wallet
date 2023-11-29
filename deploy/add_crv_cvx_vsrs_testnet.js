const hre = require("hardhat");
const ethers = hre.ethers;

const { time } = require('@openzeppelin/test-helpers');

const { 
  skipDeploymentIfAlreadyDeployed,
  MINTER_ROLE,
  REGISTRATOR_ROLE,
  rewardsDurationMainnet,
  percentageToBeLocked,
  treasuryFeeBps
} = require('./helpers.js');

const {

} = require('./helpers_ethereum');

const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants.js");

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, execute, save } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("HERE")
  let vault = await deployments.get('CRVcvxCRVHiveVault');
  vault = await ethers.getContractAt(vault.abi, vault.address);
  console.log("HERE1")

  const vsrNames = [
    'CRV_VSR',
    'CVX_VSR',
  ]
  
  let rewardTokenAddresses = [];
  const rewardCount = await vault.rewardsCount();
  for (let i = 0; i < rewardCount - 1; i++) {
    const rewardInfo = await vault.rewards(i + 1);
    const rewardTokenAddress = rewardInfo.rewardToken;
    rewardTokenAddresses.push(rewardTokenAddress);

    const crvVsrConstructorArgs = [
      vault.address,
      rewardTokenAddress,
      (await deployments.get('GovernanceToken')).address,
      rewardsDurationMainnet,
      (await deployments.get('BonusCampaignTest')).address
    ];

    const vsr = await deploy("VotingStakingRewardsForLockersFromVault", {
        from: deployer,
        args: crvVsrConstructorArgs,
        skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
        log: true
      }
    );
    await save(vsrNames[i], vsr);

    // Add new VSR as fee receiver

    await execute(
        'CRVcvxCRVHiveVault',
        {from: deployer},
        'addFeeReceiver',
        vsr.address,
        treasuryFeeBps, // as much as Treasury had
        true, // feeReceiving call needed
        [rewardTokenAddress], 
        [true]
      );

      // Add new VSR as lock event listener
      await execute(
        'LockSubscription',
        {from: deployer},
        'addLockSubscriber',
        vsr.address
      );

      // Add new VSR as unlock event listener
      await execute(
        'LockSubscription',
        {from: deployer},
        'addUnlockSubscriber',
        vsr.address
      );

      // add LockSubscription as registrator
      await execute(
        vsrNames[i],
        {from: deployer, log: true},
        'grantRole',
        REGISTRATOR_ROLE,
        (await deployments.get('LockSubscription')).address
      );

      // add VeToken address to VSR
      await execute(
        vsrNames[i],
        {from: deployer, log: true},
        'setVeToken',
        (await deployments.get('VeTokenTest')).address
      );
  }


  // TURN OFF CRV and CVX fees fo Treasury

  await execute(
    'CRVcvxCRVHiveVault',
    {from: deployer},
    'setFeeReceiversTokensToBeChargedOfFeesMulti',
    [0, 0],
    rewardTokenAddresses,
    [false, false]
  );

  


  
}
module.exports.tags = ["add_crv_cvx_vsrs_testnet"];
