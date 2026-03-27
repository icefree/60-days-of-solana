import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { assert } from "chai";
import { Day35 } from "../target/types/day35";

describe("TypeScript SPL Token Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const signerKp = provider.wallet.payer;

  const program = anchor.workspace.day35 as Program<Day35>;
  console.log(program.programId, program.methods);

  const toKp = new web3.Keypair();

  // Define mint parameters
  const mintDecimals = 6;
  const mintAuthority = provider.wallet.publicKey;
  const freezeAuthority = provider.wallet.publicKey;

  let mintPublicKey;
  it("Creates a mint account and ATA using TypeScript", async () => {
    mintPublicKey = await splToken.createMint(
      provider.connection,
      signerKp,
      mintAuthority,
      freezeAuthority,
      mintDecimals,
    );

    console.log("Created Mint:", mintPublicKey.toString());

    const ataAddress = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp.publicKey,
    );

    console.log("Created ATA:", ataAddress.toString());

    const mintAmount = BigInt(1000 * Math.pow(10, mintDecimals));

    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      ataAddress,
      mintAuthority,
      mintAmount,
    );

    // Verify the mint
    const mintInfo = await splToken.getMint(provider.connection, mintPublicKey);
    assert.equal(mintInfo.decimals, mintDecimals, "Mint decimals should match");
    assert.equal(
      mintInfo.mintAuthority?.toString(),
      mintAuthority.toString(),
      "Mint authority should match",
    );
    assert.equal(
      mintInfo.freezeAuthority?.toString(),
      freezeAuthority.toString(),
      "Freeze authority should match",
    );

    // Verify the balance
    const accountInfo = await splToken.getAccount(
      provider.connection,
      ataAddress,
    );
    assert.equal(
      accountInfo.amount.toString(),
      mintAmount.toString(),
      "Balance should match minted amount",
    );

    const ata = await splToken.getAccount(provider.connection, ataAddress);
    console.log("ATA amount = ", ata.amount);
  });

  it("Transfers tokens using TypeScript", async () => {
    const from = splToken.getAssociatedTokenAddressSync(
      mintPublicKey,
      signerKp.publicKey,
    );

    const toKp = new web3.Keypair();
    const to = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      toKp.publicKey,
    );

    await splToken.transfer(
      provider.connection,
      signerKp,
      from,
      to,
      signerKp.publicKey,
      BigInt(50 * Math.pow(10, mintDecimals)),
    );

    const fromAta = await provider.connection.getTokenAccountBalance(from);
    console.log("from ATA amount = ", fromAta.value.uiAmountString);

    const toAta = await provider.connection.getTokenAccountBalance(to);
    console.log("to ATA amount = ", toAta.value.uiAmountString);
  });

  it("disable mint authority", async () => {
    await splToken.setAuthority(
      provider.connection,
      signerKp,
      mintPublicKey,
      signerKp,
      splToken.AuthorityType.MintTokens,
      null,
    );
    const to = await splToken.createAssociatedTokenAccount(
      provider.connection,
      signerKp,
      mintPublicKey,
      new web3.Keypair().publicKey,
    );
    await splToken.mintTo(
      provider.connection,
      signerKp,
      mintPublicKey,
      to,
      mintAuthority,
      BigInt(222 * Math.pow(10, mintDecimals)),
    );
  });
});
