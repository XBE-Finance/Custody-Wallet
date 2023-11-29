// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface ICurve3CryptoGauge {
    function reward_count() external view returns(uint256);
    function deposit(uint amount) external;
    function claimable_tokens(address _user) view external returns(uint256);
    function claimable_reward(address _user, address _reward_token) view external returns(uint256);
    function claim_rewards() external;
    function withdraw(uint amount) external;
    function factory() view external returns(address);

}
