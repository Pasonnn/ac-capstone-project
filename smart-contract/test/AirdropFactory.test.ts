import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("AirdropFactory", function () {
  it("Should deploy AirdropFactory contract", async function () {
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

    // Deploy MerkleAirdrop implementation
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const implementation = await MerkleAirdrop.deploy(
      await mockToken.getAddress(),
      owner.address,
      ethers.keccak256(ethers.toUtf8Bytes("dummy")),
      "https://example.com",
      0
    );

    // Deploy AirdropFactory
    const AirdropFactory = await ethers.getContractFactory("AirdropFactory");
    const factory = await AirdropFactory.deploy(
      await implementation.getAddress()
    );

    expect(await factory.getAddress()).to.not.equal(ethers.ZeroAddress);
    expect(await factory.getImplementation()).to.equal(
      await implementation.getAddress()
    );
    expect(await factory.owner()).to.equal(owner.address);
  });
});
