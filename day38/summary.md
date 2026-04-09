# Day 38: Metaplex Token Metadata

## What problem does Metaplex solve?

An SPL token mint on Solana does not natively store a human-readable name, symbol, image, or description. Without extra metadata, a token is mostly identified by its mint address.

Metaplex solves this by attaching a separate metadata account to the mint.

## Core idea

Metaplex Token Metadata is the most widely used standard for giving Solana tokens an identity.

Instead of storing metadata inside the mint account itself, Metaplex creates a separate metadata account that is tied to the mint.

This is different from Ethereum-style designs where the token contract often exposes metadata-related functions directly.

## Metadata account

The metadata account is a PDA derived from:

1. the string `metadata`
2. the Metaplex Token Metadata Program ID
3. the mint address

Because the mint address is one of the seeds, each mint can have exactly one deterministic metadata account.

This makes it easy for wallets and marketplaces to discover token metadata.

## Important fields in the metadata account

### `update_authority`

The address allowed to modify the metadata. This authority is assigned when the metadata account is created.

### `mint`

The SPL mint that this metadata describes.

### `data`

The main token metadata payload. Important fields include:

- `name`: token name, up to 32 bytes
- `symbol`: token symbol, up to 10 bytes
- `uri`: link to off-chain JSON, up to 200 bytes
- `seller_fee_basis_points`: royalty info expressed in basis points
- `creators`: creator list and royalty split

### `primary_sale_happened`

Marks whether the initial sale has occurred.

### `is_mutable`

Controls whether metadata can still be updated later.

### `token_standard`

Identifies the asset type, such as fungible or non-fungible.

## On-chain vs off-chain metadata

Metaplex usually stores only the essential fields on-chain.

The `uri` points to off-chain JSON that can contain:

- description
- image URL
- animation URL
- attributes
- other extended metadata

This design keeps on-chain storage smaller while still supporting rich token presentation.

## Why update authority matters

The update authority is a critical control mechanism.

- Only the update authority can change metadata
- The authority can be transferred to another address
- The metadata can be made immutable
- If metadata becomes immutable, it cannot be changed again

This prevents unauthorized edits and defines who controls the token's public identity.

## Key instructions in the Metaplex Token Metadata Program

### `CreateMetadataAccountV3`

Creates a metadata account for a mint.

### `UpdateMetadataAccountV2`

Updates existing metadata if the account is mutable and the update authority signs.

### `UpdatePrimarySaleHappenedViaToken`

Marks the primary sale as completed.

### `SignMetadata`

Lets creators verify themselves in the metadata.

### `CreateMasterEditionV3`

Creates a master edition for NFTs.

### `MintNewEditionFromMasterEditionViaToken`

Mints limited edition NFTs from a master edition.

### Collection instructions

Metaplex also supports verifying whether an NFT belongs to a collection.

## Main takeaway

Metaplex metadata gives an SPL token a recognizable identity by linking a separate PDA-based metadata account to the mint.

That account stores core token information on-chain and usually points to richer off-chain JSON through a URI.

In practice, this is why wallets like Phantom can display token names, symbols, images, and NFT collection info.

## Short exam-style recap

- SPL token mints do not natively include rich metadata
- Metaplex uses a separate PDA metadata account
- The metadata PDA is derived from `metadata`, program ID, and mint address
- `update_authority` controls future changes
- `uri` points to off-chain JSON for extended metadata
- Metaplex is the dominant metadata standard on Solana
