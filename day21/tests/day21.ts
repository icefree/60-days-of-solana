import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day21 } from "../target/types/day21";

describe("day21", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day21 as Program<Day21>;
  let pubKey = new anchor.web3.PublicKey("3ctNjDas7VvsZ5jPoKdfrmB1Lr1tbt48mb8MW1QVsF45")

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.readBalance().accounts({
      acct: pubKey,
    }).rpc();
    console.log("Your transaction signature", tx);
  });
});
