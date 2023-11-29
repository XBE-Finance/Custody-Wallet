const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants.js");
const { BigNumber } = require("ethers");
const hre = require("hardhat");
const yargs = require("yargs");
const { inflation } = require("../test/ConvexVault.test.js");


const {
  skipDeploymentIfAlreadyDeployed,
  artifactsNamesForVaults,
  treasuryFeeBps,
  referralFeeBps,
  walletFeeBps,
  groupsOfConstructorsArgumentsForVaultsLocal,
  ZERO,
  ONE,
  treasuryInflationWeight,
  rewardTokensArtifactsNamesLocal
} = require('./helpers.js');
const { gnosisInflationWeight } = require("./helpers_ethereum.js");

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const inflationAddress = (await deployments.get("Inflation")).address;
  const inflationAbi = (await deployments.get("Inflation")).abi;
  const inflation = new ethers.Contract(inflationAddress, inflationAbi, ethers.provider);

  const refProgramAddress = (await deployments.get("ReferralProgram")).address;
  const veTokenAddress = (await deployments.get("VeToken")).address;
  const tokenAddress = (await deployments.get("GovernanceToken")).address;

  // groupsOfConstructorsArgumentsForVaultsLocal[0][1] = (await deployments.get("MockSushiLP")).address;
  
  const argv = yargs
  .option("network", {
    type: "string",
    default: "hardhat",
  })
  .help(false)
  .version(false).argv;

  let network;
  if (argv.network.indexOf("fantom") != -1) {
    network = "fantom";
  } else {
    network = process.env.FORK_NETWORK;
  }
  
  this.booster = await deployments.get('Booster');
  this.booster = await ethers.getContractAt('IBooster', this.booster.address);

  for (let i = 0; i < groupsOfConstructorsArgumentsForVaultsLocal[0].length; i++) {

    let hiveVaultConstructorArgs = [];
    if (network == 'fantom') {
      hiveVaultConstructorArgs = [
        tokenAddress,
        groupsOfConstructorsArgumentsForVaultsLocal[0][i],
        inflationAddress,
        groupsOfConstructorsArgumentsForVaultsLocal[1][i],
        groupsOfConstructorsArgumentsForVaultsLocal[2][i],
        refProgramAddress,
        groupsOfConstructorsArgumentsForVaultsLocal[3][i],
      ];
    } else if (network == 'ethereum' || network == 'ethereum_current') {


      if (i == 0) {
        hiveVaultConstructorArgs = 
          [
            [
              tokenAddress, // _rewardToken
              groupsOfConstructorsArgumentsForVaultsLocal[0][0],  // _stakeToken
              inflationAddress, // _inflation
              groupsOfConstructorsArgumentsForVaultsLocal[1][0],  // _name
              groupsOfConstructorsArgumentsForVaultsLocal[2][0],  // _symbol
              refProgramAddress,  // _referralProgramAddress
              groupsOfConstructorsArgumentsForVaultsLocal[3][0],  //_boosterAddress
              groupsOfConstructorsArgumentsForVaultsLocal[9][0],  //_poolIndex
              groupsOfConstructorsArgumentsForVaultsLocal[7][0],  //_crvRewardAddress
              groupsOfConstructorsArgumentsForVaultsLocal[10][0],  // _curvePool
              groupsOfConstructorsArgumentsForVaultsLocal[13][0],  // _percentageToBeLocked
              veTokenAddress
            ]
            // groupsOfConstructorsArgumentsForVaultsLocal[11][0],  // cvxAddress
            // groupsOfConstructorsArgumentsForVaultsLocal[12][0],  // uniswapRouter
          ]
      } else if (i == 1) {
        hiveVaultConstructorArgs = 
          [
            tokenAddress,
            groupsOfConstructorsArgumentsForVaultsLocal[0][1],
            inflationAddress,
            groupsOfConstructorsArgumentsForVaultsLocal[1][1],
            groupsOfConstructorsArgumentsForVaultsLocal[2][1],
            refProgramAddress,
            ZERO_ADDRESS,
            groupsOfConstructorsArgumentsForVaultsLocal[13][1],  // _percentageToBeLocked
            veTokenAddress

          ]
  
      }


    }
    
    const artifactName = groupsOfConstructorsArgumentsForVaultsLocal[6][i];

    const hiveVault = await deploy(artifactName, {
        from: deployer,
        args: hiveVaultConstructorArgs,
        skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
        log: true
      }
    );
    await save(groupsOfConstructorsArgumentsForVaultsLocal[4][i], hiveVault);

    let oldWeights = [];
    let callConfigs = [];
    let newWeight;

    const currentReceiversCount = await inflation.receiversCount();

    if (i == groupsOfConstructorsArgumentsForVaultsLocal[0].length - 1) {
      oldWeights.push(treasuryInflationWeight);
      oldWeights.push(gnosisInflationWeight);
      for (let j = 0; j < groupsOfConstructorsArgumentsForVaultsLocal[0].length - 1; j++) {
        oldWeights.push(groupsOfConstructorsArgumentsForVaultsLocal[5][j]);
      }
      newWeight = groupsOfConstructorsArgumentsForVaultsLocal[5][i];
      callConfigs = Array(oldWeights.length).fill(false);
    } else {
      oldWeights = Array(currentReceiversCount).fill(1);
      newWeight = 10000 - currentReceiversCount.toString();
      callConfigs = Array(currentReceiversCount).fill(false);
    }

    await execute(
      'Inflation',
      {from: deployer},
      'addReceiver',
      hiveVault.address,
      newWeight,
      true,
      oldWeights,
      callConfigs
    );

    await execute(
      'VeToken',
      {from: deployer, log: true},
      'setAllowedToActWithoutPermission',
      hiveVault.address,
      true
    );

    let rewardTokensAddresses = [];
    for (let i = 0; i < rewardTokensArtifactsNamesLocal.length; i++) {
      rewardTokensAddresses.push((await deployments.get(rewardTokensArtifactsNamesLocal[i])).address);
    }
    // Array.from({length: rewardTokensArtifactsNamesLocal.length}, async (_, i) => {
    //   (await deployments.get(rewardTokensArtifactsNamesLocal[i])).address
    // });
    

    let ifTokenAllowedToBeChargedOfFees = Array(rewardTokensArtifactsNamesLocal.length).fill(true);

    await execute(
      groupsOfConstructorsArgumentsForVaultsLocal[4][i],
      {from: deployer},
      'addFeeReceiver',
      (await deployments.get("Treasury")).address,
      treasuryFeeBps,
      false,
      rewardTokensAddresses,
      ifTokenAllowedToBeChargedOfFees
    );


    await execute(
      groupsOfConstructorsArgumentsForVaultsLocal[4][i],
      {from: deployer},
      'addFeeReceiver',
      (await deployments.get("ReferralProgram")).address,
      referralFeeBps,
      true,
      rewardTokensAddresses,
      ifTokenAllowedToBeChargedOfFees
    );

    await execute(
      groupsOfConstructorsArgumentsForVaultsLocal[4][i],
      {from: deployer},
      'setOnGetRewardFeesEnabled',
      true
    );


    for (let j = 1; j < rewardTokensAddresses.length; j++) {
      await execute(
        groupsOfConstructorsArgumentsForVaultsLocal[4][i],
        {from: deployer},
        'addRewardToken',
        rewardTokensAddresses[j]
      );
    }


  }

  const vaultsAddresses = [];
  for (let i = 0; i < artifactsNamesForVaults.length; i++) {
    vaultsAddresses.push((await deployments.get(artifactsNamesForVaults[i])).address);
  }

  await execute(
    'ReferralProgram',
    {from: deployer, log: true},
    'setFeeDistributors',
    vaultsAddresses
  );

  let rewardTokensAddresses = [];
    for (let i = 0; i < rewardTokensArtifactsNamesLocal.length; i++) {
      rewardTokensAddresses.push((await deployments.get(rewardTokensArtifactsNamesLocal[i])).address);
    }

  await execute(
    'ReferralProgram',
    {from: deployer, log: true},
    'setRewardTokens',
    rewardTokensAddresses
  );
}
module.exports.tags = ["vaults_deploy_local"];
