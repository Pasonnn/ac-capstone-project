import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { claimsData } = await request.json();

    if (!claimsData) {
      return NextResponse.json(
        { error: "Claims data is required" },
        { status: 400 }
      );
    }

    // For now, simulate IPFS upload with a mock CID
    // In production, you would use Web3.Storage or Pinata
    const mockCid = `Qm${Math.random()
      .toString(36)
      .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const ipfsUrl = `https://ipfs.io/ipfs/${mockCid}/claims.json`;

    console.log("Mock IPFS upload:", {
      cid: mockCid,
      url: ipfsUrl,
      dataSize: JSON.stringify(claimsData).length,
    });

    return NextResponse.json({
      success: true,
      cid: mockCid,
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
