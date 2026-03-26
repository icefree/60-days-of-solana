import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccount,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import { assert } from "chai";
import { TokenSale } from "../target/types/token_sale";

describe("token_sale", async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenSale as Program<TokenSale>;
  const connection = provider.connection;

  const adminKp = provider.wallet.payer;
  const buyer = adminKp; // Using the same keypair as both admin and buyer for testing
  const TOKENS_PER_SOL = 100;

  // Generate keypair for admin config account (will be passed as signer to authorize adminConfig account creation)
  const adminConfigKp = web3.Keypair.generate();

  let mint: anchor.web3.PublicKey;
  let treasuryPda: anchor.web3.PublicKey;
  let buyerAta: anchor.web3.PublicKey;

  it("creates mint", async () => {
    [mint] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("token_mint")],
      program.programId,
    );

    [treasuryPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId,
    );

    const tx = await program.methods
      .initialize()
      .accounts({
        admin: adminKp.publicKey,
        adminConfig: adminConfigKp.publicKey,
        mint: mint,
        treasury: treasuryPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([adminKp, adminConfigKp])
      .rpc();

    console.log("initialize tx:", tx);

    const mintInfo = await getMint(connection, mint);
    assert.equal(mintInfo.mintAuthority.toBase58(), mint.toBase58());
    assert.equal(Number(mintInfo.supply), 0);
    assert.equal(mintInfo.decimals, 9);
  });

  it("buys tokens", async () => {
    const solToSend = new anchor.BN(1e9); // 1 SOL
    const expectedTokenAmount = Number(solToSend) * TOKENS_PER_SOL; // 1*100 tokens

    const initialTreasuryBalance = await connection.getBalance(treasuryPda);

    // Create buyer's ata
    buyerAta = await createAssociatedTokenAccount(
      provider.connection,
      buyer,
      mint,
      buyer.publicKey,
      undefined,
      TOKEN_PROGRAM_ID,
    );

    const buyerAtaInfo = await getAccount(
      connection,
      buyerAta,
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const initialBuyerAtaBalance = Number(buyerAtaInfo.amount);

    // Call our program's mint function to purchase tokens
    const tx = await program.methods
      .mint(solToSend)
      .accounts({
        buyer: buyer.publicKey,
        mint: mint,
        buyerAta: buyerAta,
        treasury: treasuryPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("mint tx:", tx);
    console.log(
      "Sent",
      lamportsToSol(solToSend),
      "SOL, expecting",
      toDisplayAmount(expectedTokenAmount),
      "tokens",
    );

    const newTreasuryBalance = await connection.getBalance(treasuryPda);
    assert.equal(
      newTreasuryBalance - initialTreasuryBalance,
      Number(solToSend),
      "SOL was not correctly transferred to treasury",
    );

    const updatedBuyerAtaInfo = await getAccount(
      connection,
      buyerAta,
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const newBuyerAtaBalance = Number(updatedBuyerAtaInfo.amount);

    assert.equal(
      newBuyerAtaBalance - initialBuyerAtaBalance,
      expectedTokenAmount,
      "Tokens were not correctly minted",
    );
  });

  it("stops minting when supply cap is reached", async () => {
    const mintInfo = await getMint(
      connection,
      mint,
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const currentSupply = Number(mintInfo.supply);

    const SUPPLY_CAP = toRawTokenAmount(1000);
    const remainingSupply = SUPPLY_CAP - currentSupply;

    console.log(
      `Current supply: ${toDisplayAmount(
        currentSupply,
      )} tokens, Remaining: ${toDisplayAmount(remainingSupply)} tokens`,
    );

    const tokensToMint = remainingSupply + toRawTokenAmount(20);
    const solToSend = new anchor.BN(Math.ceil(tokensToMint / TOKENS_PER_SOL));

    console.log(
      `Trying to mint ${toDisplayAmount(
        tokensToMint,
      )} tokens by sending ${lamportsToSol(solToSend)} SOL`,
    );

    try {
      await program.methods
        .mint(solToSend)
        .accounts({
          buyer: buyer.publicKey,
          mint: mint,
          buyerAta: buyerAta,
          treasury: treasuryPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      assert.fail("Minting succeeded but should have failed due to supply cap");
    } catch (error) {
      console.log(
        "Expected error:",
        error.toString().substring(0, 150) + "...",
      );
      assert.include(
        error.toString(),
        "SupplyLimit",
        "Expected supply limit error not received",
      );
      console.log("Supply cap limit correctly enforced");
    }
  });

  it("allows the admin to withdraw funds from treasury", async () => {
    const initialAdminBalance = await connection.getBalance(adminKp.publicKey);
    const initialTreasuryBalance = await connection.getBalance(treasuryPda);

    console.log(
      "Initial treasury balance:",
      lamportsToSol(initialTreasuryBalance),
      "SOL",
    );
    console.log(
      "Initial admin balance:",
      lamportsToSol(initialAdminBalance),
      "SOL",
    );

    assert.isAbove(
      initialTreasuryBalance,
      0,
      "Treasury should have funds from previous tests",
    );

    const amountToWithdraw = new anchor.BN(
      Math.floor(initialTreasuryBalance / 2),
    ); // Withdraw half of the treasury balance

    try {
      const tx = await program.methods
        .withdrawFunds(amountToWithdraw)
        .accounts({
          admin: adminKp.publicKey,
          adminConfig: adminConfigKp.publicKey,
          treasury: treasuryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log("withdrawFunds tx:", tx);

      const newAdminBalance = await connection.getBalance(adminKp.publicKey);
      const newTreasuryBalance = await connection.getBalance(treasuryPda);

      console.log(
        "New treasury balance:",
        lamportsToSol(newTreasuryBalance),
        "SOL",
      );
      console.log("New admin balance:", lamportsToSol(newAdminBalance), "SOL");

      // assert that the treasury balance decreased by the amount we withdrew, which is half of the initial treasury balance
      assert.approximately(
        initialTreasuryBalance - newTreasuryBalance,
        Number(amountToWithdraw),
        10000,
        "Treasury balance did not decrease by approximately the correct amount",
      );

      // assert that the admin balance increased by the amount we withdrew
      assert.isTrue(
        newAdminBalance > initialAdminBalance,
        "Admin balance did not increase after withdrawal",
      );
    } catch (error) {
      console.error("Error in withdraw test:", error);
      throw error;
    }
  });

  it("prevents non-admins from withdrawing funds", async () => {
    const nonAdminKeypair = web3.Keypair.generate();

    const amountToWithdraw = new anchor.BN(1e8);

    try {
      await program.methods
        .withdrawFunds(amountToWithdraw)
        .accounts({
          admin: nonAdminKeypair.publicKey,
          adminConfig: adminConfigKp.publicKey,
          treasury: treasuryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([nonAdminKeypair])
        .rpc();

      assert.fail(
        "Non-admin was able to withdraw funds, but should be prohibited",
      );
    } catch (error) {
      console.log(
        "Expected error occurred:",
        error.toString().substring(0, 150) + "...",
      );
      assert.include(
        error.toString(),
        "UnauthorizedAccess",
        "Expected unauthorized access error not received",
      );
      console.log("Non-admin withdrawal was correctly rejected");
    }
  });
});

function toRawTokenAmount(amount: number) {
  return amount * Math.pow(10, 9);
}

function toDisplayAmount(rawAmount: number) {
  return rawAmount / Math.pow(10, 9);
}

function lamportsToSol(lamports: anchor.BN) {
  return Number(lamports) / anchor.web3.LAMPORTS_PER_SOL;
}
