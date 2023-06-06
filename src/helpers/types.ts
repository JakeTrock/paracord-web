export type FileMetaData = {
  id: string;
  owner?: string;
  name: string;
  size: number;
};

export interface User {
  peerId: string;
  pubKey?: CryptoKey;
  name: string | "Anonymous";
}

export type Message = MessageFromMe | MessageToMe | MessageSystem;

export interface MessageFromMe {
  type: "fromMe";
  msgId: string;
  text: string;
  sentAt: number;
}

export interface MessageToMe {
  type: "toMe";
  msgId: string;
  text: string;
  sentAt: number;
  sentBy: string;
  recievedAt: number;
}

export interface MessageSystem {
  type: "system";
  text: string;
  sentAt: number;
}
