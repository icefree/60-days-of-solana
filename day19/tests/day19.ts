import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day19 } from "../target/types/day19";

describe("day19", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day19 as Program<Day19>;

  it("Initialize and set value", async () => {
    // we now have two keys
    const key1 = new anchor.BN(42);
    const key2 = new anchor.BN(43);
    const key3 = new anchor.BN(88);
    const value = new anchor.BN(1337);
    const value2 = new anchor.BN(3389);

    // seeds has two values
    const seeds = [key1.toArrayLike(Buffer, "le", 8), key2.toArrayLike(Buffer, "le", 8)];
    let valueAccount = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    )[0];
    const seeds2 = [key3.toArrayLike(Buffer, "le", 8)];
     let valueAccount2 = anchor.web3.PublicKey.findProgramAddressSync(
      seeds2,
      program.programId
    )[0];

    // functions now take two keys
    await program.methods.initialize(key1, key2, key3).accounts({val: valueAccount, val2: valueAccount2}).rpc();
    await program.methods.set(key1, key2, key3, value, value2).accounts({val: valueAccount, val2: valueAccount2}).rpc();

    // read the account back
    let result1 = await program.account.val.fetch(valueAccount);
    console.log(`the value ${result1.value} was stored in ${valueAccount.toBase58()}`);
    let result2 = await program.account.val.fetch(valueAccount2);
    console.log(`the value2 ${result2.value} was stored in ${valueAccount2.toBase58()}`);
  });
});
