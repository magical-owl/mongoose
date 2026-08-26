declare module 'node-forge' {
  interface MessageDigest {}

  interface NodeForge {
    readonly md: {
      readonly sha256: {
        create(): MessageDigest;
      };
    };
    readonly pkcs5: {
      pbkdf2(
        password: string,
        salt: string,
        iterations: number,
        keySize: number,
        messageDigest: MessageDigest
      ): string;
    };
    readonly util: {
      bytesToHex(bytes: string): string;
      hexToBytes(hex: string): string;
    };
  }

  const forge: NodeForge;
  export default forge;
}
