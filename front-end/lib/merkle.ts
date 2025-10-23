import { MerkleTree } from "merkletreejs";
import { keccak256, encodePacked } from "viem";

export interface AirdropData {
  index: number;
  account: string;
  amount: string;
}

export interface ClaimData {
  index: number;
  account: string;
  amount: string;
  proof: string[];
}

export interface ClaimsMetadata {
  name: string;
  description: string;
  token: string;
  merkleRoot: string;
  totalAmount: string;
  claimDeadline: number;
  unlockTimestamp: number;
  createdAt: number;
  version: string;
}

export interface ClaimsData {
  metadata: ClaimsMetadata;
  claims: ClaimData[];
}

/**
 * Generate Merkle tree from airdrop data
 */
export function generateMerkleTree(airdropData: AirdropData[]): {
  tree: MerkleTree;
  root: string;
  claims: ClaimData[];
} {
  // Create leaves for Merkle tree using the same encoding as the smart contract
  const leaves = airdropData.map((data) => {
    // Use abi.encodePacked equivalent: keccak256(abi.encodePacked(index, account, amount))
    const packed = encodePacked(
      ["uint256", "address", "uint256"],
      [BigInt(data.index), data.account as `0x${string}`, BigInt(data.amount)]
    );
    return keccak256(packed);
  });

  // Create Merkle tree
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  // Generate proofs for each claim
  const claims: ClaimData[] = airdropData.map((data) => {
    const leaf = keccak256(
      encodePacked(
        ["uint256", "address", "uint256"],
        [BigInt(data.index), data.account as `0x${string}`, BigInt(data.amount)]
      )
    );
    const proof = tree.getHexProof(leaf);

    return {
      index: data.index,
      account: data.account,
      amount: data.amount,
      proof,
    };
  });

  return { tree, root, claims };
}

/**
 * Create claims data for IPFS upload
 */
export function createClaimsData(
  airdropData: AirdropData[],
  tokenAddress: string,
  name: string = "Airdrop Campaign",
  description: string = "A decentralized airdrop campaign"
): ClaimsData {
  const { root, claims } = generateMerkleTree(airdropData);

  // Calculate total amount
  const totalAmount = airdropData.reduce(
    (sum, data) => sum + BigInt(data.amount),
    0n
  );

  // Create metadata
  const metadata: ClaimsMetadata = {
    name,
    description,
    token: tokenAddress,
    merkleRoot: root,
    totalAmount: totalAmount.toString(),
    claimDeadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    unlockTimestamp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    createdAt: Math.floor(Date.now() / 1000),
    version: "1.0.0",
  };

  return {
    metadata,
    claims,
  };
}

/**
 * Find claim data for a specific address
 */
export function findClaimForAddress(
  claims: ClaimData[],
  address: string
): ClaimData | null {
  return (
    claims.find(
      (claim) => claim.account.toLowerCase() === address.toLowerCase()
    ) || null
  );
}

/**
 * Verify Merkle proof
 */
export function verifyMerkleProof(
  index: number,
  account: string,
  amount: string,
  proof: string[],
  root: string
): boolean {
  const leaf = keccak256(
    encodePacked(
      ["uint256", "address", "uint256"],
      [BigInt(index), account as `0x${string}`, BigInt(amount)]
    )
  );

  return MerkleTree.verify(proof, leaf, root, keccak256);
}
