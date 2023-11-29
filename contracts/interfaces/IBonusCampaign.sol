// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IBonusCampaign {
    function bonusEmission() external view returns(uint256);
    function startMintTime() external view returns(uint256);
    function rewardsDuration() external view returns(uint256);
    function stopRegisterTime() external view returns(uint256);
    function registered(address) external view returns(bool);
    function registerFor(address) external;
    function balanceOf(address) external view returns(uint256);
}