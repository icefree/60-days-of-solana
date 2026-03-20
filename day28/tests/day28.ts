import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day28 } from "../target/types/day28";

describe("day28", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day28 as Program<Day28>;

  it("Is initialized!", async () => {
    const wallet = program.provider.wallet.payer
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [],
      program.programId
    );
    console.log(pda.toBase58());
    let transaction = new anchor.web3.Transaction()
    //frontend init_if_needed
    const accountInfo = await anchor.getProvider().connection.getAccountInfo(pda)
    if (accountInfo == null || accountInfo.lamports == 0 || accountInfo.owner == anchor.web3.SystemProgram.programId) {
      console.log("need init")
      const tx = await program.methods.initialize().accounts({
        pda
      }).transaction()
      transaction.add(tx)
    }else{
      console.log("already inited")
    }
    const tx2 = await program.methods.set(10).accounts({
      pda
    }).transaction()
    transaction.add(tx2)
    const tx3 = await anchor.web3.sendAndConfirmTransaction(anchor.getProvider().connection, transaction, [wallet]);
    console.log("Your transaction signature", tx3);

    const pdaAccount = await program.account.pda.fetch(pda)
    console.log("Pda account", pdaAccount.value)
  });
});
