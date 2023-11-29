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
  groupsOfConstructorsArgumentsForVaultsTestnet,
  ZERO,
  ONE,
  treasuryInflationWeight,
  gnosisInflationWeight,
  rewardTokensArtifactsNamesTestnet
} = require('./helpers.js');

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
    if (argv.network === "rinkeby") {
      network = 'rinkeby'
    } else if (argv.network === "goerli") {
      network = 'goerli'
    }
    network = process.env.FORK_NETWORK;
  }
  
  this.booster = await deployments.get('MockBooster');
  this.booster = await ethers.getContractAt('IBooster', this.booster.address);

  for (let i = 0; i < groupsOfConstructorsArgumentsForVaultsTestnet[0].length; i++) {

    let hiveVaultConstructorArgs = [];
    if (network == 'fantom') {
      hiveVaultConstructorArgs = [
        tokenAddress,
        groupsOfConstructorsArgumentsForVaultsTestnet[0][i],
        inflationAddress,
        groupsOfConstructorsArgumentsForVaultsTestnet[1][i],
        groupsOfConstructorsArgumentsForVaultsTestnet[2][i],
        refProgramAddress,
        groupsOfConstructorsArgumentsForVaultsTestnet[3][i],
      ];
    } else if (network == 'ethereum' || network == 'rinkeby' || network == 'goerli' ) {

      if (i == 0) {
        hiveVaultConstructorArgs = 
          [
            [
              tokenAddress, // _rewardToken
              (await deployments.get('MockCurveLP')).address,  // _stakeToken
              inflationAddress, // _inflation
              groupsOfConstructorsArgumentsForVaultsTestnet[1][0],  // _name
              groupsOfConstructorsArgumentsForVaultsTestnet[2][0],  // _symbol
              refProgramAddress,  // _referralProgramAddress
              (await deployments.get('MockBooster')).address,  //_boosterAddress
              0,  //_poolIndex
              (await deployments.get('MockCrvRewards')).address,  //_crvRewardAddress
              (await deployments.get('MockCurvePoolCvxCrvCrv')).address,  // _curvePool
              groupsOfConstructorsArgumentsForVaultsTestnet[13][0],  // _percentageToBeLocked
              veTokenAddress
            ]
          ]
      } else if (i == 1) {
        hiveVaultConstructorArgs = 
          [
            tokenAddress,
            (await deployments.get('MockSushiLP')).address,
            inflationAddress,
            groupsOfConstructorsArgumentsForVaultsTestnet[1][1],
            groupsOfConstructorsArgumentsForVaultsTestnet[2][1],
            refProgramAddress,
            ZERO_ADDRESS,
            groupsOfConstructorsArgumentsForVaultsTestnet[13][1],  // _percentageToBeLocked
            veTokenAddress

          ]
  
      }

    }
    
    const artifactName = groupsOfConstructorsArgumentsForVaultsTestnet[6][i];
    console.log("artifactName = ", artifactName)
    console.log("groupsOfConstructorsArgumentsForVaultsTestnet[6] = ", groupsOfConstructorsArgumentsForVaultsTestnet[6])
    console.log("hiveVaultConstructorArgs = ", hiveVaultConstructorArgs)

    const hiveVault = await deploy(artifactName, {
        from: deployer,
        args: hiveVaultConstructorArgs,
        skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
        log: true
      }
    );
    await save(groupsOfConstructorsArgumentsForVaultsTestnet[4][i], hiveVault);

    console.log(`${groupsOfConstructorsArgumentsForVaultsTestnet[4][i]} deployed`);

    // this.crvCvxCrvHiveVault = await deployments.get(groupsOfConstructorsArgumentsForVaultsTestnet[4][i]);
    // this.crvCvxCrvHiveVault = await ethers.getContractAt('ICurveCrvCvxCrvPool', this.crvCvxCrvHiveVault.address);

    // console.log("coin 0 = ", await this.crvCvxCrvHiveVault.coins(0));
    // console.log("coin 1 = ", await this.crvCvxCrvHiveVault.coins(1));


    let oldWeights = [];
    let callConfigs = [];
    let newWeight;

    const currentReceiversCount = await inflation.receiversCount();
    console.log("i = ", i)
    console.log("currentReceiversCount = ", currentReceiversCount)
    console.log("groupsOfConstructorsArgumentsForVaultsTestnet[0].length = ", groupsOfConstructorsArgumentsForVaultsTestnet[0].length)
    if (i == groupsOfConstructorsArgumentsForVaultsTestnet[0].length - 1) {
      oldWeights.push(treasuryInflationWeight);
      oldWeights.push(gnosisInflationWeight);
      for (let j = 0; j < groupsOfConstructorsArgumentsForVaultsTestnet[0].length - 1; j++) {
        oldWeights.push(groupsOfConstructorsArgumentsForVaultsTestnet[5][j]);
      }
      newWeight = groupsOfConstructorsArgumentsForVaultsTestnet[5][i];
      callConfigs = Array(oldWeights.length).fill(false);
    } else {
      oldWeights = Array(currentReceiversCount).fill(1);
      newWeight = 10000 - currentReceiversCount.toString();
      callConfigs = Array(currentReceiversCount).fill(false);
    }

    console.log("newWeight = ", newWeight);
    console.log("oldWeights = ", oldWeights);
    console.log("callConfigs = ", callConfigs);
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
    

    console.log("here");
    await execute(
      'VeTokenTest',
      {from: deployer, log: true},
      'setAllowedToActWithoutPermission',
      hiveVault.address,
      true
    );
    
    let rewardTokensAddresses = [];
    for (let i = 0; i < rewardTokensArtifactsNamesTestnet.length; i++) {
      rewardTokensAddresses.push((await deployments.get(rewardTokensArtifactsNamesTestnet[i])).address);
    }
    // Array.from({length: rewardTokensArtifactsNamesTestnet.length}, async (_, i) => {
    //   (await deployments.get(rewardTokensArtifactsNamesTestnet[i])).address
    // });
    

    let ifTokenAllowedToBeChargedOfFees = Array(rewardTokensArtifactsNamesTestnet.length).fill(true);
      await execute(
        groupsOfConstructorsArgumentsForVaultsTestnet[4][i],
        {from: deployer, log: true},
        'addFeeReceiver',
        (await deployments.get("Treasury")).address,
        treasuryFeeBps,
        false,
        rewardTokensAddresses,
        ifTokenAllowedToBeChargedOfFees
      );
    


    await execute(
      groupsOfConstructorsArgumentsForVaultsTestnet[4][i],
      {from: deployer, log: true},
      'addFeeReceiver',
      (await deployments.get("ReferralProgram")).address,
      referralFeeBps,
      true,
      rewardTokensAddresses,
      ifTokenAllowedToBeChargedOfFees
    );

    await execute(
      groupsOfConstructorsArgumentsForVaultsTestnet[4][i],
      {from: deployer, log: true},
      'setOnGetRewardFeesEnabled',
      true
    );
    

    for (let j = 1; j < rewardTokensAddresses.length; j++) {  
      await execute(
        groupsOfConstructorsArgumentsForVaultsTestnet[4][i],
        {from: deployer, log: true, gasLimit: 1e6},
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
    for (let i = 0; i < rewardTokensArtifactsNamesTestnet.length; i++) {
      rewardTokensAddresses.push((await deployments.get(rewardTokensArtifactsNamesTestnet[i])).address);
    }

  await execute(
    'ReferralProgram',
    {from: deployer, log: true},
    'setRewardTokens',
    rewardTokensAddresses
  );
}
module.exports.tags = ["vaults_deploy_testnet"];
