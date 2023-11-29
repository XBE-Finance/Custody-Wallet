// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IMint.sol";
import "./interfaces/IAutoStakeFor.sol";
import "./interfaces/IVeToken.sol";
import "./interfaces/IBonusCampaign.sol";

contract MerkleTreeDispenser is Pausable, Ownable {

    mapping(uint256 => PoolInfo) public pools;
    mapping(address => mapping(uint256 => UserInfo)) public users;

    uint256 public poolCount;
    address public tokenAddress;
    address public bonusCampaign;
    address public vsr;
    address public veToken;

    uint256 private pauseDuration;
    uint256 private lastPauseBlock;

    struct PoolInfo {
        uint256 totalNumberOfBlocks;
        uint256 startBlock;
        bytes32 merkleRoot;
    }

    struct UserInfo {
        uint256 assigned;
        uint256 payed;
        uint256 lastBlock;
        uint256 lastPaused;
        bool lockVested;
    }

    event NewPool(uint256 totalAmount);
    event NewUser(address account, uint256 poolId, uint256 totalUserAmount, bool lock);
    event Claimed(address account, uint256 poolId, uint256 amount);

    constructor(
        address _tokenAddress,
        address _bonusCampaign,
        address _vsr,
        address _veToken
    ) {
        require(_tokenAddress != address(0), "token address is zero");
        tokenAddress = _tokenAddress;
        bonusCampaign = _bonusCampaign;
        vsr = _vsr;
        veToken = _veToken;
    }

    function addPool(
        uint256 _totalNumberOfBlocks,
        bytes32 _merkleRoot
    )
        external
        onlyOwner
        whenNotPaused
    {
        require(_totalNumberOfBlocks > 0, "incorrect duration");
        pools[poolCount++] = PoolInfo(
            _totalNumberOfBlocks,
            block.number,
            _merkleRoot
        );
        emit NewPool(_totalNumberOfBlocks);
    }

    function pause() external onlyOwner {
        lastPauseBlock = block.number;
        _pause();
    }

    function unpause() external onlyOwner {
        pauseDuration += block.number - lastPauseBlock;
        _unpause();
    }

    /**
    * @notice Claims available Token for the user proportional to time passed from 
    * the beginning for the first time, if valid Merkle proof was provided
    * @param _poolId Pool ID
    * @param _totalUserAmount Total amount of Token assigned to user
    * @param _proof Merkle proof for the user
    * @param _lock If user choses to lock all his vested tokens and participate in Bonus Campaign
    */
    function claim(
        uint256 _poolId,
        uint256 _totalUserAmount,
        bytes32[] memory _proof,
        bool _lock
    ) external whenNotPaused {
        require(users[_msgSender()][_poolId].lastBlock == 0, "already registered");
        PoolInfo memory pool = pools[_poolId];
        require(MerkleProof.verify(
            _proof,
            pool.merkleRoot,
            keccak256(abi.encodePacked(_msgSender(), _totalUserAmount))
        ), "incorrect proof");
        uint256 currentPauseDuration = pauseDuration;

        if (_lock) {
            require(block.number < pool.startBlock + pool.totalNumberOfBlocks, "too late to lock");
            users[_msgSender()][_poolId] = UserInfo(_totalUserAmount, _totalUserAmount, block.number, currentPauseDuration, _lock);
            IMint(tokenAddress).mint(address(this), _totalUserAmount);
            _lockForUser(_msgSender(), _totalUserAmount);
            IBonusCampaign(bonusCampaign).registerFor(_msgSender());
        } else {
            (uint256 toPay, ) = _calculateReward(currentPauseDuration, UserInfo(_totalUserAmount, 0, pool.startBlock, 1, _lock), pool);
            users[_msgSender()][_poolId] = UserInfo(_totalUserAmount, toPay, block.number, currentPauseDuration, _lock);
            IMint(tokenAddress).mint(_msgSender(), toPay);
            emit Claimed(_msgSender(), _poolId, toPay);
        }
        emit NewUser(_msgSender(), _poolId, _totalUserAmount, _lock);
    }

    function claim(uint256 _poolId) external whenNotPaused {
        UserInfo memory user = users[_msgSender()][_poolId];
        require(user.lastBlock != 0, "not registered");
        require(!user.lockVested, "user chose to lock");
        PoolInfo memory pool = pools[_poolId];
        require(user.payed < user.assigned, "already payed");
        uint256 currentPauseDuration = pauseDuration;
        (uint256 toPay, uint256 finishBlock) = _calculateReward(currentPauseDuration, user, pool);
        if (block.number < finishBlock) users[_msgSender()][_poolId].lastPaused = currentPauseDuration;
        users[_msgSender()][_poolId].payed += toPay;
        users[_msgSender()][_poolId].lastBlock = block.number;
        IMint(tokenAddress).mint(_msgSender(), toPay);
        emit Claimed(_msgSender(), _poolId, toPay);
    }

    function pendingReward(uint256 _poolId, address _account) external view returns(uint256) {
        UserInfo memory user = users[_account][_poolId];
        PoolInfo memory pool = pools[_poolId];
        uint256 currentPauseDuration = pauseDuration;
        (uint256 reward, ) = _calculateReward(currentPauseDuration, user, pool);
        return reward;
    }

    function pendingReward(uint256 _poolId, uint256 _totalUserAmount) external view returns(uint256) {
        PoolInfo memory pool = pools[_poolId];
        uint256 currentPauseDuration = pauseDuration;
        (uint256 reward, ) = _calculateReward(currentPauseDuration, UserInfo(_totalUserAmount, 0, pool.startBlock, 1, false), pool);
        return reward;
    }

    function _calculateReward(
        uint256 _currentPauseDuration,
        UserInfo memory _user,
        PoolInfo memory _pool
    )
        internal
        view
        returns(
            uint256 toPay,
            uint256 finishBlock
        )
    {
        finishBlock = _pool.startBlock + _pool.totalNumberOfBlocks + _currentPauseDuration;
        if (block.number >= finishBlock) {
            toPay = _user.assigned - _user.payed;
        } else {
            toPay = _user.assigned * (block.number - _user.lastBlock - _currentPauseDuration + _user.lastPaused) / _pool.totalNumberOfBlocks;
        }

    }

    function _lockForUser(
        address _user,
        uint256 _amount
    )
        internal
    {
        address vsr_ = vsr;
        address veToken_ = veToken;
        address tokenAddress_ = tokenAddress;
        IERC20(tokenAddress_).approve(vsr_, 0);
        IERC20(tokenAddress_).approve(vsr_, _amount);
        IAutoStakeFor(vsr_).stakeFor(_user, _amount);
        IVeToken veToken__ = IVeToken(veToken_);
        // if user has no lock yet, a lock will be created (createLockFor)
        // if user already has a lock, a lock will updated (increaseAmountFor and increaseUnlockTimeFor)
        // if user has an expired lock, he/she will have to withdraw first (VeToken.withdraw)
        uint256 maxtime = veToken__.MAXTIME();
        uint256 WEEK = veToken__.WEEK();
        uint256 endLockTime = block.timestamp + maxtime;
        if (veToken__.lockedAmount(_user) == 0) {
            veToken__.createLockFor(_user, _amount, endLockTime);
        } else {
            veToken__.increaseAmountFor(_user, _amount);
            if (veToken__.lockedEnd(_user) < endLockTime / WEEK * WEEK) veToken__.increaseUnlockTimeFor(_user, endLockTime);
        }
    }
}
