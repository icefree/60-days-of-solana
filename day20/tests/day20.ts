import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day20 } from "../target/types/day20";

describe("day20", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day20 as Program<Day20>;

  it("Is initialized!", async () => {
    // Add your test here.
    let storageAccount = anchor.web3.PublicKey.findProgramAddressSync(
      [],
      program.programId
    )[0];
    console.log("storageAccount", storageAccount.toBase58());

    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);

    const accountInfo = await program.provider.connection.getAccountInfo(
      storageAccount
    );
    console.log("accountInfo", accountInfo);

    const tx2 = await program.methods.increaseAccountSize().rpc();
    console.log("Your transaction signature", tx2);

    const accountInfo2 = await program.provider.connection.getAccountInfo(
      storageAccount
    );
    console.log("accountInfo after increase", accountInfo2);
  });
});
