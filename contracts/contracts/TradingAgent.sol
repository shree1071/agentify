// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TradingAgent
 * @notice Non-custodial AI trading agent contract
 * @dev Users maintain full control of their funds. AI only suggests trades.
 * 
 * ARCHITECTURE RULES:
 * 1. AI NEVER holds funds or private keys
 * 2. Users sign ALL transactions
 * 3. Smart contract enforces limits and slippage
 * 4. All trades are logged on-chain
 */

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
    
    function WETH() external pure returns (address);
}

contract TradingAgent is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // ===========================================
    // State Variables
    // ===========================================
    
    /// @notice Uniswap V2 Router address
    IUniswapV2Router02 public immutable uniswapRouter;
    
    /// @notice WETH address for ETH swaps
    address public immutable WETH;
    
    /// @notice Maximum trade amount per user (in wei)
    mapping(address => uint256) public maxTradeLimit;
    
    /// @notice Default max trade limit (10 ETH)
    uint256 public defaultMaxTradeLimit = 10 ether;
    
    /// @notice Minimum slippage tolerance (0.5% = 50)
    uint256 public constant MIN_SLIPPAGE = 50; // 0.5%
    
    /// @notice Maximum slippage tolerance (5% = 500)
    uint256 public constant MAX_SLIPPAGE = 500; // 5%
    
    /// @notice Trade execution deadline (5 minutes)
    uint256 public constant DEADLINE_DURATION = 5 minutes;
    
    /// @notice Paused state for emergency
    bool public paused;
    
    // ===========================================
    // Events
    // ===========================================
    
    event TradeExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );
    
    event EmergencyWithdraw(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event MaxTradeLimitUpdated(
        address indexed user,
        uint256 newLimit
    );
    
    event ContractPaused(bool isPaused);
    
    // ===========================================
    // Errors
    // ===========================================
    
    error ContractIsPaused();
    error ExceedsMaxTradeLimit();
    error InvalidSlippage();
    error InvalidPath();
    error InsufficientBalance();
    error TransferFailed();
    error ZeroAmount();
    
    // ===========================================
    // Modifiers
    // ===========================================
    
    modifier whenNotPaused() {
        if (paused) revert ContractIsPaused();
        _;
    }
    
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert ZeroAmount();
        _;
    }
    
    // ===========================================
    // Constructor
    // ===========================================
    
    /**
     * @notice Initialize the trading agent
     * @param _router Uniswap V2 Router address
     */
    constructor(address _router) Ownable(msg.sender) {
        require(_router != address(0), "Invalid router");
        uniswapRouter = IUniswapV2Router02(_router);
        WETH = uniswapRouter.WETH();
    }
    
    // ===========================================
    // Core Trading Functions
    // ===========================================
    
    /**
     * @notice Execute a token-to-token swap
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum output amount (slippage protection)
     * @return amountOut Actual output amount received
     * 
     * @dev User must approve this contract to spend tokenIn first
     */
    function executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) 
        external 
        nonReentrant 
        whenNotPaused
        validAmount(amountIn)
        returns (uint256 amountOut) 
    {
        // Validate trade limit
        uint256 userLimit = _getMaxTradeLimit(msg.sender);
        if (amountIn > userLimit) revert ExceedsMaxTradeLimit();
        
        // Validate slippage
        _validateSlippage(tokenIn, tokenOut, amountIn, minAmountOut);
        
        // Transfer tokens from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve router
        IERC20(tokenIn).safeIncreaseAllowance(address(uniswapRouter), amountIn);
        
        // Build swap path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        // Execute swap
        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            msg.sender, // Tokens go directly to user
            block.timestamp + DEADLINE_DURATION
        );
        
        amountOut = amounts[amounts.length - 1];
        
        emit TradeExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            block.timestamp
        );
        
        return amountOut;
    }
    
    /**
     * @notice Execute an ETH-to-token swap
     * @param tokenOut Address of output token
     * @param minAmountOut Minimum output amount
     * @return amountOut Actual output amount received
     */
    function executeTradeETHForTokens(
        address tokenOut,
        uint256 minAmountOut
    )
        external
        payable
        nonReentrant
        whenNotPaused
        validAmount(msg.value)
        returns (uint256 amountOut)
    {
        // Validate trade limit
        uint256 userLimit = _getMaxTradeLimit(msg.sender);
        if (msg.value > userLimit) revert ExceedsMaxTradeLimit();
        
        // Build swap path
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = tokenOut;
        
        // Execute swap
        uint[] memory amounts = uniswapRouter.swapExactETHForTokens{value: msg.value}(
            minAmountOut,
            path,
            msg.sender,
            block.timestamp + DEADLINE_DURATION
        );
        
        amountOut = amounts[amounts.length - 1];
        
        emit TradeExecuted(
            msg.sender,
            WETH,
            tokenOut,
            msg.value,
            amountOut,
            block.timestamp
        );
        
        return amountOut;
    }
    
    /**
     * @notice Execute a token-to-ETH swap
     * @param tokenIn Address of input token
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum ETH output
     * @return amountOut Actual ETH received
     */
    function executeTradeTokensForETH(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    )
        external
        nonReentrant
        whenNotPaused
        validAmount(amountIn)
        returns (uint256 amountOut)
    {
        // Validate trade limit
        uint256 userLimit = _getMaxTradeLimit(msg.sender);
        if (amountIn > userLimit) revert ExceedsMaxTradeLimit();
        
        // Transfer tokens from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve router
        IERC20(tokenIn).safeIncreaseAllowance(address(uniswapRouter), amountIn);
        
        // Build swap path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = WETH;
        
        // Execute swap
        uint[] memory amounts = uniswapRouter.swapExactTokensForETH(
            amountIn,
            minAmountOut,
            path,
            msg.sender,
            block.timestamp + DEADLINE_DURATION
        );
        
        amountOut = amounts[amounts.length - 1];
        
        emit TradeExecuted(
            msg.sender,
            tokenIn,
            WETH,
            amountIn,
            amountOut,
            block.timestamp
        );
        
        return amountOut;
    }
    
    // ===========================================
    // User Configuration
    // ===========================================
    
    /**
     * @notice Set personal max trade limit
     * @param newLimit New max trade limit in wei
     */
    function setMaxTradeLimit(uint256 newLimit) external {
        maxTradeLimit[msg.sender] = newLimit;
        emit MaxTradeLimitUpdated(msg.sender, newLimit);
    }
    
    /**
     * @notice Get effective max trade limit for a user
     * @param user User address
     * @return limit Effective limit
     */
    function _getMaxTradeLimit(address user) internal view returns (uint256) {
        uint256 userLimit = maxTradeLimit[user];
        return userLimit > 0 ? userLimit : defaultMaxTradeLimit;
    }
    
    // ===========================================
    // Emergency Functions
    // ===========================================
    
    /**
     * @notice Emergency withdraw tokens stuck in contract
     * @param token Token address to withdraw (address(0) for ETH)
     * 
     * @dev This should rarely be needed as tokens go directly to users
     */
    function emergencyWithdraw(address token) external nonReentrant {
        if (token == address(0)) {
            // Withdraw ETH
            uint256 balance = address(this).balance;
            if (balance == 0) revert InsufficientBalance();
            
            (bool success, ) = msg.sender.call{value: balance}("");
            if (!success) revert TransferFailed();
            
            emit EmergencyWithdraw(msg.sender, address(0), balance);
        } else {
            // Withdraw ERC20
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance == 0) revert InsufficientBalance();
            
            IERC20(token).safeTransfer(msg.sender, balance);
            
            emit EmergencyWithdraw(msg.sender, token, balance);
        }
    }
    
    // ===========================================
    // Admin Functions
    // ===========================================
    
    /**
     * @notice Pause/unpause the contract
     * @param _paused New paused state
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit ContractPaused(_paused);
    }
    
    /**
     * @notice Update default max trade limit
     * @param newLimit New default limit
     */
    function setDefaultMaxTradeLimit(uint256 newLimit) external onlyOwner {
        defaultMaxTradeLimit = newLimit;
    }
    
    // ===========================================
    // View Functions
    // ===========================================
    
    /**
     * @notice Get expected output amount for a trade
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return expectedOut Expected output amount
     */
    function getExpectedOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 expectedOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }
    
    /**
     * @notice Get user's max trade limit
     * @param user User address
     * @return User's effective max trade limit
     */
    function getUserMaxTradeLimit(address user) external view returns (uint256) {
        return _getMaxTradeLimit(user);
    }
    
    // ===========================================
    // Internal Functions
    // ===========================================
    
    /**
     * @notice Validate slippage is within acceptable range
     */
    function _validateSlippage(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal view {
        // Get expected output
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
        uint256 expectedOut = amounts[amounts.length - 1];
        
        // Calculate slippage
        uint256 slippage = ((expectedOut - minAmountOut) * 10000) / expectedOut;
        
        if (slippage < MIN_SLIPPAGE || slippage > MAX_SLIPPAGE) {
            revert InvalidSlippage();
        }
    }
    
    // ===========================================
    // Receive ETH
    // ===========================================
    
    receive() external payable {}
}
