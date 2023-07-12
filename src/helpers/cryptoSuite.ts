import * as base64 from "byte-base64";

// Function to generate a public-private key pair
export const generateKeyPair = () =>
  window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: { name: "SHA-256" },
    },
    true,
    ["encrypt", "decrypt"]
  );

// Function to encrypt a message using the public key
export const encryptMessage = (
  publicKey: CryptoKey,
  message: string | undefined
) =>
  new Promise<string>((resolve, _) =>
    resolve(base64.bytesToBase64(new TextEncoder().encode(message)))
  );

// Function to decrypt a message using the private key
export const decryptMessage = (
  privateKey: CryptoKey,
  encryptedMessage: string
) =>
  new Promise<string>((resolve, _) =>
    resolve(new TextDecoder().decode(base64.base64ToBytes(encryptedMessage)))
  );

//* flow description
// 1. bob send alice public key
//     - sendAlice(kyber.keyPair().publicKey)
// 2. alice generate cyphertext/shared secret from bob's public key
//     - const {cyphertext, secret} = encrypt(bobPublicKey)
//     - sendBob(cyphertext)
// 3. bob take cypertext and generate the same shared secret
//     - const secret = decrypt(aliceCyphertext)

//tools

//example pool
// tests here are a good example, but not 100% sure how to link it to symmcrypt https://github.com/fisherstevenk/crystals-kyber-ts/blob/main/tests/kyber768.service.spec.ts
// complicated but good, requires a server (?) https://www.npmjs.com/package/microtunnel-client
// large pq crypto library: https://www.npmjs.com/package/pqcrypto

//https://github.com/cyph/pqcrypto.js/tree/master/packages
