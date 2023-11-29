// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IMint.sol";
import "../interfaces/curve/ICurveCrvCvxCrvPool.sol";

contract MockVotingStakingRewards {

  mapping(address => uint256) public balanceOf;

  function earned(address _account) external view returns(uint256) {
    return balanceOf[_account] * 10;
  }

  function deposit(address _account, uint256 _amount) external {
    balanceOf[_account] += _amount;
  }

}
