import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day15 } from "../target/types/day15";

describe("day15", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day15 as Program<Day15>;

  const defaultKeyPair = new anchor.web3.PublicKey(
    "D9FbrJD6gSoanhzcXmH8UvWXU3QnfSe8P1WViRKCQmwX"
  );

 it("Is initialized!", async () => {
    // log the keypair's initial balance
    let bal_before = await program.provider.connection.getBalance(
      defaultKeyPair
    );
    console.log("before:", bal_before);

    // call the initialize function of our program
    const tx = await program.methods.initialize().rpc();

    // log the keypair's balance after
    let bal_after = await program.provider.connection.getBalance(
      defaultKeyPair
    );
    console.log("after:", bal_after);

    // log the difference
    //Regardless of the compute units consumed, the transaction charged 5000 lamports or 0.000005 SOL.
    console.log(
      "diff:",
      BigInt(bal_before.toString()) - BigInt(bal_after.toString())
    );
  });
});
