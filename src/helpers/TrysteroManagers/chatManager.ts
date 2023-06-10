import shortid from "shortid";
import { Room, selfId } from "trystero";
import { decryptMessage, encryptMessage } from "../cryptoSuite";
import { Message, User } from "../types";
import DBManager from "./dbManager";

export default class ChatManager {
  private getUsers: () => Promise<User[]>;
  private sendChatAction: (data: string, peerIds: string[]) => void;
  private dbManager: DBManager;
  private addToMessageQueue: (message: Message) => void;

  constructor({
    room,
    dbManager,
    addToMessageQueue,
    getUsers,
    privateKey,
  }: {
    room: Room;
    dbManager: DBManager;
    addToMessageQueue: (message: Message) => void;
    getUsers: () => Promise<User[]>;
    privateKey: CryptoKey;
  }) {
    const [sendChatAction, getChatAction] = room.makeAction("chat");
    this.sendChatAction = sendChatAction;
    this.addToMessageQueue = addToMessageQueue;

    getChatAction(async (data, peerId) => {
      //TODO: this is never called
      console.log("Received chat message");
      const dataDecoded = await decryptMessage(
        privateKey,
        data as unknown as string
      )
        .then((data) => {
          return JSON.parse(data) as Message;
        })
        .catch((e) => console.error(e));
      console.log(dataDecoded);
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
      addToMessageQueue(newMessage);
      dbManager.addMessage(newMessage);
    });

    this.dbManager = dbManager;

    this.getUsers = getUsers;
  }

  public sendChat = async (message: string, roomId: string) => {
    if (message.trim() === "" || roomId.trim() === "") return;
    const newMessage: Message = {
      sentBy: selfId,
      msgId: shortid.generate(),
      text: message,
      sentAt: Date.now(),
      recievedAt: Date.now(),
      roomId: roomId,
    };
    const msgString = JSON.stringify(newMessage);
    console.log(msgString);
    const users: User[] = await this.getUsers();
    console.log(users); //TODO:why is this empty?
    const messagesToSend = users.map(async ({ peerId, pubKey }) => {
      console.log(peerId);
      if (pubKey) {
        await encryptMessage(pubKey, msgString).then((encodedMessage) => {
          this.sendChatAction(encodedMessage, [peerId]);
        });
      }
    });
    await Promise.all(messagesToSend);
    this.addToMessageQueue(newMessage);
    this.dbManager.addMessage(newMessage);
  };
}
