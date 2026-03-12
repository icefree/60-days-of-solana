import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day12 } from "../target/types/day12";

describe("day12", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day12 as Program<Day12>;

  const StakeHistory_PublicKey = new anchor.web3.PublicKey(
    anchor.web3.SYSVAR_STAKE_HISTORY_PUBKEY
  );

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
    .initialize(3)
    .accounts({
      stakeHistory: StakeHistory_PublicKey,
      recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
      instructionSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      lastRestartSysvar: new anchor.web3.PublicKey("SysvarLastRestartS1ot1111111111111111111111"),
    })
    .rpc();
    console.log("Your transaction signature", tx);
  });
});
