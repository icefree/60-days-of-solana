import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day17 } from "../target/types/day17";

describe("day17", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day17 as Program<Day17>;

  it("Is initialized!", async () => {
    // Add your test here.
    const seeds = []
    const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    );
    console.log("the storage account address is", myStorage.toBase58());

    const tx = await program.methods.initialize().accounts({
      myStorage: myStorage
    }).rpc();

    const tx2 = await program.methods.set(new anchor.BN(170)).accounts({
      myStorage: myStorage
    }).rpc();

    await program.methods.increaseX().accounts({
      myStorage: myStorage
    }).rpc();

    await program.methods.printX().accounts({
      myStorage: myStorage
    }).rpc();
  });
});
