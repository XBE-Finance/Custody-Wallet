# XB3 Smart Contracts docs
## GovernanceToken

### General Description:
The contract of the ERC20 token. It’s Pausable, Mintable and Burnable. Addresses in the corresponding lists (implemented via AccessControl) can pause and mint, everybody can burn.

## LockSubscription

### General description:
Is an auxiliary contract that notifies the listeners that something happened on the event source contract. By default there is only one source, VeXB3. The listeners are BonusCampaign and VotingStakingRewardsForLockers, which listen for Lock and Unlock events

### Read function:
1. **eventSource()** - returns the event source address
2. **lockSubscribersCount()** - returns the number of Lock event listeners
3. **unlockSubscribersCount()** - returns the number of Unlock event listeners
4. **lockSubscriberAt(uint256 index)** - gives the listener of the Lock event at the index
5. **unlockSubscriberAt(uint256 index)** - gives the listener of the Unlock event at the index

### Write function:
1. **setEventSource(address _eventSource)** - set event source
2. **addLockSubscriber(address s)** - adds the listener of the Lock event
3. **addUnlockSubscriber(address s)** - adds the listener of the Unlock event
4. **removeLockSubscriber(address s)** - removes the listener of the Lock event
5. **removeUnlockSubscriber(address s)** - removes the listener of the Unlock event
6. **pause()** - pauses the contract. While paused, the contract will reverse during the alert
7. **unpause()** - unpause the contract
8. **processLockEvent(address account, uint256 lockStart, uint256 lockEnd, uint256 amount)** - calls the event source to alert all the listeners about the Lock event
9. **processUnlockEvent(address account, uint256 lockStart, uint256 lockEnd, uint256 amount)** - calls the event source to alert all the listeners about the Unlock event

## Treasury

### General description:
The contract stores some portion of reward tokens in the system (including XB3), converts them to XB3 if needed and transfer them to VSR to distribute it between users. Some authorized person or backend can call toVoters to convert specific reward tokens to XB3 (via purchase on uniswap or its equivalent), and immediately send them to VSR for further distribution

### Read functions:
1. **uniswapRouter()** - returns exchanger router address
2. **rewardsDistributionRecipientContract()** - reward recipient contract (by default it is VSR)
3. **rewardsToken()** - reward token contract address (default is XB3)
4. **authorized(address _account)** - returns a boolean indicating if the specified address can call toVoters
5. **tokensToConvertCount()** - the number of tokens coming to the treasury as reward tokens, but which are not XB3
6. **tokensToConvertAt(uint256 _index)** - returns token address
7. **isTokenAllowedToConvert(address _tokenAddress)** - checks if _tokenAddress is in the list of award tokens

### Write functions:
1. **setRewardsToken(address _rewardsToken)** - sets reward token
2. **setRewardsDistributionRecipientContract(address _rewardsDistributionRecipientContract)** - set award recipient contract address
3. **setAuthorized(address _authorized, bool _status)** - set/remove authorized status from address
4. **addTokenToConvert(address _tokenAddress)** - adds a new reward token
5. **removeTokenToConvert(address _tokenAddress)** - removes reward token
6. **toGovernance(address _tokenAddress, uint256 _amount)** - transfer any token in any amount to owner 

## VeToken

### General Description:  

The contract is almost a copy of VeCRV - the Curve governance token. It defines the value of a user's XB3 lock and allows the user to participate in a bonus campaign. The more XB3 the user locks (and thus has VeToken), the more boost he/she will get. The XB3 unlock date will be rounded up to a week, with a minimum lock period of 1 week and a maximum of 100 weeks. The VeTokens are not transferable.

The contract balance linearly decreases over time down to zero (at the time XB3 is unlocked).

### Read function:
1. **minLockDuration()** - get minimum lock value in seconds (default is 1 week)
2. **supply()** - get amount of locked XB3
3. **locked(address _account)** - returns LockedBalance object for specified user. Fields of the object:
    * amount - amount of locked funds
    * end - unlock timestamp
