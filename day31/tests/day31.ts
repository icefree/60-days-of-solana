import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day31 } from "../target/types/day31";

async function airdropSol(publicKey, amount) {
  let airdropTx = await anchor
    .getProvider()
    .connection.requestAirdrop(
      publicKey,
      amount * anchor.web3.LAMPORTS_PER_SOL,
    );

  await confirmTransaction(airdropTx);
}

async function confirmTransaction(tx) {
  const latestBlockHash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();

  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: tx,
  });
}

describe("day31", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day31 as Program<Day31>;

  it("Is initialized!", async () => {
    const someAccount = anchor.web3.Keypair.generate();
    await airdropSol(someAccount.publicKey, 2);
    // shall fail
    // await program.methods.foo().accounts({
    //   someAccount: someAccount.publicKey
    // }).rpc();

    await program.methods.hello().rpc();
  });

  it("Load account with accountInfo", async () => {
    const wallet = program.provider.wallet;
    // CREATE AN ACCOUNT NOT OWNED BY THE PROGRAM
    const newKeypair = anchor.web3.Keypair.generate();
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: newKeypair.publicKey,
        space: 16,
        lamports: await anchor
          .getProvider()
          .connection.getMinimumBalanceForRentExemption(32),
        programId: program.programId,
      }),
    );

    await anchor.web3.sendAndConfirmTransaction(
      anchor.getProvider().connection,
      tx,
      [wallet.payer, newKeypair],
    );

    // READ THE DATA IN THE ACCOUNT
    await program.methods
      .bar()
      .accounts({ someAccount: newKeypair.publicKey })
      .rpc();
  });
});
