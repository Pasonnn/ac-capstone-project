import { NextRequest, NextResponse } from "next/server";

const IPFS_GATEWAY_URL_POST =
  process.env.NEXT_IPFS_GATEWAY_URL_POST ||
  "http://35.247.142.76:5001/api/v0/add";
const IPFS_GATEWAY_URL =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "https://ipfs.de-id.xyz/ipfs";

export async function POST(request: NextRequest) {
  try {
    const { claimsData } = await request.json();

    if (!claimsData) {
      return NextResponse.json(
        { error: "Claims data is required" },
        { status: 400 }
      );
    }

    // Create a FormData object for IPFS upload
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(claimsData, null, 2)], {
      type: "application/json",
    });
    formData.append("file", jsonBlob, "claims.json");

    console.log("Uploading to IPFS server:", IPFS_GATEWAY_URL_POST);

    // Upload to IPFS
    const response = await fetch(IPFS_GATEWAY_URL_POST, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `IPFS upload failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    const cid = result.Hash;
    const ipfsUrl = `ipfs://${cid}`;

    console.log("IPFS upload successful:", {
      cid,
      url: ipfsUrl,
      dataSize: JSON.stringify(claimsData).length,
    });

    return NextResponse.json({
      success: true,
      cid,
      url: ipfsUrl,
    });
  } catch (error) {
    console.error("IPFS upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload to IPFS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