4. **epoch()** - returns epoch (week)
5. **pointHistory(uint256 epoch)** - auxiliary function. Returns information about a point in history in a specified epoch.
6. **userPointHistory(address _user, uint256 _epoch) is an auxiliary function. Returns information about a point in history in the specified epoch for the specified user
7. **userPointEpoch(address _user)** - auxiliary function
8. **slopeChanges(uint256 _epoch)** - auxiliary function, monitors a slope changes
9. **votingStakingRewards()** - VSR address
10. **registrationMediator()** - LockSubscription address
11. **allowedToActWithoutPermission (address _account)** - returns boolean which shows if the specified address can act without user's access
12. **name()** - name of token
13. **symbol()** - token symbol
14. **version()** - token version
15. **decimals()** - token decimals
16. **admin()** - address of the current admin
17. **futureAdmin()** - address of the future admin
18. **actionAllowance(address _user, address _account)** - allow action from one address to another 
19. **MAXTIME()** - max lock time (100 weeks by default)
20. **getLastUserSlope(address addr)** - get last recorded slope of the balance for the specified user
21. **userPointHistoryTs(address addr, uint256 idx)** - get timestamp of checkpoint at index idx for specified user
22. **lockedEnd(address addr)** - get unlock timestamp for the specified user
23. **lockStarts(address addr)** - returns timestamp of the moment when the lock was made
24. **lockedAmount(address addr)** - get current lock value
25. **findBlockEpoch(uint256 _block, uint256 maxEpoch)** - binary search the timestamp of the specified block. maxEpoch - number of epoch to search for
26. **balanceOf(address addr)** - get current balance of the specified address
27. **balanceOf(address addr, uint256 _t)** - get the balance of the specified address at the moment _t
28. **balanceOfAt(address addr, uint256 _block)** - get the balance of the specified address in the block _block
29. **supplyAt(Point memory point, uint256 t)** - find out total amount of blocked tokens at the moment t. point - point from which to start search
30. **totalSupply()** - shows the current totalSupply (same as supply())
31. **lockedSupply()** - the same as supply()
32. **totalSupply(uint256 t)** - find out totalSupply at time t
33. **totalSupplyAt(uint256 _block)** - find out totalSupply in the block with the number _block.

### Write functions:
1. **createLock(uint256 _value, uint256 _unlockTime)** - locks _value tokens for period_unlockTime. Should be called if the user doesn't have a lock already
2. **createLockFor(address _for, uint256 _value, uint256 _unlockTime)** - locks _value for the period _unlockTime for the user _for if the user has previously approved this action, or if the caller is in the list of allowed contracts
3. **increaseAmount(uint256 _value)** - increases the number of locked tokens, does not change the lock time
4. **increaseAmountFor(address _account, uint256 _value)** - increases the number of blocked tokens for the specified user if the user has allowed it or the contract is in the list of allowed contracts, does not change the locking period
5. **depositFor(address _addr, uint256 _value)** - the function is identical to increaseAmountFor
6. **increaseUnlockTime(uint256 _unlockTime)** - increases the locking time, does not change the number of tokens
7. **increaseUnlockTimeFor(address _account, uint256 _unlockTime)** - increases the locking time for the specified user if the user has allowed it or the contract is in the list of allowed contracts, does not change the number of tokens
8. **withdraw()** - unlocks all the available tokens if the unlock time has come
9. **setMinLockDuration(uint256 _minLockDuration)** - sets the minimum lock period
10. **setAllowedToActWithoutPermission(address _allowedAddress, bool _status)** - set whether the specified address can lock without user permission
11. **setVotingStakingRewards(address _votingStakingRewards)** - set VSR address
12. **commitTransferOwnership(address addr)** - propose a new admin
13. **applyTransferOwnership()** - accept the candidacy of the new admin
14. **checkpoint()** - write the current information to the checkpoint

##BonusCampaign
### General description:
The contract signs a user up for a bonus campaign to receive additional rewards. Registering for the campaign can be done by locking XB3 for the maximum duration (2 years), or by locking in your vesting tokens from the Merkle Tree dispenser (if at Fantom network). **Registering for the bonus campaign gives the user the constant boost for all the period, as well as it allows user to receive an additional reward from BonusCampaign contract

