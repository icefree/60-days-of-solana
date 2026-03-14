import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day18 } from "../target/types/day18";

describe("day18", () => {
  // reset network, deploy other_program, run test
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.day18 as Program<Day18>;
  let target = ''
  it("Is initialized!", async () => {
    // Add your test here.
    const seeds = []
    const [TrueOrFalse, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
    target = TrueOrFalse.toBase58();
    console.log("address: ", program.programId.toBase58());

    await program.methods.initialize().accounts({trueOrFalse: TrueOrFalse}).rpc();
    await program.methods.setx(new anchor.BN(170)).accounts({trueOrFalse: TrueOrFalse}).rpc();
    let trueOrFalseStruct =   await program.account.trueOrFalse.fetch(TrueOrFalse);
    console.log("The value of x is:", trueOrFalseStruct.x.toString());
  });

  it("Fetching data from accounts created by Anchor Solana programs", async () => {
    // the other program's programdId -- make sure the address is correct
    const otherProgramAddress = "3xJiNu8y8vEN5Zk3A2QJUyeUZogNnYqLKpVztU5fZesZ";
    const otherProgramId = new anchor.web3.PublicKey(otherProgramAddress);

    const otherIdl = JSON.parse(
        require("fs").readFileSync("../other_program/target/idl/other_program.json", "utf8")
    );
    //Program signature has changed
    const otherProgram = new anchor.Program(otherIdl as anchor.Idl, anchor.getProvider());
    const seeds = []
    const [trueOrFalseAcc, _bump] = 
	    anchor.web3.PublicKey.findProgramAddressSync(seeds, otherProgramId);
    let otherStorageStruct = await otherProgram.account.trueOrFalse.fetch(trueOrFalseAcc);

    console.log("The value of other_program's flag is:", otherStorageStruct.flag.toString());
  });

  it("Fetching the data for an arbitrary account ", async () => {
    const { Connection, PublicKey } = require("@solana/web3.js");

    const connection = new Connection("http://localhost:8899", "confirmed");
    const publicKey = new PublicKey(target);
    const accountInfo = await connection.getAccountInfo(publicKey);
    console.log(accountInfo);
    console.log("Account Info:", JSON.stringify(accountInfo, null, 2));      
  })
});
