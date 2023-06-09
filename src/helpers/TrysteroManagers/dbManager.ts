import { DBSchema, IDBPDatabase, openDB } from "idb";
import { Message } from "../types";

const dbVersion = 1;

interface CentralDB extends DBSchema {
  //TODO: add users to this
  //TODO: add table to store current user, past ids
  messages: {
    key: string;
    value: Message;
    indexes: { "by-room": string; "by-recieved": number };
  };
}

export default class DBManager {
  private database: IDBPDatabase<CentralDB> | null = null;

  constructor() {}

  isInitialized() {
    return this.database !== null;
  }

  async initDb() {
    this.database = await openDB<CentralDB>("Messages", dbVersion, {
      upgrade(db) {
        // Create a store of objects
        const messageStore = db.createObjectStore("messages", {
          keyPath: "msgId",
        });
        // Create an index on the 'date' property of the objects.
        messageStore.createIndex("by-room", "roomId");
        messageStore.createIndex("by-recieved", "recievedAt");
      },
    });
  }

  async addMessage(message: Message) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    await store.add(message);
    await tx.done;

    return message;
  }

  async getMessagesAfter(roomId: string, after: number, limit: number) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("messages", "readonly");
    const store = tx.objectStore("messages");
    const index = store.index("by-room");
    const messages = await index.getAll(roomId, limit); //TODO: double query?
    await tx.done;

    return messages.filter((message) => message.recievedAt > after);
  }

  async deleteMessagesBefore(roomId: string, before: number) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    const index = store.index("by-room");
    const messages = await index.getAll(roomId);
    await tx.done;

    const tx2 = this.database.transaction("messages", "readwrite");
    const store2 = tx2.objectStore("messages");
    for (const message of messages) {
      if (message.recievedAt < before) {
        await store2.delete(message.msgId);
      }
    }
    await tx2.done;
  }
}
