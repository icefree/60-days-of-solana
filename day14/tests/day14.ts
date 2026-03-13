import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day14 } from "../target/types/day14";

describe("day14", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day14 as Program<Day14>;

  let myKeypair = anchor.web3.Keypair.generate();
  let myKeypair2 = anchor.web3.Keypair.generate();
  let myKeypair3 = anchor.web3.Keypair.generate();
  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize()
    .accounts({
      signer1: myKeypair3.publicKey,
      signer2: myKeypair.publicKey,
      signer3: myKeypair2.publicKey,
    })
    .signers([myKeypair3])
    .rpc();
    console.log("Your transaction signature", tx);
    console.log("The signer1:", program.provider.publicKey.toBase58());
    console.log("The signer2:", myKeypair.publicKey.toBase58());
    console.log("The signer3:", myKeypair2.publicKey.toBase58());
  });
});
