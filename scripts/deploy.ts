import { network } from "hardhat";

async function main() {
  // Pass "sepolia" to target your config and type-cast to bypass missing definitions
  const { ethers, networkName } = (await network.create("sepolia")) as any;

  const candidateNames = ["Alice", "Bob", "Charlie"];
  console.log(`Deploying Voting contract to ${networkName}...`);

  // Deploy the contract passing constructor arguments
  const voting = await ethers.deployContract("Voting", [candidateNames]);

  await voting.waitForDeployment();

  console.log(`Voting contract deployed to: ${await voting.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
