import { 
    generateSigner, 
    signerIdentity, 
    createSignerFromKeypair, 
    percentAmount 
} from "@metaplex-foundation/umi";

import { 
    createAndMint, 
    mplTokenMetadata, 
    TokenStandard 
} from "@metaplex-foundation/mpl-token-metadata";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import fs from "fs";

const secret = JSON.parse(process.env.PRIVATE_KEY);

(async () => {
    try {
        // 1. Create a UMI instance pointing to mainnet (adjust if needed).
        const umi = createUmi("https://api.mainnet-beta.solana.com");

        // 2. Load your wallet from the keypair JSON.
        // Make sure outputkey.json is an array of 64 bytes (private key).
        const userWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
        const userWalletSigner = createSignerFromKeypair(umi, userWallet);

        // 3. Define your token metadata.
        const metadata = {
            name: "Super Earth Coin",
            symbol: "SEC",
            uri: "https://arweave.net/hMAH97pRlFfaUt8VBGF5hkZzseYG3ghc9YO-egtzvs"
        };

        // 4. Generate a new mint address.
        const mint = generateSigner(umi);

        // 5. Set up identity and the MPL Token Metadata plugin.
        umi.use(signerIdentity(userWalletSigner));
        umi.use(mplTokenMetadata());

        // 6. Create & Mint the token.
        // 1 billion tokens with 10 decimals, that's 1e19 raw units.
        // Hence amount = 1_000_000_000_000000000
        // (Note the "n" for JavaScript BigInt Literal).
        const transactionResult = await createAndMint(umi, {
            mint,
            authority: userWalletSigner, // The signer authority for minting
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            sellerFeeBasisPoints: percentAmount(0), // No royalties
            decimals: 6, // Standard 6 decimals
            amount: 1_000_000_000_000000n, // 1B tokens with 6 decimals
            tokenOwner: userWallet.publicKey,
            isMutable: false,
            tokenStandard: TokenStandard.Fungible, // For a standard fungible token
        }).sendAndConfirm(umi);

        // 7. Log success.
        console.log("✅ Successfully minted 1 billion tokens with mint address:", mint.publicKey.toString());
        console.log("📝 Transaction Signature:", transactionResult.signature);
    } catch (err) {
        console.error("❌ Error minting tokens:", err);
    }
})();
