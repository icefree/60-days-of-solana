import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day30 } from "../target/types/day30";

describe("day30", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day30 as Program<Day30>;

  it("Is initialized!", async () => {
    // Add your test here.
    const [pda_account, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [],
      program.programId
    );
    await program.methods.initialize()
    .accounts({
      pdaAccount: pda_account
    }).rpc();
    await program.methods.close()
    .accounts({
      pdaAccount: pda_account
    }).rpc();
    await program.methods.initialize()
    .accounts({
      pdaAccount: pda_account
    }).rpc();
  });
});
