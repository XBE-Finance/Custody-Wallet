// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IMint.sol";
import "../interfaces/curve/ICurveCrvCvxCrvPool.sol";

contract MockCurvePoolCvxCrvCrv is ICurveCrvCvxCrvPool {

    address[2] private _coins;
    address public lpToken;

    constructor(
        address _crv,
        address _cvxCrv,
        address _lpToken
    ) {
        lpToken = _lpToken;
        _coins[0] = _crv;
        _coins[1] = _cvxCrv;
    }

    function add_liquidity(
    uint256[2] memory _amounts,
    uint256 _min_mint_amount
  ) external override returns(uint256) {
    if (_amounts[0] > 0) IERC20(_coins[0]).transferFrom(msg.sender, address(this), _amounts[0]);
    if (_amounts[1] > 0) IERC20(_coins[1]).transferFrom(msg.sender, address(this), _amounts[1]);
    IMint(lpToken).mint(msg.sender, _amounts[0] + _amounts[1]);
  }

  function coins(
    uint256 index
  ) external view returns(address) {
    return _coins[index];
  }

}
