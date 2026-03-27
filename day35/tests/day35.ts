import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { Day35 } from "../target/types/day35";

describe("day35", () => {
  const provider = anchor.AnchorProvider.env();
  const signerKp = provider.wallet.payer;
  const toKp = anchor.web3.Keypair.generate();
  anchor.setProvider(provider);

  const program = anchor.workspace.day35 as Program<Day35>;

  it("Creates a new mint and associated token account using CPI", async () => {
    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from("my_mint"), signerKp.publicKey.toBuffer()],
      program.programId,
    );

    const ata = splToken.getAssociatedTokenAddressSync(
      mint,
      signerKp.publicKey,
      false,
    );

    const tx = await program.methods
      .createAndMintToken()
      .accounts({
        signer: signerKp.publicKey,
        newMint: mint,
        newAta: ata,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction signature:", tx);
    console.log("Token (Mint Account) Address:", mint.toString());
    console.log("Associated Token Account:", ata.toString());

    const mintInfo = await splToken.getMint(provider.connection, mint);
    assert.equal(mintInfo.decimals, 9, "Mint decimals should be 9");
    assert.equal(
      mintInfo.mintAuthority?.toString(),
      signerKp.publicKey.toString(),
      "Mint authority should be the signer",
    );
    assert.equal(
      mintInfo.freezeAuthority?.toString(),
      signerKp.publicKey.toString(),
      "Freeze authority should be the signer",
    );
    assert.equal(
      mintInfo.supply.toString(),
      "100000000000",
      "Supply should be 100 tokens (with 9 decimals)",
    );

    const tokenAccount = await splToken.getAccount(provider.connection, ata);
    assert.equal(
      tokenAccount.mint.toString(),
      mint.toString(),
      "Token account mint should match the mint PDA",
    );
    assert.equal(
      tokenAccount.owner.toString(),
      signerKp.publicKey.toString(),
      "Token account owner should be the signer",
    );
    assert.equal(
      tokenAccount.amount.toString(),
      "100000000000",
      "Token balance should be 100 tokens (with 9 decimals)",
    );
    assert.equal(
      tokenAccount.delegate,
      null,
      "Token account should not have a delegate",
    );

    const tx2 = await program.methods
      .disableMintAuthority()
      .accounts({
        mint: mint,
        authority: signerKp.publicKey,
      })
      .rpc();
    console.log("Disable mint authority Transaction signature:", tx2);

    // Error: the total supply of this token is fixed
    // await splToken.mintTo(
    //   provider.connection,
    //   signerKp,
    //   mint,
    //   ata,
    //   signerKp,
    //   BigInt(222 * Math.pow(10, 9)),
    // );
  });

  it("Transfers tokens using CPI", async () => {
    // Derive the PDA for the mint
    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from("my_mint"), signerKp.publicKey.toBuffer()],
      program.programId,
    );

    // Get the ATAs
    const fromAta = splToken.getAssociatedTokenAddressSync(
      mint,
      signerKp.publicKey,
      false,
    );
    const toAta = splToken.getAssociatedTokenAddressSync(
      mint,
      toKp.publicKey,
      false,
    );

    // Create to_ata as it doesn't exist yet
    try {
      await splToken.createAssociatedTokenAccount(
        provider.connection,
        signerKp,
        mint,
        toKp.publicKey,
      );
    } catch (error) {
      throw new Error(error);
    }

    const transferAmount = new anchor.BN(10_000_000_000); // 10 tokens with 9 decimals

    // Transfer tokens
    const tx = await program.methods
      .transferTokens(transferAmount)
      .accounts({
        from: signerKp.publicKey,
        fromAta: fromAta,
        toAta: toAta,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Transfer Transaction signature:", tx);

    // Verify the transfer
    const toBalance = await provider.connection.getTokenAccountBalance(toAta);
    assert.equal(
      toBalance.value.amount,
      transferAmount.toString(),
      "Recipient balance should match transfer amount",
    );
  });

  it("Reads token balance using CPI", async () => {
    // Derive the PDA for the mint
    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from("my_mint"), signerKp.publicKey.toBuffer()],
      program.programId,
    );

    // Get the associated token account address
    const ata = splToken.getAssociatedTokenAddressSync(
      mint,
      signerKp.publicKey,
      false,
    );

    // Call the get_balance instruction
    const tx = await program.methods
      .getBalance()
      .accounts({
        tokenAccount: ata,
      })
      .rpc();

    console.log("Get Balance Transaction signature:", tx);

    // Verify balance through direct query
    const balance = await provider.connection.getTokenAccountBalance(ata);
    assert.isTrue(
      balance.value.uiAmount > 0,
      "Token balance should be greater than 0",
    );
  });
});
