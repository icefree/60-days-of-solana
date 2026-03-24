# Summary of SPL Token (Day 34)

The [SPL Token tutorial](https://rareskills.io/post/spl-token) from RareSkills explains the architecture and mechanics of tokens on Solana. Unlike Ethereum's ERC-20, where each token is a separate contract with its own logic and state, Solana uses a single **Token Program** that manages all tokens, separating logic from account state.

## 1. Core Architecture: Logic vs. State
Solana separates the program logic from the data it operates on.
- **Token Program**: A single, universal program (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`) that contains the rules for all SPL tokens (transfer, mint, burn).
- **Accounts**: These store the actual data (balances, supply, decimals). The Token Program owns these accounts and is the only one that can modify their data.

## 2. The Mint Account (The "Token")
A **Mint Account** represents a unique token (e.g., USDC, USDT). Its address is what we typically call the "Token Address."
- **Stored Data**: Total supply, number of decimals, mint authority, and freeze authority.
- **Fixed Supply**: Since Solana doesn't have a "max supply" field, a fixed supply is achieved by minting the desired amount and then setting the `mint_authority` to `None`.

## 3. Token Accounts and ATAs (The "Balances")
User balances are not stored in the Mint Account but in separate accounts.
- **Token Accounts**: Generic accounts that store a user's balance for a specific mint. A user can technically have multiple token accounts for the same mint.
- **Associated Token Accounts (ATA)**: The standard solution to the "multiple accounts" problem. An ATA is a [Program Derived Address (PDA)](https://rareskills.io/post/solana-pda) derived deterministically from the **User's Wallet Address** and the **Token's Mint Address**.
- **ATA Benefits**:
    - **One-to-one**: Each user has exactly one predictable ATA per token.
    - **Discoverability**: Anyone can find a user's token balance address without asking them.
    - **Security**: The ATA Program ensures the owner and close authority are set to the user's wallet, even if someone else creates the account for them.

## 4. Key Programs and Addresses
- **Token Program**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- **Associated Token Account Program**: `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` (used to find or create ATAs).

## 5. Main Instructions
### Token Program Instructions:
- **InitializeMint**: Creates a new token.
- **InitializeAccount**: Sets up a regular token account.
- **Transfer**: Moves tokens (balance updates) between accounts.
- **MintTo**: Increases the total supply by adding tokens to a specific account.
- **Burn**: Decreases the total supply by destroying tokens.
- **Approve / Revoke**: Delegates spending power to another account (similar to ERC-20 `approve`).
- **Freeze / Thaw**: Prevents or allows transactions for a specific token account (blacklisting).
- **SetAuthority**: Changes or disables the authority (Mint, Freeze, Owner, etc.).
- **CloseAccount**: Closes an empty account (0 balance) to reclaim SOL rent.

### ATA Program Instructions:
- **Create**: Creates an ATA; fails if it already exists.
- **CreateIdempotent**: Creates an ATA if it doesn't exist; succeeds silently if it does.

## 6. Comparison with Ethereum (ERC-20)
| Feature | Ethereum (EVM) | Solana (SPL) |
| :--- | :--- | :--- |
| **Logic Location** | Inside each token's contract | Single shared **Token Program** |
| **Balance Storage** | `mapping(address => uint256)` in the contract | Separate **Associated Token Account** per user/token |
| **Concurrency** | Sequential (one contract = one lock) | **Parallel** (distinct accounts = distinct locks) |
| **Account Creation** | Automatic on first receipt | Must be explicitly created (often by the sender) |

## Summary of Benefits
- **Parallelism**: Since every user's balance is in a separate account, Solana can process thousands of transfers simultaneously.
- **Security & Standardization**: All tokens use the same battle-tested code, eliminating the risk of custom token contract bugs.

## Useful Tools
- **[Solana Account Visualizer](https://icefree.github.io/solana-visualizer/)**: A tool to visualize the relationships between the Token Program, Mint Accounts, and Associated Token Accounts.
