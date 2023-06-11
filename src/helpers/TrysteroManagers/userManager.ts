import { Room } from "trystero";
import DBManager from "./dbManager";

export default class UserManager {
  private roomId;
  private sendName;
  private sendUserKey;
  private getPersona;
  private updatePersona;

  constructor({
    room,
    roomId,
    dbManager,
    peerLeaveHook,
    privateKey,
  }: {
    room: Room;
    roomId: string;
    dbManager: DBManager;
    peerLeaveHook: (peerId: string) => void;
    privateKey: CryptoKey;
  }) {
    this.roomId = roomId;
    this.getPersona = dbManager.getPersona;
    this.updatePersona = dbManager.updatePersona;

    const [sendName, getName] = room.makeAction("name");
    const [sendUserKey, getUserKey] = room.makeAction("pubkey"); //seperated to save bandwidth

    this.sendName = sendName;
    this.sendUserKey = sendUserKey;

    room.onPeerJoin(async (peerId) => {
      this.syncInfo();
      dbManager.addUser({ peerId, roomId, active: true, name: "Anonymous" });
    });

    room.onPeerLeave((peerId) => {
      dbManager.UpdateUser(peerId, { active: false });

      peerLeaveHook(peerId);
    });

    getName((name, peerId) =>
      dbManager.UpdateUser(peerId, { name: name as unknown as string })
    );

    getUserKey(async (publicKey, peerId) => {
      if (publicKey) {
        const importedKey = await window.crypto.subtle.importKey(
          "jwk",
          publicKey as unknown as JsonWebKey,
          { name: "RSA-OAEP", hash: { name: "SHA-256" } },
          true,
          ["encrypt"]
        );
        dbManager.UpdateUser(peerId, { pubKey: importedKey });
      }
    });
  }

  syncInfo = async () => {
    this.getPersona(this.roomId).then((persona) => {
      if (persona) {
        this.sendName(persona.name);
        if (persona.keyPair) {
          window.crypto.subtle
            .exportKey("jwk", persona.keyPair.publicKey)
            .then((publicKeyJwk) => {
              this.sendUserKey(publicKeyJwk);
            });
        }
      }
    });
  };

  setMyName = (name: string) => {
    this.updatePersona(this.roomId, { name });
    this.syncInfo();
  };

  setEncryptionInfo = (info: CryptoKeyPair) => {
    this.updatePersona(this.roomId, { keyPair: info });
    this.syncInfo();
  };
}
