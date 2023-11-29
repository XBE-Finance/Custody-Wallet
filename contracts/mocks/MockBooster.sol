// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "../interfaces/IMint.sol";
import "../interfaces/IBooster.sol";

contract MockBooster is IBooster, Pausable, ReentrancyGuard, Ownable {

    address lpToken;

    constructor(address _lpToken) {
        lpToken = _lpToken;
    }

    function withdraw(uint256 _pid, uint256 _amount) external override returns (bool) {
        IERC20(lpToken).transfer(msg.sender, _amount);
        return true;
    }

    function depositAll(uint256 _pid, bool _stake) external override returns (bool) {
        uint256 balance = IERC20(lpToken).balanceOf(msg.sender);
        IERC20(lpToken).transferFrom(msg.sender, address(this), balance);
        return true;
    }   

    function deposit(
        uint256 _pid,
        uint256 _amount,
        bool _stake
    ) external returns (bool) {
        return true;
    }

    function poolInfo(uint256 _index) external view returns (PoolInfo memory) {}

    function poolLength() external view returns (uint256) {}
        

}
