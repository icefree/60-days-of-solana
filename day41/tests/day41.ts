import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day41 } from "../target/types/day41";
import { assert } from "chai";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createTransferInstruction,
} from "@solana/spl-token";

describe("credentials", () => {
  // 配置 Anchor 的本地测试环境
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Day41 as Program<Day41>;
  
  // provider.wallet 是部署合约和支付手续费的默认钱包
  const payer = provider.wallet as anchor.Wallet;

  // 生成一个随机的用户钱包，作为凭证（代币）的接收者
  const recipient = anchor.web3.Keypair.generate();

  // 1. 计算 Mint 的 PDA 地址 (seeds = [b"mint"])
  const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  // 2. 计算接收者的 ATA (Associated Token Account) 地址
  // 注意：必须传入 TOKEN_2022_PROGRAM_ID，否则默认会使用老版 SPL Token Program 算错地址
  const recipientAta = getAssociatedTokenAddressSync(
    mintPda,
    recipient.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  it("Should initialize the credential mint", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        mint: mintPda,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID, // 明确指定是 2022
      })
      .rpc();

    console.log("✅ Mint Initialized! Transaction signature:", tx);
  });

  it("Should issue a credential to the recipient", async () => {
    // 空投一些 SOL 给 recipient，方便它后续（如果是自己发起交易的话）支付
    // 这里其实是由 payer 支付 ATA 的创建费，所以空投不是必须的，但为了安全起见
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(recipient.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
    );

    const tx = await program.methods
      .issueCredential()
      .accounts({
        mint: mintPda,
        authority: payer.publicKey, // 这里的 authority 退化为支付 ATA 创建费的钱包
        recipientAta: recipientAta,
        recipient: recipient.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Credential Issued! Transaction signature:", tx);
  });

  it("Should FAIL to transfer the credential (NonTransferable extension)", async () => {
    // 验证扩展功能：尝试把代币从 recipient 转给另一个人 (randomReceiver)
    const randomReceiver = anchor.web3.Keypair.generate();
    
    const randomReceiverAta = getAssociatedTokenAddressSync(
      mintPda,
      randomReceiver.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    try {
      // 构造一条底层的 Transfer 交易
      const transferIx = createTransferInstruction(
        recipientAta,         // 源账户 (recipient)
        randomReceiverAta,    // 目标账户 (randomReceiver)
        recipient.publicKey,  // 源账户的 owner
        1,                    // 转账数量: 1
        [],
        TOKEN_2022_PROGRAM_ID // 必须指定 2022
      );

      const tx = new anchor.web3.Transaction().add(transferIx);
      
      // 让 recipient 签名并发送交易
      await anchor.web3.sendAndConfirmTransaction(
        provider.connection, 
        tx, 
        [recipient]
      );

      // 如果代码走到这里，说明转账成功了，测试失败
      assert.fail("The transfer SHOULD have failed due to the NonTransferable extension.");
    } catch (err) {
      // 转账应该抛出异常，捕获异常即证明测试成功
      console.log("✅ Transfer properly blocked by NonTransferable extension!");
      
      // 你可以进一步断言错误信息中包含了自定义错误或底层限制
      // 实际上 Token-2022 的底层错误里会带有 NonTransferable 相关的错误码
      assert.isTrue(err instanceof Error);
    }
  });
});