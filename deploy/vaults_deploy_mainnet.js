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
  groupsOfConstructorsArgumentsForVaultsMainnet,
  ZERO,
  ONE,
  treasuryInflationWeight,
  rewardTokensArtifactsNamesMainnet,
  crvTokenAddressMainnet,
  cvxTokenAddressMainnet
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

  // groupsOfConstructorsArgumentsForVaultsMainnet[0][1] = (await deployments.get("MockSushiLP")).address;
  
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
  
  let rewardTokensAddresses = [];
  rewardTokensAddresses.push((await deployments.get('GovernanceToken')).address)
  rewardTokensAddresses.push(crvTokenAddressMainnet);
  rewardTokensAddresses.push(cvxTokenAddressMainnet);

  for (let i = 0; i < groupsOfConstructorsArgumentsForVaultsMainnet[0].length; i++) {

    let hiveVaultConstructorArgs = [];
    if (network == 'fantom') {
      hiveVaultConstructorArgs = [
        tokenAddress,
        groupsOfConstructorsArgumentsForVaultsMainnet[0][i],
        inflationAddress,
        groupsOfConstructorsArgumentsForVaultsMainnet[1][i],
        groupsOfConstructorsArgumentsForVaultsMainnet[2][i],
        refProgramAddress,
        groupsOfConstructorsArgumentsForVaultsMainnet[3][i],
      ];
    } else if (network == 'ethereum' || network == 'ethereum_current') {


      if (i == 0) {
        hiveVaultConstructorArgs = 
          [
            [
              tokenAddress, // _rewardToken
              groupsOfConstructorsArgumentsForVaultsMainnet[0][0],  // _stakeToken
              inflationAddress, // _inflation
              groupsOfConstructorsArgumentsForVaultsMainnet[1][0],  // _name
              groupsOfConstructorsArgumentsForVaultsMainnet[2][0],  // _symbol
              refProgramAddress,  // _referralProgramAddress
              groupsOfConstructorsArgumentsForVaultsMainnet[3][0],  //_boosterAddress
              groupsOfConstructorsArgumentsForVaultsMainnet[9][0],  //_poolIndex
              groupsOfConstructorsArgumentsForVaultsMainnet[7][0],  //_crvRewardAddress
              groupsOfConstructorsArgumentsForVaultsMainnet[10][0],  // _curvePool
              groupsOfConstructorsArgumentsForVaultsMainnet[13][0],  // _percentageToBeLocked
              veTokenAddress
            ]
            // groupsOfConstructorsArgumentsForVaultsMainnet[11][0],  // cvxAddress
            // groupsOfConstructorsArgumentsForVaultsMainnet[12][0],  // uniswapRouter
          ]
      } else if (i == 1) {
        hiveVaultConstructorArgs = 
          [
            tokenAddress,
            groupsOfConstructorsArgumentsForVaultsMainnet[0][1],
            inflationAddress,
            groupsOfConstructorsArgumentsForVaultsMainnet[1][1],
            groupsOfConstructorsArgumentsForVaultsMainnet[2][1],
            refProgramAddress,
            ZERO_ADDRESS,
            groupsOfConstructorsArgumentsForVaultsMainnet[13][1],  // _percentageToBeLocked
            veTokenAddress

          ]
  
      }


    }
    
    const artifactName = groupsOfConstructorsArgumentsForVaultsMainnet[6][i];
    console.log(artifactName)
    const hiveVault = await deploy(artifactName, {
        from: deployer,
        args: hiveVaultConstructorArgs,
        skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
        log: true
      }
    );
    console.log('here')
    await save(groupsOfConstructorsArgumentsForVaultsMainnet[4][i], hiveVault);

    let oldWeights = [];
    let callConfigs = [];
    let newWeight;

    const currentReceiversCount = await inflation.receiversCount();

    if (i == groupsOfConstructorsArgumentsForVaultsMainnet[0].length - 1) {
      oldWeights.push(treasuryInflationWeight);
      oldWeights.push(gnosisInflationWeight);
      for (let j = 0; j < groupsOfConstructorsArgumentsForVaultsMainnet[0].length - 1; j++) {
        oldWeights.push(groupsOfConstructorsArgumentsForVaultsMainnet[5][j]);
      }
      newWeight = groupsOfConstructorsArgumentsForVaultsMainnet[5][i];
      callConfigs = Array(oldWeights.length).fill(false);
    } else {
      oldWeights = Array(currentReceiversCount).fill(1);
      newWeight = 10000 - currentReceiversCount.toString();
      callConfigs = Array(currentReceiversCount).fill(false);
    }

    console.log("hiveVault.address = ", hiveVault.address)
    console.log("newWeight = ", newWeight)
    console.log("oldWeights = ", oldWeights)
    console.log("callConfigs = ", callConfigs)
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
    
    let ifTokenAllowedToBeChargedOfFees = Array(rewardTokensAddresses.length).fill(true);

    await execute(
      groupsOfConstructorsArgumentsForVaultsMainnet[4][i],
      {from: deployer},
      'addFeeReceiver',
      (await deployments.get("Treasury")).address,
      treasuryFeeBps,
      false,
      rewardTokensAddresses,
      ifTokenAllowedToBeChargedOfFees
    );


    await execute(
      groupsOfConstructorsArgumentsForVaultsMainnet[4][i],
      {from: deployer},
      'addFeeReceiver',
      (await deployments.get("ReferralProgram")).address,
      referralFeeBps,
      true,
      rewardTokensAddresses,
      ifTokenAllowedToBeChargedOfFees
    );

    await execute(
      groupsOfConstructorsArgumentsForVaultsMainnet[4][i],
      {from: deployer},
      'setOnGetRewardFeesEnabled',
      true
    );

    console.log("here0")

    for (let j = 1; j < rewardTokensAddresses.length; j++) {
      await execute(
        groupsOfConstructorsArgumentsForVaultsMainnet[4][i],
        {from: deployer},
        'addRewardToken',
        rewardTokensAddresses[j]
      );
    }


    console.log("here1")

  }

  const vaultsAddresses = [];
  for (let i = 0; i < artifactsNamesForVaults.length; i++) {
    vaultsAddresses.push((await deployments.get(artifactsNamesForVaults[i])).address);
  }

  console.log("here2")


  await execute(
    'ReferralProgram',
    {from: deployer, log: true},
    'setFeeDistributors',
    vaultsAddresses
  );
  console.log("here3")
  


  await execute(
    'ReferralProgram',
    {from: deployer, log: true},
    'setRewardTokens',
    rewardTokensAddresses
  );

  console.log("here4")

}
module.exports.tags = ["vaults_deploy_mainnet"];
