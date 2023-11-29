const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants.js");
const hre = require("hardhat");
const ethers = hre.ethers;

const { skipDeploymentIfAlreadyDeployed, percentageToBeLocked } = require('./helpers.js');

module.exports = async ({
    getNamedAccounts,
    deployments
  }) => {

  const { deploy, save, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const treasuryAddress = (await deployments.get('Treasury')).address;
  const veTokenAddress = (await deployments.get('VeToken')).address;

  const refProgramConstructorArgs = [
    treasuryAddress,
    percentageToBeLocked,
    veTokenAddress,
    ZERO_ADDRESS
  ];
  const refProgram = await deploy("ReferralProgram", {
      from: deployer,
      args: refProgramConstructorArgs,
      skipIfAlreadyDeployed: skipDeploymentIfAlreadyDeployed,
      log: true
    }
  );

  await save('ReferralProgram', refProgram);

  
  await execute(
    'VeToken',
    {from: deployer, log: true},
    'setAllowedToActWithoutPermission',
    refProgram.address,
    true
  );
  

}
module.exports.tags = ["ref_program_deploy"];
// module.exports.dependencies = ["treasury_deploy"];
