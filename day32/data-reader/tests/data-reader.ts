import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DataReader } from "../target/types/data_reader";

describe("data-reader", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.dataReader as Program<DataReader>;

  it("Is initialized!", async () => {
    // Add your test here.
    //account from 9vnpnaVkgTMNFqqF6kCzZ1RbsCwgPia2cGCw94f3SfK6
    const dataReader = new anchor.web3.PublicKey(
      "9vnpnaVkgTMNFqqF6kCzZ1RbsCwgPia2cGCw94f3SfK6",
    );
    const tx = await program.methods
      .initialize()
      .accounts({ dataReader })
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