### Read function:
1. **rewardsDistribution()** - the address of the rewards dispenser (zero address by default)
2. **rewardsToken()** - XB3 token address
3. **stakingToken()** - VeToken token address
4. **periodFinish()** - timestamp of the reward distribution
5. **rewardRate()** - reward rate (remaining reward / time left)
6. **rewardsDuration()** - reward distribution period (2 years by default)
7. **lastUpdateTime()** - timestamp of the last reward claim
8. **rewardPerTokenStored()** - the helper function 
9. **userRewardPerTokenPaid(address _account)** - helper function 
10. **rewards(address _account)** - amount of reward paid for the specified user
11. **totalSupply()** - how many XB3 are staked in the bonus campaign
12. **balanceOf(address account)** - returns how many XB3 the specified user has staked
13. **rewardPerToken()** - helper function. Calculates the reward per token
14. **percentageToBeLocked()** - current percentage to be locked on claim
15. **earned(address account)** - shows how much reward is available to the user right now
16. **getRewardForDuration()** - returns the amount of reward available for the whole duration of the campaign
17. **bonusEmission()** - the same as getRewardForDuration
18. **startMintTime()** - bonus campaign start time 
19. **stopRegisterTime()** - timestamp of moment, after which registration in the campaign will be unavailable
20. **registered(address _account)** - returns boolean which shows if specified address is registered or not
21. **lastTimeRewardApplicable()** - helper function
22. **canRegister(address account)** - returns a boolean which indicates whether the specified address can register or not
23. **hasMaxBoostLevel(address account)** - returns a boolean which indicates whether the specified address has the maximum boost or not

### Write functions:
1. **setRewardsDistribution(address _rewardsDistribution)** - sets the new address of the rewards distributor. Redundant function
2. **getReward()** - claim current reward
3. **pause()** - pauses the contract
4. **unpause()** - unpauses the contract 
5. **startMint()** - starts bonus campaign
6. **processLockEvent(address account, uint256 lockStart, uint256 lockEnd, uint256 amount)** - processes lock event, registers the user in the campaign if he can register
7. **registerFor(address account)** - registers account in the bonus campaign
8. **register()** - registers caller in bonus campaign

## Inflation
### General description:
Inflation contract controls the XB3 minting to various recipients. It gradually mints the XB3 tokens and distributes them between recipients according to their weights until the target is reached. Owner can add new receiver, remove the existing one and reconfigure the receivers at any moment. Receivers can call the getToken() function to get its portion. Or somebody can call it for them. The weights distribution system has a feature that the sum of all weights must always be equal to 10000. That means, when a receiver is added/removed, the owner should specify the weights for all the other receivers

### Write functions:
1. **addReceiver(address _newReceiver, uint256 _weightForNew, bool _callConfigureForNew, uint256[] memory _weightsForOld, bool[] memory _callConfigureForOld)** - adds XB3 recipient with specified address (_newReceiver) and specified weight (_weightForNew). _callConfigureForNew - to call configure() or not, _weightsForOld - array of old weights, _callConfigureForOld - array of flags if configure functions need to be called
2. **removeReceiver(address _receiver, bool _callConfigure, uint256[] memory _newWeights, bool[] memory _newCallConfigure)** - removes specified receiver. _newWeights - new weights for the remaining receivers
3. **reconfigureReceivers(uint256[] memory _weights, bool[] memory _callConfigure)** - reconfigure receivers with new weights
4. **getToken(address _account)** - mint all the available XB3 and transfer the portion of it to the specified receiver
5. **getToken(address[] memory _accounts)** - mint all the available XB3 and transfer the portions of it to the specified receivers
6. **getToken()** - mint all the available XB3 and transfer it to all receivers

### Read function:
1. **token()** - XB3 token address
2. **totalMinted()** - how many XB3s are minted already
3. **targetMinted()** - how many XB3s are going to be minted
4. **periodicEmission()** - how many XB3s are minted per period (per second by default)
5. **startInflationTime()** - timestamp of minting start
6. **lastTs()** - timestamp of the last mint
7. **periodDuration()** - period duration (1 second by default)
8. **weights(address _account)** - weight of the specified XB3 recipient
9. **available(address _amount)** - available XB3 amount for specified address (not include potential earns due to time member, go get the full available amount use ‘claimable’ function)
10. **availableSupply()** - same as totalMinted
11. **receiversCount()** - the number of XB3 receivers
12. **receiverAt(uint256 index)** - receivers at index
13. **getAllReceivers()** - get the array for all receivers
14. **claimable(address _receiver)** - all available amount of XB3 for specified address

## VotingStakingRewardsForLockers

### General description:
The contract distributes XB3 reward to XB3 lockers. It listens to lock/unlock events and deposit/withdraw the user in the reward distribution campaign. The user’s stakes can be boosted if the user has a boost. The boost is calculated by the following formula:
    B = 1 + 1.5 * veBalance / (lockedAmount + xb3Balance)
