// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "./base/BaseVault.sol";
import "./../interfaces/curve/ICurve3CryptoGauge.sol";
import "./../interfaces/curve/ICurveCRVFactory.sol";


contract CurveVault is BaseVault {
    using SafeERC20 for IERC20;

    address public gaugeAddress;    // Gauge address

    /**
    * @param _rewardToken reward token
    * @param _stakeToken stake token (LP)
    * @param _inflation Inflation address
    * @param _name LP Vault token name
    * @param _symbol LP Vault token symbol
    * @param _referralProgramAddress Referral program contract address
    * @param _gaugeAddress Gauge contract address (can be zero address)
    */
    constructor(
        address _rewardToken,
        IERC20 _stakeToken,
        address _inflation,
        string memory _name,
        string memory _symbol,
        address _referralProgramAddress,
        address _gaugeAddress,
        uint256 _percentageToBeLocked,
        address _veTokenAddress
    ) BaseVault(
        _rewardToken,
        _stakeToken,
        _inflation,
        _name,
        _symbol,
        _referralProgramAddress,
        _percentageToBeLocked,
        _veTokenAddress
    ) {
        gaugeAddress = _gaugeAddress;
    }

    /**
    * @notice Sets gauge
    * @dev Can be called only by owner
    * @param _gauge New gauge address
    */
    function setGauge(address _gauge, address[] memory _gaugeRewardTokens) external onlyOwner {
        gaugeAddress = _gauge;
        Reward memory rewardTokenInfo = rewards[0];
        delete rewards;
        // we should keep current reward parameters for the main reward token
        rewards.push(
            Reward(
                IInflation(inflation).token(),
                rewardTokenInfo.accRewardPerShare,
                rewardTokenInfo.lastBalance,
                rewardTokenInfo.payedRewardForPeriod
                )
            );
        for (uint256 i; i < _gaugeRewardTokens.length; i++) {
            rewards.push(Reward(_gaugeRewardTokens[i], 0, 0, 0));
        }
    }

    function _getEarnedAmountFromExternalProtocol(address _user, uint256 _index) internal override returns(uint256 vaultEarned) {
        address gauge = gaugeAddress;
        Reward[] memory _rewards = rewards;
        if (_index == 1 && gauge != address(0)) { // index == CRV index
            ICurveCRVFactory(ICurve3CryptoGauge(gauge).factory()).mint(address(gauge)); // claim CRV
        } else if (_index > 1 && gauge != address(0) && _index < ICurve3CryptoGauge(gauge).reward_count() + 2) {
            vaultEarned = ICurve3CryptoGauge(gauge).claimable_reward(address(this), _rewards[_index].rewardToken);
        }
    }

    function _harvestFromExternalProtocol() internal override {
        address gauge = gaugeAddress;
        if (gauge != address(0)) {
            ICurveCRVFactory(ICurve3CryptoGauge(gauge).factory()).mint(address(gauge)); // claim CRV
            ICurve3CryptoGauge(gauge).claim_rewards(); // claim all other rewards
        }
    }

    function _depositToExternalProtocol(uint256 _amount, address _from) internal override {
        IERC20 stake = stakeToken;
        address gauge = gaugeAddress;
        if (_from != address(this)) stake.safeTransferFrom(_from, address(this), _amount);
        if (gauge != address(0)) {
            stake.safeApprove(gauge, _amount);
            ICurve3CryptoGauge(gauge).deposit(_amount);
        }
    }

    function _withdrawFromExternalProtocol(uint256 _amount, address _to) internal override {
        address gauge = gaugeAddress;
        if (gauge != address(0)) ICurve3CryptoGauge(gauge).withdraw(_amount);
        stakeToken.safeTransfer(_to, _amount);
    }

}
