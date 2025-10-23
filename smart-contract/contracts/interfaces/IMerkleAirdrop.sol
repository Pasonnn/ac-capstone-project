// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IMerkleAirdrop
 * @dev Interface for Merkle-based airdrop contracts
 */
interface IMerkleAirdrop {
    /**
     * @dev Emitted when tokens are claimed
     * @param index Index of the claim in the Merkle tree
     * @param account Address that claimed the tokens
     * @param amount Amount of tokens claimed
     */
    event Claimed(uint256 indexed index, address indexed account, uint256 amount);

    /**
     * @dev Emitted when remaining tokens are withdrawn by owner
     * @param to Address that received the tokens
     * @param amount Amount of tokens withdrawn
     */
    event Withdrawn(address indexed to, uint256 amount);

    /**
     * @dev Emitted when the airdrop is initialized
     * @param token Address of the ERC20 token
     * @param owner Address of the airdrop owner
     * @param merkleRoot Root of the Merkle tree
     * @param metadataURI URI containing claim data
     * @param totalAmount Total amount of tokens in the airdrop
     * @param claimDeadline Deadline for claiming tokens
     * @param unlockTimestamp Timestamp when owner can withdraw remaining tokens
     */
    event Initialized(
        address indexed token,
        address indexed owner,
        bytes32 merkleRoot,
        string metadataURI,
        uint256 totalAmount,
        uint256 claimDeadline,
        uint256 unlockTimestamp
    );

    /**
     * @dev Initialize the airdrop contract
     * @param token Address of the ERC20 token
     * @param owner Address of the airdrop owner
     * @param merkleRoot Root of the Merkle tree
     * @param metadataURI URI containing claim data
     * @param totalAmount Total amount of tokens in the airdrop
     */
    function initialize(
        address token,
        address owner,
        bytes32 merkleRoot,
        string calldata metadataURI,
        uint256 totalAmount
    ) external;

    /**
     * @dev Claim tokens using Merkle proof
     * @param index Index of the claim in the Merkle tree
     * @param account Address claiming the tokens
     * @param amount Amount of tokens to claim
     * @param merkleProof Merkle proof for the claim
     */
    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external;

    /**
     * @dev Withdraw remaining tokens (only after unlock period)
     */
    function withdrawRemaining() external;

    /**
     * @dev Check if a claim has been used
     * @param index Index of the claim
     * @return claimed True if the claim has been used
     */
    function isClaimed(uint256 index) external view returns (bool claimed);

    /**
     * @dev Get the token address
     * @return token Address of the ERC20 token
     */
    function token() external view returns (address);


    /**
     * @dev Get the Merkle root
     * @return merkleRoot Root of the Merkle tree
     */
    function merkleRoot() external view returns (bytes32);

    /**
     * @dev Get the metadata URI
     * @return metadataURI URI containing claim data
     */
    function metadataURI() external view returns (string memory);

    /**
     * @dev Get the total amount of tokens in the airdrop
     * @return totalAmount Total amount of tokens
     */
    function totalAmount() external view returns (uint256);

    /**
     * @dev Get the claim deadline
     * @return claimDeadline Timestamp when claiming expires
     */
    function claimDeadline() external view returns (uint256);

    /**
     * @dev Get the unlock timestamp
     * @return unlockTimestamp Timestamp when owner can withdraw
     */
    function unlockTimestamp() external view returns (uint256);
}
