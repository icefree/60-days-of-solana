import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BasicBank } from "../target/types/basic_bank";
import { assert } from "chai";

describe("day37", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.basicBank as Program<BasicBank>;
  const bank = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // Add your test here.

    const tx = await program.methods
      .initialize()
      .accounts({
        bank: bank.publicKey,
      })
      .signers([bank])
      .rpc();
    console.log("Your transaction signature", tx);

    const account = await program.account.bank.fetch(bank.publicKey);
    console.log("Your bank total deposits: ", account.totalDeposits.toString());
  });

  it("create user account", async () => {
    const [userAccountPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-account"),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId,
    );
    const tx = await program.methods
      .createUserAccount()
      .accounts({
        userAccount: userAccountPDA,
        bank: bank.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const userAccount = await program.account.userAccount.fetch(userAccountPDA);
    assert.equal(
      userAccount.owner.toString(),
      program.provider.wallet.publicKey.toString(),
    );
    assert.equal(userAccount.balance.toString(), "0");
  });

  it("deposit", async () => {
    const [userAccountPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-account"),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId,
    );
    const depositAmount = new anchor.BN(1000000);
    const tx = await program.methods
      .deposit(depositAmount)
      .accounts({
        userAccount: userAccountPDA,
        bank: bank.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const userAccount = await program.account.userAccount.fetch(userAccountPDA);
    assert.equal(userAccount.balance.toString(), depositAmount.toString());

    const bankAccount = await program.account.bank.fetch(bank.publicKey);
    assert.equal(
      bankAccount.totalDeposits.toString(),
      depositAmount.toString(),
    );
  });

  it("get balance", async () => {
    const [userAccountPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-account"),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId,
    );
    const balance = await program.methods
      .balance()
      .accounts({
        userAccount: userAccountPDA,
        user: program.provider.wallet.publicKey,
      })
      .view();

    console.log("Your user balance: ", balance.toString());
  });

  it("withdraw", async () => {
    const [userAccountPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-account"),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId,
    );
    const withdrawAmount = new anchor.BN(500000);
    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        userAccount: userAccountPDA,
        bank: bank.publicKey,
      })
      .rpc();

    const userAccount = await program.account.userAccount.fetch(userAccountPDA);
    assert.equal(userAccount.balance.toString(), "500000");

    const bankAccount = await program.account.bank.fetch(bank.publicKey);
    assert.equal(bankAccount.totalDeposits.toString(), "500000");
  });

  it("Prevents users from withdrawing more than their balance", async () => {
    // Try to withdraw more than the balance
    const excessiveWithdrawAmount = new anchor.BN(10_000_000); // 10 SOL
    const [userAccountPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-account"),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId,
    );

    try {
      await program.methods
        .withdraw(excessiveWithdrawAmount)
        .accounts({
          userAccount: userAccountPDA,
          bank: bank.publicKey,
        })
        .rpc();

      // If we reach here, the test failed
      assert.fail("Should have thrown an error for insufficient balance");
    } catch (error) {
      // Log the actual error
      console.log("Error received:", error.toString());

      // Check for multiple possible error messages that could indicate insufficient balance
      const errorMsg = error.toString().toLowerCase();
      assert.isTrue(
        errorMsg.includes("insufficient balance") || errorMsg.includes("0x7d3"),
      );
    }
  });
});