So the user has the max boost if he/she locked ALL available XB3 for max period of time. It distributes the reward in the following way:
20% of the XB3 reward just transferred to the user. 80% of all the reward are locked for the user. If the user has no lock yet, it will be created for him, 80% of the reward will be locked to the end of the distribution program (2 years). That means if a user claims in 1 year after the start, his 80% will be locked for 1 year. If there is an already existing and non-expired lock, 80% of the reward will be just added to user’s amount without changing the lock period. If there is already the lock which is expired, user will have to withdraw it first

If the reward distribution program is over (2 years passed), then user will just get his 100% XB3 reward

### Write functions:
1. **notifyRewardAmount(uint256 reward)** - Used to notify the contract when a new portion of reward is added. It can only be called by the distributor of the reward (by default it is Treasury). Will be called immediately after the reward is transferred to the contract
2. **setPercentageToBeLocked(uint256 _percentageToBeLocked)** - set the percentage to be locked (by default it is 80)
3. **getReward()** - claims the available reward
4. **setRewardsDistribution(address _rewardsDistribution)** - change the reward distributor address
5. **setBoostLogicProvider(address _bonusCampaign)** - sets the address of the BonusCampaign
6. **setVeToken(address _newVeToken)** - set VeToken address
7. **processLockEvent(address _account, uint256 _lockStart, uint256 _lockEnd, uint256 _amount)** - used to process lock event from the VeToken contract. Deposits the specified amount for user in the staking
8. **processWitdrawEvent(address _account, uint256 _amount)** - used to process withdraw event from the VeToken contract. Withdraws all the tokens from the staking

### Read function:
1. **rewardsToken()** - returns reward token address (by default it is XB3)
2. **stakingToken()** - returns the address of stake token (by default it is XB3)
3. **periodFinish()** - timestamp when the current reward distribution stops
4. **rewardRate()** - the current reward rate, i.e. the amount of the available reward, divided by the remaining time period
5. **rewardsDuration()** - the period of time during which the next portion of the reward will be issued
6. **veToken()** - VeToken address
7. **bonusCampaign()** - BonusCampaign address
8. **lastUpdateTime()** - the timestamp of the last reward update
9. **rewardPerTokenStored()** - helper function
10. **rewardsDistribution()** - address of the Treasury
11. **totalSupply()** - total amount of XB3
12. **balanceOf(address account)** - the amount of XB3 staked by the specified address
13. **calculateBoostLevel(address account)** - returns the current boost level of the account
14. **lastTimeRewardApplicable()** - helper function
15. **earned(address account)** - returns the amount of bounty available to the user at the moment
16. **potentialXB3Returns(uint256 duration, address account)** - helper function

## LiquidityRouter:
### General description:
The contract is needed to automate the process of exchanging ETH into XB3, depositing liquidity into the pair and depositing the received LP tokens into a vault.

### Write function:
1. **addLiquidity(uint256 _deadline, uint256 _tokenOutMin)** - adds liquidity to the WETH/XB3 pair and deposits the LP tokens received into vault

### Read function:
1. **WETH()** - address of Wrapped ETH
2. **token()** - address of XB3
3. **pair()** - address of the WETH/XB3 pair
4. **vault()** - vault address
5. **getMinSwapAmountToken(uint256 _amountETH)** - gives minimum amount of XB3 that will be received by swap to _amountETH / 2 ETH

## ReferralProgram
### General description:
The contract implements the functionality of a three-level referral programm. The referrer gets 70% of all commissions from actions performed by the user, the second level referrer gets 20%, the third level referrer gets 10%. If there is no referrer, the inviter is a contract Treasury. As well as the VotingStakingRewardsForLockers contract it distributes the reward in “80/20” way (see above)

### Read function:
1. **users(address _account)** - displays information about the specified user (whether he is registered or not and invitor address)
2. **rewards(address _account, address _token)** - how much reward in the specified token the specified user can collect
3. **distribution(uint256 index)** - percentage distribution for all levels of referrals
4. **tokens(uint256 index)** - tokens, considered as rewards
5. **distributors(uint256 index)** - list of addresses, that pays commissions (by default they are vaults)
6. **rootAddress()** - root address (by default it is Treasury)
7. **getTokensList()** - get array of addresses of reward tokens
8. **getDistributionList()** - get an array of commission distributors addresses

