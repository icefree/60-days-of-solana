import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction, Keypair } from "@solana/web3.js";
import { Day43 } from "../target/types/day43";

async function main() {
  console.log("🚀 Starting verification script...");

  // --- Setup Connection and Program ---
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the Anchor program from the workspace.
  const program = anchor.workspace.Day43 as Program<Day43>;

  // --- Prepare Accounts and Data ---
  // The 'payer' is the wallet that signs and pays for the transaction.
  const payer = provider.wallet.publicKey;
  // A new, random keypair to act as the recipient.
  const recipient = Keypair.generate().publicKey;

  // Define the transfer amount using anchor.BN for u64 safety.
  const transferAmount = new anchor.BN(1_000_000_000); // 1 SOL

  console.log(`- Payer: ${payer}`);
  console.log(`- Recipient: ${recipient}`);
  console.log(`- Amount: ${transferAmount.toString()} lamports`);

  // --- Build the Transaction ---
  // A transaction is a container for one or more instructions.
  const tx = new Transaction();

  // Instruction 0: The System Program Transfer.
  // This must immediately precede our program's instruction.
  tx.add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipient,
      lamports: transferAmount.toNumber(), // Safe for 1 SOL
    })
  );

  // Instruction 1: Our program's verification instruction.
  tx.add(
    await program.methods
      .initialize(transferAmount)
      .accounts({
        instructionSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction()
  );

  // --- Send Transaction and Verify Outcome ---
  try {
    const sig = await provider.sendAndConfirm(tx);
    console.log("\n✅ Transaction confirmed!");
    console.log(`Signature: ${sig}`);

    // Fetch the transaction details to inspect the logs.
    const txInfo = await provider.connection.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    console.log("\n📄 Program Logs:");
    console.log(txInfo?.meta?.logMessages?.join("\n"));

    // Check for the success message in the logs.
    const logs = txInfo?.meta?.logMessages;
    if (!logs || !logs.some(log => log.includes(`Verified transfer of ${transferAmount} lamports`))) {
        throw new Error("Verification log message not found!");
    }
    console.log("\n✅ Verification successful!");

  } catch (error) {
    console.error("\n❌ Transaction failed!");
    console.error(error);
    process.exit(1); // Exit with a non-zero error code
  }
}

// --- Script Entrypoint ---
main().then(
  () => process.exit(0),
  err => {
    console.error(err);
    process.exit(1);
  }
);

