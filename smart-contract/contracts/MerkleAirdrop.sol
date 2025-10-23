// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMerkleAirdrop.sol";

/**
 * @title MerkleAirdrop
 * @dev Merkle-based airdrop contract with bitmap claiming and 7-day lock
 */
contract MerkleAirdrop is IMerkleAirdrop, Ownable {
    using SafeERC20 for IERC20;

    // State variables
    IERC20 private immutable _token;
    bytes32 public immutable merkleRoot;
    string private _metadataURI;
    uint256 public immutable totalAmount;
    uint256 public immutable claimDeadline;
    uint256 public immutable unlockTimestamp;

    // Bitmap for claimed status (1 bit per user)
    mapping(uint256 => uint256) private claimedBitMap;

    // Modifier to check if claiming is still allowed
    modifier notExpired() {
        require(block.timestamp <= claimDeadline, "MerkleAirdrop: claim period expired");
        _;
    }

    // Modifier to check if withdrawal is allowed
    modifier canWithdraw() {
        require(block.timestamp >= unlockTimestamp, "MerkleAirdrop: withdrawal not yet allowed");
        _;
    }

    /**
     * @dev Constructor that sets immutable variables
     * @param token_ Address of the ERC20 token
     * @param owner_ Address of the airdrop owner
     * @param merkleRoot_ Root of the Merkle tree
     * @param metadataURI_ URI containing claim data
     * @param totalAmount_ Total amount of tokens in the airdrop
     */
    constructor(
        address token_,
        address owner_,
        bytes32 merkleRoot_,
        string memory metadataURI_,
        uint256 totalAmount_
    ) Ownable(owner_) {
        require(token_ != address(0), "MerkleAirdrop: token cannot be zero address");
        require(owner_ != address(0), "MerkleAirdrop: owner cannot be zero address");
        require(merkleRoot_ != bytes32(0), "MerkleAirdrop: merkle root cannot be zero");
        require(totalAmount_ > 0, "MerkleAirdrop: total amount must be greater than zero");

        _token = IERC20(token_);
        merkleRoot = merkleRoot_;
        _metadataURI = metadataURI_;
        totalAmount = totalAmount_;
        claimDeadline = block.timestamp + 7 days;
        unlockTimestamp = block.timestamp + 7 days;


        emit Initialized(
            token_,
            owner_,
            merkleRoot_,
            metadataURI_,
            totalAmount_,
            claimDeadline,
            unlockTimestamp
        );
    }

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
    ) external override notExpired {
        require(account == msg.sender, "MerkleAirdrop: caller must be the account");
        require(!isClaimed(index), "MerkleAirdrop: drop already claimed");
        require(amount > 0, "MerkleAirdrop: amount must be greater than zero");

        // Verify the merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "MerkleAirdrop: invalid merkle proof"
        );

        // Mark it claimed and send the token
        _setClaimed(index);
        _token.safeTransfer(account, amount);

        emit Claimed(index, account, amount);
    }

    /**
     * @dev Initialize function (for interface compatibility, but not used since we use constructor)
     */
    function initialize(
        address,
        address,
        bytes32,
        string calldata,
        uint256
    ) external pure override {
        revert("MerkleAirdrop: use constructor instead");
    }

    /**
     * @dev Withdraw remaining tokens (only after unlock period)
     */
    function withdrawRemaining() external override onlyOwner canWithdraw {
        uint256 balance = _token.balanceOf(address(this));
        require(balance > 0, "MerkleAirdrop: no tokens to withdraw");

        _token.safeTransfer(owner(), balance);

        emit Withdrawn(owner(), balance);
    }

    /**
     * @dev Get the token address (interface requirement)
     */
    function token() external view override returns (address) {
        return address(_token);
    }

    /**
     * @dev Get the metadata URI (interface requirement)
     */
    function metadataURI() external view override returns (string memory) {
        return _metadataURI;
    }

    /**
     * @dev Check if a claim has been used
     * @param index Index of the claim
     * @return claimed True if the claim has been used
     */
    function isClaimed(uint256 index) public view override returns (bool claimed) {
        uint256 wordIndex = index / 256;
        uint256 bitIndex = index % 256;
        uint256 word = claimedBitMap[wordIndex];
        uint256 mask = (1 << bitIndex);
        return word & mask == mask;
    }

    /**
     * @dev Set a claim as claimed
     * @param index Index of the claim
     */
    function _setClaimed(uint256 index) private {
        uint256 wordIndex = index / 256;
        uint256 bitIndex = index % 256;
        claimedBitMap[wordIndex] = claimedBitMap[wordIndex] | (1 << bitIndex);
    }

    /**
     * @dev Get the current balance of the contract
     * @return balance Current token balance
     */
    function getBalance() external view returns (uint256 balance) {
        return _token.balanceOf(address(this));
    }

    /**
     * @dev Get the number of days until withdrawal is allowed
     * @return daysRemaining Days until withdrawal is allowed (0 if allowed)
     */
    function getDaysUntilWithdrawal() external view returns (uint256 daysRemaining) {
        if (block.timestamp >= unlockTimestamp) {
            return 0;
        }
        return (unlockTimestamp - block.timestamp) / 1 days;
    }

    /**
     * @dev Get the number of days until claiming expires
     * @return daysRemaining Days until claiming expires (0 if expired)
     */
    function getDaysUntilExpiry() external view returns (uint256 daysRemaining) {
        if (block.timestamp >= claimDeadline) {
            return 0;
        }
        return (claimDeadline - block.timestamp) / 1 days;
    }
}
