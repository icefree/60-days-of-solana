import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day3 } from "../target/types/day3";

describe("day3", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day3 as Program<Day3>;

  it("call boaty mc boatface!", async () => {
    console.log(program.methods);
    // Add your test here.
    const tx = await program.methods.boatyMcBoatface(new anchor.BN(10)).rpc();
    console.log("Your transaction signature", tx);
  });

});
