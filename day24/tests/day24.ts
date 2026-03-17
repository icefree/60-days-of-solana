import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day24 } from "../target/types/day24";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";

describe("day24", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.day24 as Program<Day24>;

  async function airdropSol(publicKey, amount) {
    let tx = await anchor.getProvider().connection.requestAirdrop(
      publicKey,
      amount
    );
    await confirmTransaction(tx);
  }

  async function confirmTransaction(tx) {
    const latestBlockHash = await anchor.getProvider().connection.getLatestBlockhash();
    let res = await anchor.getProvider().connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: tx,
    });
  }

  it("Is initialized!", async () => {
    const alice = anchor.web3.Keypair.generate();
    const bob = anchor.web3.Keypair.generate();
    const mallory = anchor.web3.Keypair.generate(); 

    const airdrop_alice_tx = await anchor.getProvider().connection.requestAirdrop(alice.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdrop_alice_tx);

    const airdrop_alice_bob = await anchor.getProvider().connection.requestAirdrop(bob.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdrop_alice_bob);

    const airdrop_alice_mallory = await anchor.getProvider().connection.requestAirdrop(mallory.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdrop_alice_mallory);
    
    let seeds_alice = [alice.publicKey.toBytes()];
    const [playerAlice, _bumpA] = anchor.web3.PublicKey.findProgramAddressSync(seeds_alice, program.programId);

    let seeds_bob = [bob.publicKey.toBytes()];
    const [playerBob, _bumpB] = anchor.web3.PublicKey.findProgramAddressSync(seeds_bob, program.programId);

    let seeds_mallory = [mallory.publicKey.toBytes()];
    const [playerMallory, _bumpM] = anchor.web3.PublicKey.findProgramAddressSync(seeds_mallory, program.programId);

    // ALICE INITIALIZE ACCOUNT
    await program.methods.initialize().accounts({
      player: playerAlice,
      signer: alice.publicKey
    }).signers([alice]).rpc();

    await program.methods.initialize().accounts({
      player: playerBob,
      signer: bob.publicKey
    }).signers([bob]).rpc();

    await program.methods.initialize().accounts({
      player: playerMallory,
      signer: mallory.publicKey
    }).signers([mallory]).rpc();

    // Alice WRITE TO ACCOUNT
    await program.methods.updateValue(new anchor.BN(5)).accounts({
      from: playerAlice,
      to: playerBob,
      authority: alice.publicKey
    }).signers([alice]).rpc();

    await program.methods.updateValue(new anchor.BN(5)).accounts({
      from: playerBob,
      to: playerMallory,
      authority: mallory.publicKey
    }).signers([mallory]).rpc();

    console.log(`Alice has ${(await program.account.player.fetch(playerAlice)).points} points`);
    console.log(`Bob   has ${(await program.account.player.fetch(playerBob  )).points} points`);
    console.log(`Mallory has ${(await program.account.player.fetch(playerMallory)).points} points`);
  });
});
