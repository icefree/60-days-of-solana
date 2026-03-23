import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DataHolder } from "../target/types/data_holder";

describe("data-holder", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.dataHolder as Program<DataHolder>;

  it("Is initialized!", async () => {
    const [dataHolderPDA, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [],
      program.programId,
    );
    await program.methods
      .initialize()
      .accounts({
        dataHolder: dataHolderPDA,
      })
      .rpc();
    const dataHolder = await program.account.dataHolder.fetch(dataHolderPDA);
    console.log("dataHolder.x", dataHolder.x.toString());
    console.log("dataHolderPDA address:", dataHolderPDA.toBase58());
    //9vnpnaVkgTMNFqqF6kCzZ1RbsCwgPia2cGCw94f3SfK6
  });
});
