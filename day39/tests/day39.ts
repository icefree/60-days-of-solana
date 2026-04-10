import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Metaplex,
  irysStorage,
  keypairIdentity,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { createMint } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { readFileSync } from "fs";
import path from "path";
import { Day39 } from "../target/types/day39";


describe("spl_token_with_metadata", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.day39 as Program<Day39>;

  const wallet = provider.wallet as anchor.Wallet;

  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  // configure Metaplex with Irys (formerly Bundlr)
  const metaplex = Metaplex.make(provider.connection)
    .use(keypairIdentity(wallet.payer))
    .use(
      irysStorage({
        address: "https://devnet.irys.xyz", // Irys endpoint
        providerUrl: provider.connection.rpcEndpoint,
        timeout: 60_000,
      })
    );

  it("creates token with metadata", async () => {
    // Create the mint
    const mintKeypair = Keypair.generate();
    await createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      9,
      mintKeypair
    );
    const mintPubkey = mintKeypair.publicKey;
    console.log("Mint Pubkey:", mintPubkey.toBase58());

    // Read & convert our image into a MetaplexFile
    const imageBuffer = readFileSync(
      path.resolve(__dirname, "../assets/image/kitten.png")
    );
    const metaplexFile = toMetaplexFile(imageBuffer, "kitten.png");

    // Upload image, get arweave URI string
    const arweaveImageUri: string = await metaplex.storage().upload(metaplexFile);
    const imageTxId = arweaveImageUri.split("/").pop()!;
    const imageUri = `https://devnet.irys.xyz/${imageTxId}`;
    console.log("Devnet Irys image URL:", imageUri); // using Irys devnet gateway because Arweave public gateway has no devnet

    // Build our JSON metadata object following the Fungible Standard format
    // This matches the token_standard = 2 format we explained earlier
    const metadata = {
      name: "Test Token",
      symbol: "TEST",
      description: "Test token with metadata example",
      image: imageUri,
    };

    // Upload JSON, get arweave URI string
    const arweaveMetadataUri: string = await metaplex
      .storage()
      .uploadJson(metadata);
    const metadataTxId = arweaveMetadataUri.split("/").pop()!;
    const metadataUri = `https://devnet.irys.xyz/${metadataTxId}`;
    console.log("Devnet Irys metadata URL:", metadataUri); // using Irys devnet gateway because Arweave public gateway has no devnet

    // Derive on-chain metadata PDA
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    console.log("Metadata PDA:", metadataPda.toBase58());

    // Call the create_token_metadata function
    const tx = await program.methods
      .createTokenMetadata(
        metadata.name,
        metadata.symbol,
        metadataUri,
        100, // 1%
        true // isMutable
      )
      .accounts({
        metadata: metadataPda,
        mint: mintPubkey,
        authority: wallet.publicKey,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc();
    console.log("Transaction signature:", tx);

    // Assert the account exists & is owned by the Metadata program
    const info = await provider.connection.getAccountInfo(metadataPda);
    assert(info !== null, "Metadata account must exist");
    assert(
      info.owner.equals(TOKEN_METADATA_PROGRAM_ID),
      "Wrong owner for metadata account"
    );
  });
});
