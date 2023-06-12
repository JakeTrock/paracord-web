import { Room, selfId } from "trystero";
import { sendSystemMessage } from "../helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { usePersonaStore } from "../stateManagers/personaStore";
import { useUserStore } from "../stateManagers/userStore";

export default class UserManager {
  private roomId;
  private sendName;
  private sendUserKey;

  constructor({ room, roomId }: { room: Room; roomId: string }) {
    this.roomId = roomId;

    const [sendName, getName] = room.makeAction<string>("name");
    const [sendUserKey, getUserKey] = room.makeAction<string>("pubkey"); //seperated to save bandwidth

    this.sendName = sendName;
    this.sendUserKey = sendUserKey;

    room.onPeerJoin(async (peerId) => {
      this.syncInfo();
      useUserStore
        .getState()
        .addUser({ peerId, roomId, active: true, name: "Anonymous" });
      sendSystemMessage(roomId, `${peerId} joined the room`);
    });

    room.onPeerLeave((peerId) => {
      useUserStore.getState().updateUser(peerId, { active: false });

      const peerOffers = useOfferStore.getState().requestableDownloads[peerId];
      peerOffers?.forEach((offer) =>
        useProgressStore.getState().deleteProgress(offer.id)
      );

      useOfferStore.getState().removeRequestablesForId(peerId);
      sendSystemMessage(roomId, `${peerId} left the room`);
    });

    getName((name, peerId) => {
      useUserStore.getState().updateUser(peerId, { name: name });
    });

    getUserKey(async (publicKey, peerId) => {
      if (publicKey) {
        const importedKey = await window.crypto.subtle.importKey(
          "jwk",
          publicKey as JsonWebKey,
          { name: "RSA-OAEP", hash: { name: "SHA-256" } },
          true,
          ["encrypt"]
        );
        useUserStore.getState().updateUser(peerId, { pubKey: importedKey });
      }
    });
  }

  syncInfo = async () => {
    const activePersona = usePersonaStore
      .getState()
      .personas.find((p) => p.roomId === this.roomId);
    if (activePersona) {
      this.sendName(activePersona.name);
      if (activePersona.keyPair) {
        await window.crypto.subtle
          .exportKey("jwk", activePersona.keyPair.publicKey)
          .then((publicKeyJwk) => this.sendUserKey(publicKeyJwk as string));
      }
    }
  };

  setMyName = (name: string) => {
    usePersonaStore.getState().updatePersona(this.roomId, { name });
    this.syncInfo();
  };

  setEncryptionInfo = (info: CryptoKeyPair) => {
    usePersonaStore.getState().updatePersona(this.roomId, { keyPair: info });
    this.syncInfo();
  };

  createPersona = (kp: CryptoKeyPair) => {
    usePersonaStore.getState().addPersona({
      peerIds: [selfId],
      roomId: this.roomId,
      name: "Anonymous",
      active: true,
      lastUsed: new Date().getTime(),
      keyPair: kp,
    });
    this.syncInfo();
  };
}
