import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day27 } from "../target/types/day27";

describe("day27", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day27 as Program<Day27>;

  it("Is initialized!", async () => {
    // Add your test here.
    const [counter, bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);
    await program.methods.increment().rpc();
    let count = await program.account.counter.fetch(counter);
    console.log("Count: ", count.count.toString());

    await program.methods.increment().rpc();
    count = await program.account.counter.fetch(counter);
    console.log("Count: ", count.count.toString());

    await program.methods.increment().rpc();
    count = await program.account.counter.fetch(counter);
    console.log("Count: ", count.count.toString());
  });

  it("initialize after giving to system program or draining lamports", async () => {
    const [counter, _bump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("1")], program.programId);

    await program.methods.initialize().accounts({counter: counter}).rpc();

    await program.methods.giveToSystemProgram().accounts({counter: counter}).rpc();

    await program.methods.initialize().accounts({counter: counter}).rpc();
    console.log("account initialized after giving to system program!")

    await program.methods.drainLamports().accounts({counter: counter}).rpc();

    await program.methods.initialize().accounts({counter: counter}).rpc();
    console.log("account initialized after draining lamports!")
  });

  it("initialize3", async () => {
    const [myPda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("2")], program.programId);
    await program.methods.initialize3().accounts({myPda: myPda}).rpc();
    console.log("account initialized3!")
    await program.methods.erase().accounts({myPda: myPda}).rpc();
    console.log("account erased!")
    await program.methods.initialize3().accounts({myPda: myPda}).rpc();
  });
});
