// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../interfaces/IMint.sol";
import "../interfaces/curve/ICurveCRVFactory.sol";

contract CurveCRVFactoryMock is ICurveCRVFactory {

    address public crvAddress;
    uint256 public emission;
    mapping(address => uint256) public lastTs;

    constructor (address _crvAddress, uint256 _emission) {
        crvAddress = _crvAddress;
        emission = _emission;
    }

    function addGauge(address _gauge) external {
        lastTs[_gauge] = block.timestamp;
    }

    function mint(address _gauge) external {
        IMint(crvAddress).mint(_gauge, emission * (block.timestamp - lastTs[_gauge]));
        lastTs[_gauge] = block.timestamp;
    }
}
