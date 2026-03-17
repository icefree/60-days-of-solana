import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day23 } from "../target/types/day23";

describe("day23", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day23 as Program<Day23>;

  async function printAccountBalance(account) {
    const balance = await anchor.getProvider().connection.getBalance(account);
    console.log(`${account} has ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
  }

  it("sol_splitter", async () => {
    // generate a new wallet
    const recipient1 = anchor.web3.Keypair.generate();
    const recipient2 = anchor.web3.Keypair.generate();
    const recipient3 = anchor.web3.Keypair.generate();

    await printAccountBalance(recipient1.publicKey);
    await printAccountBalance(recipient2.publicKey);
    await printAccountBalance(recipient3.publicKey);

    // send the account 1 SOL via the program
    let amount = new anchor.BN(3 * anchor.web3.LAMPORTS_PER_SOL);
    await program.methods.sendSol(amount)
      .remainingAccounts([
        { pubkey: recipient1.publicKey, isSigner: false, isWritable: true },
        { pubkey: recipient2.publicKey, isSigner: false, isWritable: true },
        { pubkey: recipient3.publicKey, isSigner: false, isWritable: true },
      ])
      .rpc();

    await printAccountBalance(recipient1.publicKey);
    await printAccountBalance(recipient2.publicKey);
    await printAccountBalance(recipient3.publicKey);
  });
});
