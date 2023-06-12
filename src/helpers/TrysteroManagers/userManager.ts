import { Room, selfId } from "trystero";
import { sendSystemMessage } from "../helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";

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

    room.onPeerJoin(async (id) => {
      this.syncInfo();
      useUserStore
        .getState()
        .addUser({ id, roomId, active: true, name: "Anonymous" });
      useClientSideUserTraits.getState().addUser(id);
      sendSystemMessage(roomId, `${id} joined the room`);
    });

    room.onPeerLeave((id) => {
      useUserStore.getState().updateUser(id, { active: false });

      const peerOffers = useOfferStore.getState().requestableDownloads[id];
      peerOffers?.forEach((offer) =>
        useProgressStore.getState().deleteProgress(offer.id)
      );

      useOfferStore.getState().removeRequestablesForId(id);
      useClientSideUserTraits.getState().removeUser(id);
      sendSystemMessage(roomId, `${id} left the room`);
    });

    getName((name, id) => {
      useUserStore.getState().updateUser(id, { name: name });
    });

    getUserKey(async (publicKey, id) => {
      if (publicKey) {
        const importedKey = await window.crypto.subtle.importKey(
          "jwk",
          publicKey as JsonWebKey,
          { name: "RSA-OAEP", hash: { name: "SHA-256" } },
          true,
          ["encrypt"]
        );
        useUserStore.getState().updateUser(id, { pubKey: importedKey });
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
      ids: [selfId],
      roomId: this.roomId,
      name: "Anonymous",
      active: true,
      lastUsed: new Date().getTime(),
      keyPair: kp,
    });
    this.syncInfo();
  };
}
