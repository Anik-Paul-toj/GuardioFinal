const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TouristID contract to Polygon Amoy testnet...");

  // Get the contract factory
  const TouristID = await ethers.getContractFactory("TouristID");

  // Deploy the contract
  const touristID = await TouristID.deploy();

  // Wait for deployment to complete
  await touristID.waitForDeployment();

  const contractAddress = await touristID.getAddress();
  
  console.log("TouristID contract deployed to:", contractAddress);
  console.log("Transaction hash:", touristID.deploymentTransaction().hash);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await touristID.deploymentTransaction().wait(5);

  console.log("Contract verified and ready to use!");
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "polygonAmoy",
    chainId: 80002,
    deploymentTime: new Date().toISOString(),
    transactionHash: touristID.deploymentTransaction().hash
  };

  console.log("Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