### Write function:
1. **setFeeDistributors(address[] memory _distributors)** - set commission distributors
2. **setRewardTokens(address[] memory _rewardTokens)** - set reward tokens
3. **registerUser(address referrer, address referral)** - register referrer and set referrer as invitor
4. **registerUser(address referrer)** - register yourself and set referrer as the inviter
5. **feeReceiving(address _for, address _token, uint256 _amount)** - function called when  reward is received
6. **claimRewardsFor(address userAddr)** - claims rewards for the specified user
7. **claimRewards()** - claims rewards
8. **claimRewardsForRoot()** - claims rewards for the root (Treasury)
9. **changeDistribution(uint256[] calldata newDistribution)** - change the interest distribution for the invitees
10. **addNewToken(address tokenAddress)** - adds new token as a reward

## ConvexVault
### General description
The contract implements a MasterChef-like staking functionality - the user stakes LP tokens there and receives a reward. At the same time, the LP tokens are staked into the third-party protocol (in this case it’s Convex for Curve’s cvxCRV/CRV pool), the vault mints the appropriate number of its own LP token which represents the share of the user in staking. When a user withdraws, underlying LP tokens are unstacked from the 3rd party protocol and Vault’s LPs are burned. Due to the fact that the holder of Vault’s LPs earns the rewards, the delegator functionality was implemented. That means, that owner can delegate reward receiving so some wallet can claim the reward for some other account.

User can stake in underlying tokens also (in cvxCRV or CRV), not only in cvxCRV/CRV LPs

Every time a reward is collected, a portion goes to the ReferralProgram contract, and the Treasury. As well as the VotingStakingRewardsForLockers and ReferralProgram contracts it distributes the reward in “80/20” way (see above)

### Read function:
1. **totalStaked()** - how many LP tokens were staked
2. **inflation()** - the address of the Inflation contract  
3. **boosterAddress()** - the Convex Booster contract address  
4. **poolIndex()** - the index of cvxCRV/CRV pool in Convex Booster  
5. **crvRewardAddress()** - Convex’s CRVReward contract address
6. **curvePool()** - the address of Curve’s cvxCRV/CRV pool
7. **percentageToBeLocked()** - the current percentage to be locked
8. **veToken()** - VeToken address
9. **coins(uint256 index)** - the list of Curve’s cvxCRV/CRV pool’s coins 
10. **startTime()** - start timestamp of vault launch
11. **stakeToken()** - stake LP token address
12. **referralProgram()** - referral program address
13. **votingRewards()** - VSR address
14. **rewards(uint256 index)** - array of all rewards tokens (rewards(0) = XB3)
15. **feeReceivers(uint256 index)** - recipients of rewards commissions
16. **feeReceiversLength()** - the number of commission recipients from the rewards
17. **isGetRewardFeesEnabled()** - whether the commission is charged from the reward
18. **depositFeeBps()** - the amount of the commission from the reward in BPs
19. **depositFeeReceiver()** - address of the recipient of commissions during deposit (by default they are switched off)
20. **userInfo(address _user)** - returns information about username _user in object UserInfo, that has fields amount - amount of XB3, and auxiliary array rewardDebts[]
21. **rewardsCount()** - amount of reward tokens
22. **getRewardDebt(address _account, uint256 _index)** - get rewardDebts[_index] item for specified user
23. **earned(address _user, uint256 _index)** - returns number of available reward token under index _index for the specified username _user

### Write function
1. **deleteAllFeeReceivers()** - removes all of the reward recipients
2. **addFeeReceiver(address _receiver, uint256 _bps, bool _isFeeReceivingCallNeeded, address[] calldata _rewardsTokens, bool[] calldata _statuses)** - add new commission recipient. Args:
 * _receiver - address of the new recipient
 * _bps - amount of commission in BPs
 * _isFeeReceivingCallNeeded - whether feeReceiving() should be called when transferring commission
 * _rewardsTokens - which reward tokens to transfer to the recipient
 * _statuses - array of flags equal in size to the array of tokens, which shows if a particular reward token should be transferred
