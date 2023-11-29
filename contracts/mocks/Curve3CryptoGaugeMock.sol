// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../interfaces/curve/ICurveCRVFactory.sol";
import "../interfaces/curve/ICurve3CryptoGauge.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Curve3CryptoGaugeMock {

    address public factory;
    address public crvAddress;
    address public lpToken;
    uint256 public totalStaked;
    mapping (address => uint256) public balances;

    constructor (address _factory, address _crvAddress, address _lpToken) {
        factory = _factory;
        crvAddress = _crvAddress;
        lpToken = _lpToken;
    }

    function reward_count() external view returns(uint256) {
        return 0;
    }
    function deposit(uint amount) external {
        IERC20(lpToken).transferFrom(msg.sender, address(this), amount);
        totalStaked += amount;
        balances[msg.sender] += amount;
    }
    function claimable_tokens(address _user) public returns(uint256) {
        uint256 balanceBefore = IERC20(crvAddress).balanceOf(address(this));
        ICurveCRVFactory(factory).mint(address(this));
        uint256 balanceAfter = IERC20(crvAddress).balanceOf(address(this));
        return (balanceAfter - balanceBefore) * balances[_user] / totalStaked;
    }

    function claimable_reward(address _user, address _reward_token) view external returns(uint256) {
        return 0;
    }

    function claim_rewards() external {}
    
    function withdraw(uint amount) external {
        IERC20(lpToken).transfer(msg.sender, amount);
        totalStaked -= amount;
        balances[msg.sender] -= amount;
    }

}
