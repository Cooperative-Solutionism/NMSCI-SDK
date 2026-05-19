declare module 'elliptic' {
  interface BN {
    toString(base: number): string;
    toArray(encoding: string, length: number): number[];
    gt(v: BN): boolean;
    lte(v: BN): boolean;
    shrn(n: number): BN;
    sub(v: BN): BN;
  }

  interface Signature {
    r: BN;
    s: BN;
  }

  class KeyPair {
    getPublic(compressed: boolean, encoding: 'hex'): string;
    getPublic(): { validate(): boolean };
    sign(data: Uint8Array, options?: { canonical?: boolean }): Signature;
    verify(data: Uint8Array, signature: { r: string; s: string }): boolean;
  }

  class ECInstance {
    constructor(curveName: string);
    genKeyPair(): KeyPair;
    keyFromPrivate(key: string, encoding: 'hex'): KeyPair;
    keyFromPublic(key: string, encoding: 'hex'): KeyPair;
    curve: { n: BN };
  }

  export { ECInstance as ec };
}
