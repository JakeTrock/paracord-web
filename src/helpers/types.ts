export type FileMetaData = {
  id: string;
  owner?: string;
  name: string;
  size: number;
};

export interface User {
  peerId: string;
  roomId: string;
  active: boolean;
  pubKey?: CryptoKey;
  name: string | "Anonymous";
}

export interface Message {
  msgId: string;
  text: string;
  sentAt: number;
  roomId: string;
  sentBy: string;
  recievedAt: number;
}

export interface FileOffer {
  id: string;
  name: string;
  size: number;
  ownerId: string;
}

export interface FileProgress {
  id: string;
  name: string;
  progress: number;
  toMe: boolean;
}

export interface Persona {
  roomId: string;
  peerIds: string[];
  active: boolean;
  keyPair: CryptoKeyPair;
  name: string | "Anonymous";
  lastUsed: number;
}
