import * as base64 from "byte-base64";

// Function to generate a public-private key pair
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: { name: "SHA-256" },
    },
    true,
    ["encrypt", "decrypt"]
  );

  return keyPair;
}

// Function to encrypt a message using the public key
export async function encryptMessage(
  publicKey: CryptoKey,
  message: string | undefined
) {
  const encodedMessage = new TextEncoder().encode(message);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    encodedMessage
  );
  const encodedArray = base64.bytesToBase64(new Uint8Array(encryptedBuffer));
  return encodedArray;
}

// Function to decrypt a message using the private key
export async function decryptMessage(
  privateKey: CryptoKey,
  encryptedMessage: string
) {
  const encryptedBuffer = base64.base64ToBytes(encryptedMessage);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedBuffer
  );
  const decryptedMessage = new TextDecoder().decode(decryptedBuffer);
  return decryptedMessage;
}
