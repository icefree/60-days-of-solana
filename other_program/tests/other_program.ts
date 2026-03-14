import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OtherProgram } from "../target/types/other_program";

describe("other_program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.otherProgram as Program<OtherProgram>;

  it("Is initialized!", async () => {
    const [trueOrFalse, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [],
      program.programId
    );
    console.log("address: ", program.programId.toBase58());
    await program.methods.initialize().accounts({
      trueOrFalse
    }).rpc();
    let account = await program.account.trueOrFalse.fetch(trueOrFalse);
    console.log(account);
    await program.methods.set(true).accounts({
      trueOrFalse
    }).rpc();
    account = await program.account.trueOrFalse.fetch(trueOrFalse);
    console.log(account);
  });
});
