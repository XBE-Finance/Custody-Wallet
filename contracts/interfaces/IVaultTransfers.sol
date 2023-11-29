pragma solidity ^0.8.2;

interface IVaultTransfers {

    function depositFor(uint256, address) external;
    function withdraw(uint256, address) external;
    function getReward(address) external;
    function withdrawAndHarvest(uint256, address) external;
    function stakeFor(uint256, address) external;
    function unwrap(uint256, address) external;
    function earned(address token, address account) external view returns (uint256);

}