import { network } from "hardhat";

console.log("Network object:", network);

const { ethers } = await network.connect();
console.log("Ethers object:", ethers);

// Try to get signers
try {
  const signers = await ethers.getSigners();
  console.log("Signers:", signers);
} catch (error) {
  console.log("getSigners error:", error.message);
}

// Try to get provider
try {
  const provider = ethers.provider;
  console.log("Provider:", provider);
} catch (error) {
  console.log("Provider error:", error.message);
}
