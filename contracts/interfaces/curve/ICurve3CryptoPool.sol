// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface ICurve3CryptoPool {
  function add_liquidity(
    uint256[3] memory _amounts,
    uint256 _min_mint_amount
  ) external returns(uint256);
}
