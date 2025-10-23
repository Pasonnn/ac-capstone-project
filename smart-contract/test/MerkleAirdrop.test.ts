import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MerkleAirdrop", function () {
  it("Should deploy MerkleAirdrop contract", async function () {
    // This is a basic test to verify the contract compiles and can be deployed
    // More comprehensive tests will be added after we get the basic setup working

    const [owner] = await ethers.getSigners();

    // Deploy MockERC20 first
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy(
      "Test Token",
      "TEST",
      18,
      ethers.parseEther("1000000")
    );

    // Deploy MerkleAirdrop
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const merkleAirdrop = await MerkleAirdrop.deploy(
      await mockToken.getAddress(),
      owner.address,
      ethers.keccak256(ethers.toUtf8Bytes("test-root")),
      "https://example.com",
      ethers.parseEther("1000")
    );

    expect(await merkleAirdrop.getAddress()).to.not.equal(ethers.ZeroAddress);
    expect(await merkleAirdrop.owner()).to.equal(owner.address);
    expect(await merkleAirdrop.token()).to.equal(await mockToken.getAddress());
  });
});
