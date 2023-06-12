import shortid from "shortid";
import { Room, selfId } from "trystero";
import { decryptMessage, encryptMessage } from "../cryptoSuite";
import { useMessageStore } from "../stateManagers/messageStore";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import { Message, User } from "../types";

export default class ChatManager {
  private sendChatAction: (data: string, ids?: string | string[]) => void;
  private sendTyping: (data: boolean, ids?: string | string[]) => void;
  private roomId: string;

  constructor({ room, roomId }: { room: Room; roomId: string }) {
    const [sendChatAction, getChatAction] = room.makeAction<string>("chat");
    const [sendTyping, getTyping] = room.makeAction<boolean>("isTyping");
    this.sendChatAction = sendChatAction;
    this.sendTyping = sendTyping;
    this.roomId = roomId;

    getChatAction(async (data, id) => {
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

      if (useClientSideUserTraits.getState().mutedUsers[id] !== true) {
        const newMessage: Message = {
          id: dataDecoded.id,
          text: dataDecoded.text,
          sentAt: dataDecoded.sentAt,
          sentBy: id,
          recievedAt: Date.now(),
          roomId: dataDecoded.roomId,
        };
        useMessageStore.getState().addMessage(newMessage);
      }
    });

    getTyping((data, id) => {
      if (data === true) useClientSideUserTraits.getState().addTypingUser(id);
      else useClientSideUserTraits.getState().removeTypingUser(id);
    });
  }

  sendChat = async (message: string) => {
    if (message.trim() === "" || this.roomId.trim() === "") return;
    const newMessage: Message = {
      sentBy: selfId,
      id: shortid.generate(),
      text: message,
      sentAt: Date.now(),
      recievedAt: Date.now(),
      roomId: this.roomId,
    };
    const msgString = JSON.stringify(newMessage);
    const users: User[] = useUserStore.getState().users.filter((user) => {
      return user.roomId === this.roomId && user.active;
    });
    const messagesToSend = users.map(async ({ id, pubKey }) => {
      if (pubKey) {
        await encryptMessage(pubKey, msgString).then((encodedMessage) => {
          this.sendChatAction(encodedMessage, [id]);
        });
      }
    });
    await Promise.all(messagesToSend);

    useMessageStore.getState().addMessage(newMessage);
  };

  sendTypingIndicator = (isTyping: boolean) => {
    this.sendTyping(isTyping);
  };
}
