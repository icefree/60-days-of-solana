import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day28 } from "../target/types/day28";

describe("day28", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day28 as Program<Day28>;

  it("Is initialized!", async () => {
    const wallet = program.provider.wallet.publicKey
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [],
      program.programId
    );
    const tx = await program.methods.initialize().accounts({
      pda
    }).transaction()
    const tx2 = await program.methods.set(10).accounts({
      pda
    }).transaction()

    let transaction = new anchor.web3.Transaction()
    transaction.add(tx)
    transaction.add(tx2)
    const tx3 = await program.provider.sendAndConfirm(transaction);
    console.log("Your transaction signature", tx3);
  });
});
