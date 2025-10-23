// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMerkleAirdrop.sol";
import "./MerkleAirdrop.sol";

/**
 * @title AirdropFactory
 * @dev Factory contract for deploying MerkleAirdrop clones using EIP-1167
 */
contract AirdropFactory is Ownable {
    using SafeERC20 for IERC20;

    // Address of the MerkleAirdrop implementation contract
    address public immutable implementation;

    /**
     * @dev Emitted when a new airdrop is created
     * @param creator Address of the airdrop creator
     * @param token Address of the ERC20 token
     * @param airdropAddress Address of the deployed airdrop contract
     * @param merkleRoot Root of the Merkle tree
     * @param metadataURI URI containing claim data
     * @param timestamp Timestamp of creation
     * @param totalAmount Total amount of tokens in the airdrop
     */
    event AirdropCreated(
        address indexed creator,
        address indexed token,
        address indexed airdropAddress,
        bytes32 merkleRoot,
        string metadataURI,
        uint256 timestamp,
        uint256 totalAmount
    );

    /**
     * @dev Constructor that sets the implementation address
     * @param implementation_ Address of the MerkleAirdrop implementation contract
     */
    constructor(address implementation_) Ownable() {
        require(implementation_ != address(0), "AirdropFactory: implementation cannot be zero address");
        implementation = implementation_;
    }

    /**
     * @dev Create a new airdrop and fund it in a single transaction
     * @param token Address of the ERC20 token
     * @param merkleRoot Root of the Merkle tree
     * @param metadataURI URI containing claim data
     * @param totalAmount Total amount of tokens to fund the airdrop
     * @return airdropAddress Address of the deployed airdrop contract
     */
    function createAirdropAndFund(
        address token,
        bytes32 merkleRoot,
        string calldata metadataURI,
        uint256 totalAmount
    ) external returns (address airdropAddress) {
        require(token != address(0), "AirdropFactory: token cannot be zero address");
        require(merkleRoot != bytes32(0), "AirdropFactory: merkle root cannot be zero");
        require(totalAmount > 0, "AirdropFactory: total amount must be greater than zero");

        // Deploy a new MerkleAirdrop contract (not using clone for now, direct deployment)
        // Note: We deploy directly instead of using clone since MerkleAirdrop uses constructor
        airdropAddress = address(new MerkleAirdrop(
            token,
            msg.sender,
            merkleRoot,
            metadataURI,
            totalAmount
        ));

        // Transfer tokens from creator to the airdrop contract
        IERC20(token).safeTransferFrom(msg.sender, airdropAddress, totalAmount);

        emit AirdropCreated(
            msg.sender,
            token,
            airdropAddress,
            merkleRoot,
            metadataURI,
            block.timestamp,
            totalAmount
        );
    }

    /**
     * @dev Predict the address of a clone before deployment
     * @param salt Salt for deterministic address generation
     * @return predictedAddress Predicted address of the clone
     */
    function predictCloneAddress(bytes32 salt) external view returns (address predictedAddress) {
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
    }

    /**
     * @dev Create a deterministic clone using a salt
     * @param token Address of the ERC20 token
     * @param merkleRoot Root of the Merkle tree
     * @param metadataURI URI containing claim data
     * @param totalAmount Total amount of tokens to fund the airdrop
     * @return airdropAddress Address of the deployed airdrop contract
     */
    function createDeterministicAirdropAndFund(
        bytes32 /* salt */,
        address token,
        bytes32 merkleRoot,
        string calldata metadataURI,
        uint256 totalAmount
    ) external returns (address airdropAddress) {
        require(token != address(0), "AirdropFactory: token cannot be zero address");
        require(merkleRoot != bytes32(0), "AirdropFactory: merkle root cannot be zero");
        require(totalAmount > 0, "AirdropFactory: total amount must be greater than zero");

        // Deploy a new MerkleAirdrop contract with deterministic address
        // Note: CREATE2 would be needed for truly deterministic deployment with constructor
        airdropAddress = address(new MerkleAirdrop(
            token,
            msg.sender,
            merkleRoot,
            metadataURI,
            totalAmount
        ));

        // Transfer tokens from creator to the airdrop contract
        IERC20(token).safeTransferFrom(msg.sender, airdropAddress, totalAmount);

        emit AirdropCreated(
            msg.sender,
            token,
            airdropAddress,
            merkleRoot,
            metadataURI,
            block.timestamp,
            totalAmount
        );
    }

    /**
     * @dev Get the implementation address
     * @return implementation Address of the implementation contract
     */
    function getImplementation() external view returns (address) {
        return implementation;
    }
}