3. **setFeeReceiverAddress(uint256 _index, address _receiver)** - change the address of the reward recipient
4. **setFeeReceiverBps(uint256 _index, uint256 _bps)** - change amount of commission for the recipient with index _index
5. **setFeeReceiversCallNeeded(uint256 _index, bool _isFeeReceivingCallNeeded)** - set status for feeReceiving() call
6. **setFeeReceiversTokensToBeChargedOfFees(uint256 _index, address _rewardsToken, bool _status)** - change status of isTokenAllowedToBeChargedOfFees for the recipient with index _index and for token with address _rewardsToken
7. **setFeeReceiversTokensToBeChargedOfFeesMulti(uint256[] calldata _indices,address[], calldata _rewardsTokens, bool[] calldata _statuses)** - same as setFeeReceiversTokensToBeChargedOfFees, but for multiple tokens
8. **setInflation(address _XB3Inflation)** - set Inflation address
9. **setReferralProgram(address _refProgram)** - set referral program address
10. **setVotingStakingRewards(address _vsr)** - set address of VSR
11. **setOnGetRewardFeesEnabled(bool _isEnabled)** - set permission to charge commissions for receiving rewards
12. **setDepositFeeBps(uint256 _bps)** - set amount of commission on deposit
13. **setDepositFeeReceiver(address _receiver)** - set the recipient of commission from the deposit
14. **configure()** - configure vault
15. **addRewardToken(address _newToken)** - add reward token to vault
16. **updatePool()** - update reward pool
17. **depositFor(uint256 _amount, address _to)** - deposit LP tokens for user _to in amount of _amount
18. **withdraw(uint256 _amount, address _to)** - withdraw your LP tokens from gauge, get VLPs
19. **getReward(address _to)** - withdraw reward for user _to
20. **withdrawAndHarvest(uint256 _amount, address _to)** - same as withdraw and getReward called together
21. **setDelegate(address _baseReceiver, address _delegate)** - set the delegate for some account (_baseReceiver)
22. **getRewardForDelegator(address _baseReceiver)** - get reward for the delegate
23. **depositUnderlyingTokensFor(uint256[2] memory _amounts, uint256 _min_mint_amount, address _to)** - make a deposit in underlying tokens (cvxCRV or CRV or both). They will be converted to cvxCRV/CRV LPs tokens

## MerkleTreeDispenser
The MerkleTreeDispenser contract allows you to create multiple pools to distribute a specified token (XBF) to users on the whitelist. The whitelist is a set of <address - amount> pairs, denoting how many tokens should be distributed to this or that user. For each user, the reward specified in the list will gradually became available for claim every new block, according to the duration of the campaign. For example, if a pool has been created that lasts 100 blocks, and a user has 1000 tokens available there, then after mining 30 blocks the user will have exactly 300 (30%) tokens available for claim. All 1000 tokens will be available after 100 blocks.

The MerkleTreeAirdrop pattern is used to gas-efficiently distribute the reward to an arbitrary number of users. To start a new reward distribution campaign, owner has to call the addPool(uint256 totalNumberOfBlocks, bytes32 merkleRoot) function and pass the campaign duration in terms of blocks (totalNumberOfBlocks) and the Merkle tree root (merkleRoot) built on the <address - amount> pairs from the corresponding list as arguments. The campaign starts immediately after this function is called. Owner can create as many such pools as you want. No one can change the root of the Merkle tree after creating a pool. The contract does not store XBF, it mints it when the user calls the claim() function.

The claim() function has two overloads:
1) claim(uint256 poolId, uint256 totalUserAmount, bytes32[] memory proof)
2) claim(uint256 poolId)

The first one must be used by users who have never collected a reward from the specified pool (poolId) before, so that they can register themselves in the pool with poolId and collect the first portion of the reward. They have to pass the so-called Merkle proof as an argument (proof), so that the contract can check if the caller's address really is in the list and that he specified the correct number of tokens, which are assigned to him/her (totalUserAmount). All subsequent times, the user can call the claim(uint256 poolId) function, specifying only the pool number where he/she wants to get the reward. Since the user and the number of tokens assigned to him are already known to the contract, there is no need to pass MerkleProof again.

To find out the user's current available amount of reward, you can call one of the pendingReward() overloads:
1) pendingReward(uint256 poolId, address account);
2) pendingReward(uint256 poolId, uint256 totalUserAmount)

The first one shows the available reward for for already registered user (account). The second one calculates the currently available reward, based on the totalUserAmount specified (user needs to specify the number of tokens the user has). The second one should be called by unregistered users.

Contract is pausable. It can only be paused by the owner. When the contract is paused, no one can call any of the claim() overloads, and owner cannot add new pools with addPool(). The reward isn't distributed during the pause period and the final block number is shifted when contract is  paused. For example, if a reward-distribution campaign is from block 1 to block 100, but a pause that lasted 10 blocks was called on block 30, the company will end at block 110, with users receiving the same amount of reward that they should according to the list.
