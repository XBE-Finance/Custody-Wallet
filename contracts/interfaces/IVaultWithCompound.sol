// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVaultWithCompound is IERC20 {
    struct UserInfo {
        uint256 amount; // Amount of staked tokens
        int256[] rewardDebts;   // Reward debts for all reward tokens
    }

    struct Reward {
        address rewardToken;    // Reward token address
        uint128 accRewardPerShare;  // Accumulated reward per share
        uint256 lastBalance;    // Balance of this contract at the last moment when pool was updated
        uint256 payedRewardForPeriod;   // Reward amount payed for all the period
    }

    struct FeeReceiver {
        address receiver;   // Address of fee receiver
        uint256 bps; // Amount of reward token for the receiver (in BPs)
        bool isFeeReceivingCallNeeded;  // Flag if the feeReceiving() call needed or not
        mapping(address => bool) isTokenAllowedToBeChargedOfFees;   // Map if fee will be charged on this token
    }

    event Deposit(address indexed user, uint256 amount, address indexed to);
    event Withdraw(address indexed user, uint256 amount, address indexed to);
    event Staked(address indexed user, uint256 amount, address indexed to);
    event Wrapped(address indexed user, uint256 amount, address indexed to);
    event Unwrapped(address indexed user, uint256 amount, address indexed to);
    event Harvest(address indexed user, uint256[] amounts);
    event LogUpdatePool(uint256 lpSupply, uint256[] rewardsPerPeriod);
    event NewRewardToken(address newToken);


    function depositFor(
        uint256 _amount, 
        address _to, 
        uint256 _amountOutMin, 
        uint256 _deadline,
        uint256 _amountLPMin 
    ) external;
    function withdraw(
        uint amount, 
        address _to,
        uint256 _amountOutMin, 
        uint256 _deadline,
        uint256 _amountLPMin
    ) external;
    function earned(address _user, uint256 _index) view external returns (uint256 pending);
    function getReward(address user) external;
    function getReward(
        address _to,
        uint256 _amountOutMin, 
        uint256 _deadline,
        uint256 _amountLPMin
    ) external; 
    function userInfo(address user) view external returns(uint256);
    function deleteAllFeeReceivers() external;
    function addFeeReceiver(
        address _receiver,
        uint256 _bps,
        bool _isFeeReceivingCallNeeded,
        address[] calldata _rewardsTokens,
        bool[] calldata _statuses
    ) external;
    function rewardsCount() external view returns(uint256);
    function setFeeReceiverAddress(uint256 _index, address _receiver) external;
    function setFeeReceiverBps(uint256 _index, uint256 _bps) external;
    function setFeeReceiversCallNeeded(uint256 _index, bool _isFeeReceivingCallNeeded) external;
    function setFeeReceiversTokensToBeChargedOfFees(uint256 _index, address _rewardsToken, bool _status) external;
    function setFeeReceiversTokensToBeChargedOfFeesMulti(
        uint256[] calldata _indices,
        address[] calldata _rewardsTokens,
        bool[] calldata _statuses
    ) external;
    function setInflation(address _inflation) external;
    function setGauge(address _gauge, address[] memory _gaugeRewardTokens) external;
    function setReferralProgram(address _refProgram) external;
    function setVotingStakingRewards(address _vsr) external;
    function setOnGetRewardFeesEnabled(bool _isEnabled) external;
    function setDepositFeeBps(uint256 _bps) external;
    function setDepositFeeReceiver(address _receiver) external;
    function configure() external;
    function getRewardDebt(address _account, uint256 _index) external view returns(int256);
    function addRewardToken(address _newToken) external;
    function updatePool() external;
    function stakeFor(uint256 _amount, address _to) external;
    function unwrap(uint256 _amount, address _to) external;
    function withdrawAndHarvest(uint256 _amount, address _to) external;

    function totalStaked() view external returns(uint256); 
    function inflation() view external returns(address); 
    function gaugeAddress() view external returns(address); 
    function startTime() view external returns(uint256); 
    function stakeToken() view external returns(address); 
    function referralProgram() view external returns(address); 
    function votingStakingRewards() view external returns(address); 
    function rewards(uint256 index) view external returns(Reward memory); 
    function feeReceiversLength() view external returns(uint256); 
    function isGetRewardFeesEnabled() view external returns(bool); 
    function depositFeeBps() view external returns(uint256); 
    function depositFeeReceiver() view external returns(address); 

    function rewardDelegates(address) view external returns(address); 
    function boosterAddress() view external returns(address); 
    function poolIndex() view external returns(uint256); 
    function crvRewardAddress() view external returns(address); 
    function cvxRewardAddress() view external returns(address); 
    function cvxAddress() view external returns(address); 
    function crvAddress() view external returns(address); 
    function curvePool() view external returns(address); 
    function setDelegate(address, address) external; 
    function getRewardForDelegator(address) external; 
    function getMinAmountOut(uint16 _tolerance) external view returns(uint256);
    function getMinLPAmount(uint256 _amountOutMin, uint16 _tolerance) view external returns(uint256);
    function depositUnderlyingTokensFor(
        uint256[2] memory _amounts, 
        uint256 _min_mint_amount, 
        address _to,
        uint256 _amountOutMin, 
        uint256 _deadline
    ) external;



}
