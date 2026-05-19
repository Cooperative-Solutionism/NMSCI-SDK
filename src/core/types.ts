/** Hex-encoded byte string (no 0x prefix) */
export type HexString = string;

/** 33-byte compressed secp256k1 public key (66 hex chars) */
export type Pubkey = HexString;

/** 64-byte rs-format ECDSA signature (128 hex chars) */
export type Signature = HexString;

/** 16-byte UUID (32 hex chars, no dashes) */
export type UUID = HexString;

/** secp256k1 key pair */
export interface KeyPair {
  privateKey: string;
  publicKey: Pubkey;
}
