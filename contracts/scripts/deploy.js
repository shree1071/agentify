const hre = require("hardhat");

async function main() {
    console.log("Deploying AI Trading Agent contracts...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Uniswap V2 Router addresses
    const UNISWAP_ROUTERS = {
        1: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Mainnet
        11155111: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", // Sepolia (Uniswap V2 fork)
        31337: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Hardhat (mainnet fork)
    };

    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    console.log("Chain ID:", chainId);

    // Verify or Deploy Router
    if (chainId === 31337n) {
        console.log("Localhost detected. Deploying Mocks...");

        // 1. Deploy Mock WETH
        const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
        const mockWETH = await MockERC20.deploy("Mock WETH", "mWETH", 18);
        await mockWETH.waitForDeployment();
        console.log("Mock WETH deployed to:", await mockWETH.getAddress());

        // 2. Deploy Mock Router
        const MockRouter = await hre.ethers.getContractFactory("MockUniswapRouter");
        const mockRouter = await MockRouter.deploy(await mockWETH.getAddress());
        await mockRouter.waitForDeployment();
        routerAddress = await mockRouter.getAddress();
        console.log("Mock Router deployed to:", routerAddress);

        // 3. Deploy Mock USDC
        const mockUSDC = await MockERC20.deploy("Mock USDC", "mUSDC", 6);
        await mockUSDC.waitForDeployment();
        console.log("Mock USDC deployed to:", await mockUSDC.getAddress());

        // Mint tokens to deployer
        await mockUSDC.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
        await mockWETH.mint(deployer.address, hre.ethers.parseEther("100"));
        console.log("Minted test tokens to deployer");
    }

    console.log("Using Uniswap Router:", routerAddress);

    // Deploy TradingAgent
    console.log("\nDeploying TradingAgent...");
    const TradingAgent = await hre.ethers.getContractFactory("TradingAgent");
    const tradingAgent = await TradingAgent.deploy(routerAddress);
    await tradingAgent.waitForDeployment();

    const tradingAgentAddress = await tradingAgent.getAddress();

    console.log("\n✅ Deployment complete!");
    console.log("\nContract Addresses:");
    console.log("==================");
    console.log("TradingAgent:", tradingAgentAddress);

    // Verify on Etherscan if not local
    if (chainId !== 31337n && process.env.ETHERSCAN_API_KEY) {
        console.log("\nWaiting for block confirmations...");
        await tradingAgent.deploymentTransaction()?.wait(5);

        console.log("Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: tradingAgentAddress,
                constructorArguments: [routerAddress],
            });
            console.log("Contract verified!");
        } catch (error) {
            console.log("Verification failed:", error.message);
        }
    }

    // Save deployment info to file
    const fs = require("fs");
    const deploymentInfo = {
        network: "localhost",
        chainId: chainId.toString(),
        tradingAgent: tradingAgentAddress,
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("\nSaved deployment info to deployment-info.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
