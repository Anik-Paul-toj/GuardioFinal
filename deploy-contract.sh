#!/bin/bash

echo "🚀 Starting Tourist ID Smart Contract Deployment..."

# Check if we're in the right directory
if [ ! -d "contracts" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to contracts directory
cd contracts

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in contracts directory"
    echo "📝 Please copy .env.example to .env and configure your settings"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing contract dependencies..."
    npm install
fi

# Compile contracts
echo "🔨 Compiling contracts..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Contract compilation failed"
    exit 1
fi

# Run tests
echo "🧪 Running contract tests..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ Contract tests failed"
    exit 1
fi

# Deploy to Polygon Amoy
echo "🌐 Deploying to Polygon Amoy testnet..."
npm run deploy:amoy

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy the contract address from the output above"
    echo "2. Update CONTRACT_CONFIG.address in services/blockchainService.js"
    echo "3. Test the minting functionality in your React Native app"
    echo ""
    echo "🔗 Useful links:"
    echo "- Polygon Amoy Explorer: https://amoy.polygonscan.com"
    echo "- Get test MATIC: https://faucet.polygon.technology"
    echo ""
else
    echo "❌ Deployment failed"
    exit 1
fi

cd ..
