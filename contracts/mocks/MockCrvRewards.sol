// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "../interfaces/IMint.sol";

contract MockCrvRewards is Pausable, ReentrancyGuard, Ownable {

    address public crv;
    address public cvx;

    uint256 public lastTs;

    uint256 public emission = 0.01 ether;

    constructor(address _crv, address _cvx) {
        crv = _crv;
        cvx = _cvx;
        lastTs = block.timestamp;
    }

    function getReward(address _account, bool _flag) external returns(bool) {
        uint256 amount = emission * (block.timestamp - lastTs); 
        IMint(crv).mint(_account, amount);
        IMint(cvx).mint(_account, amount);
        lastTs = block.timestamp;
        return true;
    }

    function withdraw(uint256 _amount, bool _flag) external returns(bool) {
        
    }

}
