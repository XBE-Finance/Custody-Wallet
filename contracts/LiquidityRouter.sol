pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "./interfaces/IVaultTransfers.sol";

contract LiquidityRouter {
    IWETH public WETH;
    IERC20 public token;
    IUniswapV2Pair  public pair;
    IVaultTransfers  public vault;
    address private smallestTokenAddress;
    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "EXPIRED");
        _;
    }
    constructor(
        address _vaultAddress,
        address _pair,
        address _WETH,
        address _token
    ) {
        pair = IUniswapV2Pair(_pair);
        WETH = IWETH(_WETH);
        token = IERC20(_token);
        vault = IVaultTransfers(_vaultAddress);
        smallestTokenAddress = _WETH < _token ? _WETH : _token;
        pair.approve(address(vault), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    }

    function addLiquidity(uint256 _deadline, uint256 _tokenOutMin)
        public
        payable
        ensure(_deadline)
    {
        require(msg.value > 0, "ZERO_ETH");
        uint256 half = msg.value / 2;
        require(_getAmountToken(half) >= _tokenOutMin, "PRICE_CHANGED");
        uint256 tokenFromSwap = _swapETHforToken(half);
        (
            uint256 liquidityToken,
            uint256 liquidityWETH,
            uint256 lpTokens
        ) = _addLiquidity(tokenFromSwap, half);
        if (tokenFromSwap - liquidityToken > 0)
            token.transfer(msg.sender, tokenFromSwap - liquidityToken);
        if (half - liquidityWETH > 0)
            payable(msg.sender).transfer(half - liquidityWETH);
        vault.depositFor(lpTokens, msg.sender);
    }
    function getMinSwapAmountToken(uint256 _amountETH)
        public
        view
        returns (uint256)
    {
        return _getAmountToken(_amountETH);
    }

    function _swapETHforToken(uint256 _amountETH)
        internal
        returns (uint256 amountToken)
    {
        amountToken = _getAmountToken(_amountETH);
        WETH.deposit{value: _amountETH}();
        WETH.transfer(address(pair), _amountETH);
        (uint256 amount0Out, uint256 amount1Out) = address(WETH) == smallestTokenAddress
            ? (uint256(0), amountToken)
            : (amountToken, uint256(0));
        pair.swap(amount0Out, amount1Out, address(this), new bytes(0));
    }

    function _getAmountToken(uint256 _amountETH) internal view returns (uint256) {
        uint256 reserveETH;
        uint256 reserveToken;
        address(WETH) == smallestTokenAddress ? 
            (reserveETH, reserveToken, ) = pair.getReserves() : 
            (reserveToken, reserveETH, ) = pair.getReserves();
        uint256 amountInWithFee = _amountETH * 998;
        uint256 numerator = amountInWithFee * reserveToken;
        uint256 denominator = reserveETH * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    function _addLiquidity(uint256 _amountTokendesired, uint256 _amountETHdesired)
        internal
        returns (
            uint256 liquidityToken,
            uint256 liquidityETH,
            uint256 lpTokens
        )
    {
        uint256 reserveETH = IERC20(address(WETH)).balanceOf(address(pair));
        uint256 reserveToken = token.balanceOf(address(pair));
        uint256 amountETHOptimal = (_amountTokendesired * reserveETH) /
            reserveToken;
        if (amountETHOptimal <= _amountETHdesired) {
            (liquidityToken, liquidityETH) = (
                _amountTokendesired,
                amountETHOptimal
            );
        } else {
            uint256 amountTokenOptimal = (_amountETHdesired * reserveToken) /
                reserveETH;
            require(amountTokenOptimal <= _amountTokendesired);
            (liquidityToken, liquidityETH) = (
                amountTokenOptimal,
                _amountETHdesired
            );
        }
        token.transfer(address(pair), liquidityToken);
        WETH.deposit{value: liquidityETH}();
        WETH.transfer(address(pair), liquidityETH);
        lpTokens = pair.mint(address(this));
    }
} 