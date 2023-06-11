import { DBSchema, IDBPDatabase, openDB } from "idb";
import { Message, Persona, User } from "../types";

const dbVersion = 1;

interface CentralDB extends DBSchema {
  //TODO: add users to this
  //TODO: add table to store current user, past ids
  messages: {
    key: string;
    value: Message;
    indexes: { "by-room": string; "by-recieved": number };
  };
  users: {
    key: string;
    value: User;
    indexes: { "by-room": string };
  };
  personaManager: {
    //TODO: some way to reclaim a user acct w/ you private key, treat user ids differently
    //TODO: multiroom manager
    key: string;
    value: Persona;
    indexes: { "by-date": number };
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

        const userStore = db.createObjectStore("users", {
          keyPath: "peerId",
        });

        userStore.createIndex("by-room", "roomId");

        const personaManagerStore = db.createObjectStore("personaManager", {
          keyPath: "roomId",
        });

        personaManagerStore.createIndex("by-date", "lastUsed");
      },
    });
  }

  // PROFILE MANAGEMENT

  async addPersona(personaArgs: {
    roomId: string;
    peerId: string;
    keyPair: CryptoKeyPair;
    name: string;
  }) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("personaManager", "readwrite");
    const store = tx.objectStore("personaManager");
    await store.add({
      roomId: personaArgs.roomId,
      peerIds: [personaArgs.peerId],
      keyPair: personaArgs.keyPair,
      name: personaArgs.name,
      active: true,
      lastUsed: Date.now(),
    });
    await tx.done;
  }

  async getPersona(roomId: string) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("personaManager", "readonly");
    const store = tx.objectStore("personaManager");
    const persona = await store.get(roomId);
    await tx.done;

    return persona;
  }

  async getAllPersonas() {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("personaManager", "readonly");
    const store = tx.objectStore("personaManager");
    const index = store.index("by-date");
    const personas = await index.getAll();
    await tx.done;

    return personas;
  }

  async updatePersona(
    roomId: string,
    user: {
      peerId?: string;
      keyPair?: CryptoKeyPair;
      name?: string;
    }
  ) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("personaManager", "readwrite");
    const store = tx.objectStore("personaManager");
    const persona = await store.get(roomId);
    if (persona) {
      if (user.name) persona.name = user.name;
      if (user.keyPair) persona.keyPair = user.keyPair;
      if (user.peerId) persona.peerIds.push(user.peerId); //TODO: use for multiid
      persona.lastUsed = Date.now();
      await store.put(persona);
    }
    await tx.done;

    return user;
  }

  // USER MANAGEMENT

  async addUser(user: User) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("users", "readwrite");
    const store = tx.objectStore("users");
    await store.add(user);
    await tx.done;

    return user;
  }

  async getPublicKeyById(peerId: string) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const user = await store.get(peerId);
    await tx.done;

    return user?.pubKey;
  }

  async getAllUsers(roomId: string) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const index = store.index("by-room");
    const users = await index.getAll(roomId);
    await tx.done;

    return users;
  }

  async UpdateUser(
    id: string,
    {
      name,
      pubKey,
      active,
    }: { name?: string; pubKey?: CryptoKey; active?: boolean }
  ) {
    if (!this.database) throw new Error("Database not initialized");

    const tx = this.database.transaction("users", "readwrite");
    const store = tx.objectStore("users");
    const user = await store.get(id);
    if (user) {
      if (name) user.name = name;
      if (pubKey) user.pubKey = pubKey;
      if (active !== undefined) user.active = active;
      await store.put(user);
    }
    await tx.done;

    return user;
  }

  //MESSAGE MANAGEMENT

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

  // GENERAL MANAGEMENT

  async purgeAllData() {
    if (!this.database) throw new Error("Database not initialized");

    await this.database.close();
    await this.database.deleteObjectStore("messages");
    await this.database.deleteObjectStore("users");
    await this.database.deleteObjectStore("personaManager");
    await this.initDb();
  }
}
