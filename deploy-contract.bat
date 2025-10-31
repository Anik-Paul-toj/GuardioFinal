@echo off
echo 🚀 Starting Tourist ID Smart Contract Deployment...

REM Check if we're in the right directory
if not exist "contracts" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

REM Navigate to contracts directory
cd contracts

REM Check if .env file exists
if not exist ".env" (
    echo ❌ Error: .env file not found in contracts directory
    echo 📝 Please copy .env.example to .env and configure your settings
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing contract dependencies...
    npm install
)

REM Compile contracts
echo 🔨 Compiling contracts...
npm run compile

if %errorlevel% neq 0 (
    echo ❌ Contract compilation failed
    exit /b 1
)

REM Run tests
echo 🧪 Running contract tests...
npm test

if %errorlevel% neq 0 (
    echo ❌ Contract tests failed
    exit /b 1
)

REM Deploy to Polygon Amoy
echo 🌐 Deploying to Polygon Amoy testnet...
npm run deploy:amoy

if %errorlevel% equ 0 (
    echo ✅ Deployment completed successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Copy the contract address from the output above
    echo 2. Update CONTRACT_CONFIG.address in services/blockchainService.js
    echo 3. Test the minting functionality in your React Native app
    echo.
    echo 🔗 Useful links:
    echo - Polygon Amoy Explorer: https://amoy.polygonscan.com
    echo - Get test MATIC: https://faucet.polygon.technology
    echo.
) else (
    echo ❌ Deployment failed
    exit /b 1
)

cd ..
