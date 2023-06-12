import shortid from "shortid";
import { Room, selfId } from "trystero";
import { decryptMessage, encryptMessage } from "../cryptoSuite";
import { useMessageStore } from "../stateManagers/messageStore";
import { usePersonaStore } from "../stateManagers/personaStore";
import { useUserStore } from "../stateManagers/userStore";
import { Message, User } from "../types";

export default class ChatManager {
  private sendChatAction: (data: string, peerIds: string[]) => void;
  private roomId: string;

  constructor({ room, roomId }: { room: Room; roomId: string }) {
    const [sendChatAction, getChatAction] = room.makeAction<string>("chat");
    this.sendChatAction = sendChatAction;
    this.roomId = roomId;

    getChatAction(async (data, peerId) => {
      const currentPersona = usePersonaStore
        .getState()
        .personas.find((persona) => persona.roomId === roomId);
      const privateKey = currentPersona && currentPersona.keyPair.privateKey;
      if (!privateKey) return console.error("Could not find private key");
      const dataDecoded = await decryptMessage(privateKey, data)
        .then((data) => {
          return JSON.parse(data);
        })
        .catch((e) => console.error(e));
      if (dataDecoded === undefined)
        return console.error("Could not decrypt message");
      const newMessage: Message = {
        msgId: dataDecoded.msgId,
        text: dataDecoded.text,
        sentAt: dataDecoded.sentAt,
        sentBy: peerId,
        recievedAt: Date.now(),
        roomId: dataDecoded.roomId,
      };
      useMessageStore.getState().addMessage(newMessage);
    });
  }

  public sendChat = async (message: string) => {
    if (message.trim() === "" || this.roomId.trim() === "") return;
    const newMessage: Message = {
      sentBy: selfId,
      msgId: shortid.generate(),
      text: message,
      sentAt: Date.now(),
      recievedAt: Date.now(),
      roomId: this.roomId,
    };
    const msgString = JSON.stringify(newMessage);
    const users: User[] = useUserStore.getState().users.filter((user) => {
      return user.roomId === this.roomId && user.active;
    });
    const messagesToSend = users.map(async ({ peerId, pubKey }) => {
      if (pubKey) {
        await encryptMessage(pubKey, msgString).then((encodedMessage) => {
          this.sendChatAction(encodedMessage, [peerId]);
        });
      }
    });
    await Promise.all(messagesToSend);

    useMessageStore.getState().addMessage(newMessage);
  };
}
