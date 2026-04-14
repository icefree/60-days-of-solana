
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { assert } from "chai";
import { Clock, LiteSVM } from "litesvm";
import { Day40 } from "../target/types/day40";
// Constants
const STARTING_PRICE = new BN(2_000_000_000); // 2 SOL
const FLOOR_PRICE = new BN(500_000_000); // 0.5 SOL
const DURATION = new BN(3600); // 1 hour

function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

describe("dutch-auction", () => {
  // Define our test variables
  let svm: LiteSVM;
  let provider: LiteSVMProvider;
  let program: Program<Day40>;

  // Define our test accounts
  const seller = Keypair.generate();
  const buyer = Keypair.generate();
  let auctionAccount= Keypair.generate();
  let mintKp: Keypair;
  let sellerAta: PublicKey;
  let buyerAta: PublicKey;
  let vaultAuth: PublicKey;
  let vault: PublicKey;

  before(async () => {
    // Initialize LiteSVM from the workspace and add SPL/Builtins/Sysvars
    svm = fromWorkspace("./").withDefaultPrograms().withBuiltins().withSysvars();
    provider = new LiteSVMProvider(svm);
    anchor.setProvider(provider);
    program = anchor.workspace.day40 as Program<Day40>;

    // Airdrop funds to seller and buyer
    svm.airdrop(seller.publicKey, BigInt(10 * LAMPORTS_PER_SOL)); // Airdrop 10 SOL to seller
    svm.airdrop(buyer.publicKey, BigInt(10 * LAMPORTS_PER_SOL)); // Airdrop 10 SOL to buyer

    // Create NFT mint (0 decimals) with seller as mint authority
    mintKp = Keypair.generate();
    const LAMPORTS_FOR_MINT = 1_000_000_000; // sufficient for rent in tests

    const createMintIx = SystemProgram.createAccount({
      fromPubkey: seller.publicKey,
      newAccountPubkey: mintKp.publicKey,
      lamports: LAMPORTS_FOR_MINT,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    });
    const initMintIx = createInitializeMintInstruction(
      mintKp.publicKey,
      0, // decimals
      seller.publicKey, // mint authority
      null // freeze authority
    );
    const mintTx = new Transaction().add(createMintIx, initMintIx);
    mintTx.recentBlockhash = svm.latestBlockhash();
    mintTx.feePayer = seller.publicKey;
    mintTx.sign(seller, mintKp);
    svm.sendTransaction(mintTx);

    // Create ATA for the seller
    sellerAta = await getAssociatedTokenAddress(mintKp.publicKey, seller.publicKey);
    const createSellerAtaIx = createAssociatedTokenAccountInstruction(
      seller.publicKey,
      sellerAta,
      seller.publicKey,
      mintKp.publicKey
    );
    const sellerAtaTx = new Transaction().add(createSellerAtaIx);
    sellerAtaTx.recentBlockhash = svm.latestBlockhash();
    sellerAtaTx.feePayer = seller.publicKey;
    sellerAtaTx.sign(seller);
    svm.sendTransaction(sellerAtaTx);

		// Create ATA for the buyer
    buyerAta = await getAssociatedTokenAddress(mintKp.publicKey, buyer.publicKey);
    const createBuyerAtaIx = createAssociatedTokenAccountInstruction(
      buyer.publicKey,
      buyerAta,
      buyer.publicKey,
      mintKp.publicKey
    );
    const buyerAtaTx = new Transaction().add(createBuyerAtaIx);
    buyerAtaTx.recentBlockhash = svm.latestBlockhash();
    buyerAtaTx.feePayer = buyer.publicKey;
    buyerAtaTx.sign(buyer);
    svm.sendTransaction(buyerAtaTx);

    // Mint 1 token to seller's ATA
    const mintToIx = createMintToInstruction(
      mintKp.publicKey,
      sellerAta,
      seller.publicKey,
      BigInt(1)
    );
    const mintToTx = new Transaction().add(mintToIx);
    mintToTx.recentBlockhash = svm.latestBlockhash();
    mintToTx.feePayer = seller.publicKey;
    mintToTx.sign(seller);
    svm.sendTransaction(mintToTx);

    // Find PDA for vault authority and associated token account
    [vaultAuth] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), auctionAccount.publicKey.toBuffer()],
      program.programId
    );
    vault = await getAssociatedTokenAddress(
      mintKp.publicKey,
      vaultAuth,
      true
    );

    // Initialize the auction (moves 1 token from seller ATA to vault)
    await program.methods
      .initializeAuction(STARTING_PRICE, FLOOR_PRICE, DURATION)
      .accounts({
        auction: auctionAccount.publicKey,
        seller: seller.publicKey,
        sellerAta,
        vaultAuth,
        vault,
        mint: mintKp.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller, auctionAccount])
      .rpc();
  });

  it("initializes auction state correctly", async () => {
    const auction = await program.account.auction.fetch(auctionAccount.publicKey);
    assert.ok(auction.seller.equals(seller.publicKey));
    assert.equal(auction.startingPrice.toNumber(), STARTING_PRICE.toNumber());
    assert.equal(auction.floorPrice.toNumber(), FLOOR_PRICE.toNumber());
    assert.equal(auction.tokenMint.toBase58(), mintKp.publicKey.toBase58());
    // Seller's NFT should have moved to vault during initialization
    const vaultAcc = svm.getAccount(vault);
    assert.isNotNull(vaultAcc, "Vault ATA must exist");
  });

  it("executes buy at 25% time with expected price and transfers NFT", async () => {
    const auction = await program.account.auction.fetch(auctionAccount.publicKey);
    const startTime = auction.startTime.toNumber();
    const duration = auction.duration.toNumber();
    const quarterTime = startTime + Math.floor(duration / 4);

    // Warp clock to 25% into the auction
    const c = svm.getClock();
    svm.setClock(
      new Clock(c.slot, c.epochStartTimestamp, c.epoch, c.leaderScheduleEpoch, BigInt(quarterTime))
    );

    // Check buyer's lamports before purchase
    const balanceBefore = svm.getBalance(buyer.publicKey)!;

    // Execute the buy transaction
    console.log('Executing buy transaction...');
    await program.methods
      .buy()
      .accounts({
        auction: auctionAccount.publicKey,
        seller: seller.publicKey,
        buyer: buyer.publicKey,
        buyerAta,
        vaultAuth,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    // Check buyer's lamports after purchase
    const balanceAfter = svm.getBalance(buyer.publicKey)!;
    // Calculate the price paid and log it
    const pricePaid = Number(balanceBefore - balanceAfter);
    console.log(`Actual price paid: ${lamportsToSol(pricePaid)}`);

    // Expected price at 25% through the auction duration:
    // Starting price - ((Starting price - Floor price) * 0.25) =
    // 2 SOL - ((2 SOL - 0.5 SOL) * 0.25) = 1.625 SOL = 1,625,000,000 lamports
    const expectedPriceAt25Percent = 1_625_000_000;
    // Assert that the price paid is equal to the expected price
    assert.equal(
      pricePaid,
      expectedPriceAt25Percent,
      "Buyer should pay the 25% elapsed linear price"
    );

    // Verify buyer received the NFT (amount stored at bytes 64..72)
    const buyerAtaAcc = svm.getAccount(buyerAta)!;
    // Read the token amount as u64 (little-endian) from offset 64
    const amount = Number(Buffer.from(buyerAtaAcc.data).readBigUInt64LE(64));
    assert.equal(amount, 1, "Buyer ATA should now contain 1 token");
  });


});

