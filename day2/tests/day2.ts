import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day2 } from "../target/types/day2";

describe("day2", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day2 as Program<Day2>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize(new anchor.BN(2), new anchor.BN(1), "hello").rpc();
    console.log("Your transaction signature", tx);
  });

  it("Array test", async () => {
    const tx = await program.methods.array([new anchor.BN(1), new anchor.BN(2), new anchor.BN(3)]).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Cbrt test", async () => {
    const tx = await program.methods.cbrt(8.0).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Calculator add test", async () => {
    // 调用的是 program (对应的由 #[program] 处理的 day2 module)
    const tx = await program.methods.add(new anchor.BN(2), new anchor.BN(1)).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Calculator sub test", async () => {
    // 调用的是 program (对应的由 #[program] 处理的 day2 module)
    const tx = await program.methods.sub(new anchor.BN(2), new anchor.BN(1)).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Calculator div test", async () => {
    // 调用的是 program (对应的由 #[program] 处理的 day2 module)
    const tx = await program.methods.div(new anchor.BN(2), new anchor.BN(1)).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Calculator mul test", async () => {
    // 调用的是 program (对应的由 #[program] 处理的 day2 module)
    const tx = await program.methods.mul(new anchor.BN(2), new anchor.BN(1)).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Calculator sqrt test", async () => {
    // 调用的是 program (对应的由 #[program] 处理的 day2 module)
    const tx = await program.methods.sqrt(4.0).rpc();
    console.log("Your transaction signature", tx);
  });

  it("Calculator log10 test", async () => {
    // 调用的是 program (对应的由 #[program] 处理的 day2 module)
    const tx = await program.methods.log10(10.0).rpc();
    console.log("Your transaction signature", tx);
  });
  
});
