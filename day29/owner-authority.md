# Owner and Authority in Solana

## Core Difference: Owner is a Program, Authority is a Wallet

- **Owner**: In Solana, an **Owner** must be a program. Only a program can write or modify data within the accounts it owns. A program cannot write data to arbitrary accounts it does not own.

- **Authority**: This is typically a wallet address. An **Authority** cannot directly modify account data. Instead, it provides a valid signature to instruct the **Owner** (the program) to modify the data on its behalf.

## Key Concepts

- **You don't own your wallet**: Regular users are not the true "owners" of their wallet accounts; the **System Program** is. When you transfer SOL, you send a signed transaction to the **System Program**. It verifies your signature (your **Authority**) and modifies the balance for you.

- **Solana vs. Solidity**: In Ethereum (Solidity), "owner" is merely a design pattern representing an address with admin privileges. In Solana, "owner" is a fundamental, runtime-level rule that strictly dictates which program is allowed to write to specific storage slots.

## Program Authority and Upgrades

### Deployment and Upgrades
The wallet used to deploy a program becomes its default **Authority**. When this wallet attempts to upgrade the program (write new bytecode), the Solana runtime verifies its signature.

### The True Owner of Programs
The default **Owner** of all Solana programs is a system program called **BPFLoaderUpgradeable**. If the **Authority's** signature is valid, **BPFLoaderUpgradeable** will update the program's bytecode on its behalf.

### Storage Location (ProgramData)
A program's **Authority** is not stored in the regular fields of the program's account. Instead, the **Authority** address—along with the actual executable bytecode—is stored in a separate account known as the **ProgramData Address**.

