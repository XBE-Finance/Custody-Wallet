// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";



contract MockVault is ERC20, Pausable, ReentrancyGuard, Ownable {

    address stakeToken;

    constructor(address _stakeToken) ERC20("Mock Vault", "MV") {
        stakeToken = _stakeToken;
    }

    function depositFor(uint256 _amount, address _to) public {
        ERC20(stakeToken).transferFrom(msg.sender, address(this), _amount);
        _mint(_to, _amount);
    }

    function earned(address _token, address _account) external view returns(uint256) {
        return balanceOf(_account) * 10;
    }

}
