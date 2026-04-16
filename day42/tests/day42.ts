import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day42 } from "../target/types/day42";
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
  getMint,
  getInterestBearingMintConfigState,
} from "@solana/spl-token";
import {
  PublicKey,
  Keypair,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import assert from "assert";

// Constants for interest calculations (must be at module level)
const SECONDS_PER_YEAR = 365.24 * 24 * 60 * 60; // 365.24 days
const ONE_IN_BASIS_POINTS = 10000;

/**
 * Calculate the exponential factor for continuous compounding
 * This mirrors the SPL Token implementation exactly.
 * We are copying it here because it's not exported from the SPL token library.
 *
 * Formula: e^((rate * timespan) / (SECONDS_PER_YEAR * 10000))
 *
 * @param t1 - Start time in seconds
 * @param t2 - End time in seconds
 * @param rateBps - Interest rate in basis points
 */
const calculateExponentForTimesAndRate = (
  t1: number,
  t2: number,
  rateBps: number
): number => {
  const timespan = t2 - t1;
  const numerator = rateBps * timespan;
  const exponent = numerator / (SECONDS_PER_YEAR * ONE_IN_BASIS_POINTS);
  return Math.exp(exponent);
};

describe("interest-bearing", () => {
  // Set up a lightweight Solana VM for testing
  const svm = fromWorkspace("./").withBuiltins().withSysvars();
  const provider = new LiteSVMProvider(svm);
  anchor.setProvider(provider);

  // Get reference to our compiled program
  const program = anchor.workspace.Day42 as Program<Day42>;

  // Key accounts we'll use throughout the tests
  let mint: Keypair;
  let rateAuthority: Keypair;
  let recipient: Keypair;
  let recipientAta: PublicKey;

  // Interest rates in basis points (1 basis point = 0.01%)
  const RATE_1_BPS = 300; // 3.00% annual rate
  const RATE_2_BPS = 500; // 5.00% annual rate
  const RATE_3_BPS = 700; // 7.00% annual rate

  // More precise year definition (accounts for leap years)
  const SECONDS_PER_YEAR = 365.24 * 24 * 60 * 60; // ~31,556,736 seconds

  // Token configuration
  const DECIMALS = 9;
  const INITIAL_BALANCE = 1000; // Start with 1000 tokens (UI amount)

  // Starting point for our virtual clock (Jan 1, 2024)
  const INITIAL_TIMESTAMP = 1704067200n;

  /**
   * Get UI amount for interest-bearing tokens
   * This implements the exact same logic as amountToUiAmountForInterestBearingMintWithoutSimulation
   * from the SPL Token library, adapted for LiteSVM
   *
   * The calculation happens in two phases:
   * 1. Pre-update: Interest from initialization to last rate update
   * 2. Post-update: Interest from last rate update to current time
   *
   * Total scale = e^(r1*t1) * e^(r2*t2)
   */
  const getInterestBearingUiAmount = async (
    rawAmount: bigint
  ): Promise<number> => {
    // Fetch mint configuration
    const mintInfo = await getMint(
      provider.connection,
      mint.publicKey,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const interestConfig = getInterestBearingMintConfigState(mintInfo);
    if (!interestConfig) {
      throw new Error("Interest config not found");
    }

    // Get current timestamp from LiteSVM clock
    const currentTimestamp = Number(svm.getClock().unixTimestamp);
    const lastUpdateTimestamp = Number(interestConfig.lastUpdateTimestamp);
    const initializationTimestamp = Number(
      interestConfig.initializationTimestamp
    );

    // Calculate pre-update exponent (initialization to last update)
    const preUpdateExp = calculateExponentForTimesAndRate(
      initializationTimestamp,
      lastUpdateTimestamp,
      interestConfig.preUpdateAverageRate
    );

    // Calculate post-update exponent (last update to current time)
    const postUpdateExp = calculateExponentForTimesAndRate(
      lastUpdateTimestamp,
      currentTimestamp,
      interestConfig.currentRate
    );

    // Total scale factor is the product of both exponentials
    const totalScale = preUpdateExp * postUpdateExp;

    // Apply the scale to the raw amount
    const scaledAmount = Number(rawAmount) * totalScale;

    // Convert to UI amount by dividing by decimal factor
    const decimalFactor = Math.pow(10, DECIMALS);
    const uiAmount = Math.trunc(scaledAmount) / decimalFactor;

    return uiAmount;
  };

  /**
   * Manually calculate expected balance with continuous compounding
   * This serves as our "test oracle" to verify the SPL Token calculations are correct
   *
   * Formula: A_final = A_start * e^(rate * time_in_years)
   */
  const calculateExpectedBalance = (
    startBalance: number,
    rateBps: number,
    timeInYears: number
  ): number => {
    const rateDecimal = rateBps / 10000;
    return startBalance * Math.exp(rateDecimal * timeInYears);
  };

  before(async () => {
    // Set our virtual clock to Jan 1, 2024 (for a consistent starting point)
    const clock = svm.getClock();
    clock.unixTimestamp = INITIAL_TIMESTAMP;
    svm.setClock(clock);
    console.log("Initial clock set to:", INITIAL_TIMESTAMP.toString());

    // Generate fresh keypairs for this test run
    mint = Keypair.generate();
    rateAuthority = Keypair.generate();
    recipient = Keypair.generate();

    // Give accounts some SOL to pay for transactions
    svm.airdrop(provider.wallet.publicKey, BigInt(5 * LAMPORTS_PER_SOL));
    svm.airdrop(recipient.publicKey, BigInt(5 * LAMPORTS_PER_SOL));
  });

  /**
   * Test 1: Create the interest-bearing mint
   */
  it("creates an interest bearing mint", async () => {
    // Call our program to initialize the mint with starting rate of 3%
    await program.methods
      .createInterestBearingMint(RATE_1_BPS, DECIMALS)
      .accounts({
        payer: provider.wallet.publicKey, // Who pays for the transaction
        mint: mint.publicKey, // The new mint we're creating
        rateAuthority: rateAuthority.publicKey, // Who can update interest rates
      })
      .signers([rateAuthority, mint])
      .rpc();
    
    // Verify the mint was created with correct configuration
    const mintInfo = await getMint(
      provider.connection,
      mint.publicKey,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const interestConfig = await getInterestBearingMintConfigState(mintInfo);
    console.log("Interest-bearing config:", {
      rateAuthority: interestConfig?.rateAuthority?.toBase58(),
      currentRate: interestConfig?.currentRate,
      initializationTimestamp: interestConfig?.initializationTimestamp,
      lastUpdateTimestamp: interestConfig?.lastUpdateTimestamp,
    });

    // Ensure initialization timestamp was recorded (important for interest calculations)
    assert.ok(
      interestConfig?.initializationTimestamp !== 0,
      "Initialization timestamp should not be 0"
    );
  });

  /**
   * Test 2: Mint initial tokens to recipient
   */
  it("mints tokens to a recipient", async () => {
    recipientAta = getAssociatedTokenAddressSync(
      mint.publicKey,
      recipient.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Create the ATA (it doesn't exist yet)
    const createAtaTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        recipientAta,
        recipient.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );
    await provider.sendAndConfirm(createAtaTx, []);

    // Mint the initial balance of tokens to the recipient
    // Convert UI amount (1000) to raw amount (1000 * 10^9)
    await program.methods
      .mintTokens(new anchor.BN(INITIAL_BALANCE * 10 ** DECIMALS))
      .accounts({
        mint: mint.publicKey,
        toTokenAccount: recipientAta,
        recipient: recipient.publicKey,
      })
      .signers([recipient])
      .rpc();

    // Verify the correct amount was minted
    const tokenAccount = await getAccount(
      provider.connection,
      recipientAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    // For interest-bearing tokens, we need to use the SPL Token method to get UI amount
    const balance = await getInterestBearingUiAmount(tokenAccount.amount);
    assert.strictEqual(
      balance,
      INITIAL_BALANCE,
      `Initial balance should be ${INITIAL_BALANCE}`
    );
    console.log(`Initial balance: ${balance} tokens`);
  });

  /**
   * Test 3: demonstrate compound interest over 15 months
   *
   * Timeline:
   * 1. Start with 1000 tokens at 3% rate
   * 2. Wait 3 months → balance grows with 3% rate
   * 3. Change rate to 5%
   * 4. Wait 9 more months → balance grows with 5% rate (12 months total)
   * 5. Change rate to 7%
   * 6. Wait 3 more months → balance grows with 7% rate (15 months total)
   */
  it("demonstrates compounded interest growth: 3 months, 12 months, 15 months", async () => {
    console.log("\n=== Starting Interest Accrual Test ===");
    console.log(`Starting balance: ${INITIAL_BALANCE} tokens\n`);

    // ==================================
    // PERIOD 1: First 3 months at 3% annual rate
    // ==================================
    console.log(`\n--- Period 1: 3 Months @ ${RATE_1_BPS / 100}% ---`);

    // Fast-forward time by 3 months (0.25 years)
    const clock1 = svm.getClock();
    clock1.unixTimestamp += BigInt(Math.floor(SECONDS_PER_YEAR * 0.25));
    svm.setClock(clock1);

    // Check the recipient's token balance
    const tokenAccount1 = await getAccount(
      provider.connection,
      recipientAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    // Use the official SPL Token method to get UI amount with interest applied
    const balanceAfter3Months = await getInterestBearingUiAmount(
      tokenAccount1.amount
    );

    // Calculate what we expect using the continuous compounding formula
    const expectedBalance1 = calculateExpectedBalance(
      INITIAL_BALANCE,
      RATE_1_BPS,
      0.25
    );

    console.log(`Balance after 3 months: ${balanceAfter3Months.toFixed(6)}`);
    console.log(
      `Expected balance (A = P e^{r t}): ${expectedBalance1.toFixed(6)}`
    );
    console.log(
      `Interest earned: ${(balanceAfter3Months - INITIAL_BALANCE).toFixed(6)}`
    );

    // Verify the calculation is correct (within 0.01 token tolerance)
    assert.ok(
      Math.abs(balanceAfter3Months - expectedBalance1) < 0.01,
      "Balance after 3 months is incorrect"
    );

    // ===============================================
    // PERIOD 2: Change rate to 5%, then advance 9 more months
    // ===============================================

    // Update the interest rate to 5%
    await program.methods
      .updateRate(RATE_2_BPS)
      .accounts({
        mint: mint.publicKey,
        rateAuthority: rateAuthority.publicKey,
      })
      .signers([rateAuthority])
      .rpc();

    console.log(
      `\n--- Period 2: 9 Months @ ${
        RATE_2_BPS / 100
      }% after initial 3 months (total = 12 months) ---`
    );

    // Fast-forward time by 9 more months (total of 12 months from start)
    const clock2 = svm.getClock();
    clock2.unixTimestamp += BigInt(Math.floor(SECONDS_PER_YEAR * 0.75));
    svm.setClock(clock2);

    const tokenAccount2 = await getAccount(
      provider.connection,
      recipientAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    // Get UI amount using SPL Token's official method
    const balanceAfter12Months = await getInterestBearingUiAmount(
      tokenAccount2.amount
    );

    // Expected: (balance after 3 months) * e^(0.05 * 0.75)
    const expectedBalance2 = calculateExpectedBalance(
      balanceAfter3Months,
      RATE_2_BPS,
      0.75
    );

    console.log(`Balance after 12 months: ${balanceAfter12Months.toFixed(6)}`);
    console.log(
      `Expected balance (A2 = A1 * e^{r2 * 0.75}): ${expectedBalance2.toFixed(
        6
      )}`
    );
    console.log(
      `Total interest earned: ${(
        balanceAfter12Months - INITIAL_BALANCE
      ).toFixed(6)}`
    );

    assert.ok(
      Math.abs(balanceAfter12Months - expectedBalance2) < 0.01,
      "Balance after 12 months is incorrect"
    );

    // ==============================================
    // PERIOD 3: Change rate to 7%, then advance final 3 months
    // ==============================================

    // Update the interest rate to 7%
    await program.methods
      .updateRate(RATE_3_BPS)
      .accounts({
        mint: mint.publicKey,
        rateAuthority: rateAuthority.publicKey,
      })
      .signers([rateAuthority])
      .rpc();

    console.log(
      `\n--- Period 3: extra 3 Months @ ${
        RATE_3_BPS / 100
      }% (total = 15 months) ---`
    );

    // Fast-forward time by 3 final months (total of 15 months from start)
    const clock3 = svm.getClock();
    clock3.unixTimestamp += BigInt(Math.floor(SECONDS_PER_YEAR * 0.25));
    svm.setClock(clock3);

    const tokenAccount3 = await getAccount(
      provider.connection,
      recipientAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    // Get final UI amount using SPL Token's official method
    const balanceAfter15Months = await getInterestBearingUiAmount(
      tokenAccount3.amount
    );

    // Expected: (balance after 12 months) * e^(0.07 * 0.25)
    const expectedBalance3 = calculateExpectedBalance(
      balanceAfter12Months,
      RATE_3_BPS,
      0.25
    );

    console.log(`Balance after 15 months: ${balanceAfter15Months.toFixed(6)}`);
    console.log(
      `Expected balance (A3 = A2 * e^{r3 * 0.25}): ${expectedBalance3.toFixed(
        6
      )}`
    );
    console.log(
      `Total interest earned: ${(
        balanceAfter15Months - INITIAL_BALANCE
      ).toFixed(6)}`
    );
    console.log(
      `Effective return over 15 months: ${(
        (balanceAfter15Months / INITIAL_BALANCE - 1) *
        100
      ).toFixed(6)}%`
    );

    // Final verification (slightly larger tolerance for accumulated rounding)
    assert.ok(
      Math.abs(balanceAfter15Months - expectedBalance3) < 0.02,
      "Final balance after 15 months is incorrect"
    );
  });
});

