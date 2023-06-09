import * as Tabs from "@radix-ui/react-tabs";
import ChatProcessing from "mdi-preact/ChatProcessingIcon";
import Download from "mdi-preact/DownloadIcon";
import { useEffect, useRef, useState } from "preact/hooks";
import { FileUploader } from "react-drag-drop-files";
import { Room } from "trystero/torrent";
import "./assets/App.css";
import CollapsibleContainer from "./helpers/Collapsible";
import ChatManager from "./helpers/TrysteroManagers/chatManager";
import DBManager from "./helpers/TrysteroManagers/dbManager";
import DownloadManager from "./helpers/TrysteroManagers/downloadManager";
import { generateKeyPair } from "./helpers/cryptoSuite";
import { fancyBytes, useExtendedState } from "./helpers/helpers";
import { FileOffer, FileProgress, Message, User } from "./helpers/types";
import Messages from "./messages";
import pcdLogo from "/logo.svg";

const CACHE_LENGTH = 100;

function RoomCard(props: { roomId: string; leaveRoom: () => void }) {
  const { roomId, leaveRoom } = props;
  return (
    <div className="card">
      <img style={{ height: "6em" }} src={pcdLogo} />
      <h1>Paracord</h1>
      <hr />
      <h4>Room ID</h4>
      <h2>{roomId}</h2>
      <button onClick={leaveRoom}>Leave Room</button>
    </div>
  );
}

function UserManager(props: {
  myName: string;
  setMyName: (name: string) => void;
  peers: User[];
}) {
  const { myName, setMyName, peers } = props;
  return (
    <div className="card">
      <h2>You</h2>
      <input
        type="text"
        value={myName}
        autocapitalize={"off"}
        autoComplete={"off"}
        onChange={(e) => setMyName(e.currentTarget.value)}
      />
      <h2>Peers</h2>
      <ul>
        {peers.length ? (
          peers.map(({ name, peerId }) => (
            <li key={peerId}>
              <h5>{name}</h5>
              <p>{peerId}</p>
            </li>
          ))
        ) : (
          <h3>Loading...</h3>
        )}
      </ul>
    </div>
  );
}

function MainModal(props: {
  room: Room;
  roomId: string;
  leaveRoom: () => void;
}) {
  //TODO: when system refreshes on quit, it still gets mad that 'name' et al are recreated
  const { room, roomId, leaveRoom } = props;
  const [myName, setMyName] = useState<string>("Anonymous");
  const [peers, setPeers, asyncGetUsers] = useExtendedState<User[]>([]);
  const [encryptionInfo, setEncryptionInfo] = useState<
    CryptoKeyPair | undefined
  >(undefined);
  const [DBManagerInstance, setDBManagerInstance] = useState<
    DBManager | undefined
  >(undefined);
  const [chatManagerInstance, setChatManagerInstance] = useState<
    ChatManager | undefined
  >(undefined);
  const [downloadManagerInstance, setDownloadManagerInstance] = useState<
    DownloadManager | undefined
  >(undefined);

  const [[sendName, getName]] = useState(() => room.makeAction("name"));
  const [[sendUserKey, getUserKey]] = useState(() => room.makeAction("pubkey")); //seperated to save bandwidth

  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [
    requestableDownloads,
    setRequestableDownloads,
    asyncGetRequestableDownloads,
  ] = useExtendedState<{
    [key: string]: FileOffer[];
  }>({});
  const [progressQueue, setProgressQueue] = useState<FileProgress[]>([]);

  const addToMessageQueue = (message: Message) => {
    setMessageQueue((q) => {
      const newQ = [...q, message];
      if (newQ.length > CACHE_LENGTH) {
        newQ.shift();
      }
      return newQ;
    });
  };

  const messageBox = useRef<HTMLInputElement>(null);

  getName((name, peerId) => {
    setPeers((p) => {
      const newPeers = p.map((p) => {
        if (p.peerId === peerId) {
          p.name = name as unknown as string;
        }
        return p;
      });
      return newPeers;
    });
  });

  getUserKey(async (publicKey, peerId) => {
    if (publicKey) {
      const importedKey = await window.crypto.subtle.importKey(
        "jwk",
        publicKey as unknown as JsonWebKey,
        { name: "RSA-OAEP", hash: { name: "SHA-256" } },
        true,
        ["encrypt"]
      );
      setPeers((p) => {
        const newPeers = p.map((p) => {
          if (p.peerId === peerId) {
            p.pubKey = importedKey;
          }
          return p;
        });
        return newPeers;
      });
    }
  });

  const syncInfo = async () => {
    sendName(myName);
    if (encryptionInfo) {
      const publicKeyJwk = await window.crypto.subtle.exportKey(
        "jwk",
        encryptionInfo.publicKey
      );
      sendUserKey(publicKeyJwk);
    }
  };

  useEffect(() => {
    syncInfo();
  }, [myName, encryptionInfo]);

  const initSystem = async () => {
    const keyPair = await generateKeyPair(); //TODO: this should never be globally exposed
    setEncryptionInfo(keyPair);
    const dbm = new DBManager();
    dbm
      .initDb()
      .then(() => setDBManagerInstance(dbm))
      .then(() =>
        dbm.getMessagesAfter(
          //initialize message queue
          roomId,
          new Date(Date.now() - 86400000).getTime(),
          CACHE_LENGTH
        )
      ) //TODO: remove when infinityscroll is implemented
      .then((messages) => setMessageQueue(messages));

    const cm = new ChatManager(
      room,
      dbm,
      addToMessageQueue,
      asyncGetUsers,
      keyPair.privateKey
    );
    setChatManagerInstance(cm);

    const dm = new DownloadManager(
      room,
      [asyncGetRequestableDownloads, setRequestableDownloads],
      setProgressQueue,
      asyncGetUsers,
      keyPair.privateKey
    );
    setDownloadManagerInstance(dm);
  };

  useEffect(() => {
    initSystem();
  }, []);

  room.onPeerJoin(async (peerId) => {
    syncInfo();
    setPeers((peers) => [...peers, { peerId, name: "Anonymous" }]);
  });

  room.onPeerLeave((peerId) =>
    setPeers((peers) => peers.filter((p) => p.peerId !== peerId))
  );
  return (
    <>
      <Tabs.Root defaultValue="tab1">
        <Tabs.Content value="tab1">
          <div className="card" style={{ width: "100%" }}>
            <h2>Chat</h2>
            <div className="card">
              <Messages users={peers} messageQueue={messageQueue} />
              <div className="horizontal">
                <input
                  ref={messageBox}
                  className="textbox"
                  name="userInput"
                  type="text"
                  autoComplete="off"
                  placeholder="Type your message"
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      messageBox.current !== null &&
                      chatManagerInstance
                    ) {
                      chatManagerInstance.sendChat(
                        messageBox.current.value,
                        roomId
                      );
                      messageBox.current.value = "";
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (messageBox.current !== null && chatManagerInstance) {
                      chatManagerInstance.sendChat(
                        messageBox.current.value,
                        roomId
                      );
                      messageBox.current.value = "";
                    }
                  }}
                  type="button"
                >
                  send ➔
                </button>
              </div>
            </div>
          </div>

          <UserManager myName={myName} setMyName={setMyName} peers={peers} />
        </Tabs.Content>
        <Tabs.Content value="tab2">
          {downloadManagerInstance && (
            <div className="card">
              <h2>Transfer</h2>

              <div className="horizontal">
                <div className="card" style={{ width: "50%" }}>
                  <h3>Send File</h3>
                  <FileUploader
                    multiple
                    required
                    handleChange={downloadManagerInstance.addRealFiles}
                    name="file"
                  >
                    <div className="uploadbox">Drag &amp; Drop files here</div>
                  </FileUploader>
                  <div className="filelistcontainer">
                    {downloadManagerInstance.realFiles &&
                      Object.entries(downloadManagerInstance.realFiles).map(
                        ([id, file]) => (
                          <div className="filelistbox" key={id}>
                            {file.name} <p>{fancyBytes(file.size)} </p>
                            <button
                              type="button"
                              className="bigbutton"
                              style={{ padding: "0.3em" }}
                              onClick={() =>
                                downloadManagerInstance.removeRealFile(id)
                              }
                            >
                              ✖
                            </button>
                            <hr />
                          </div>
                        )
                      )}
                  </div>
                </div>

                <div className="card" style={{ width: "50%" }}>
                  <h3>Request File</h3>
                  <div className="filelistcontainer">
                    {Object.entries(requestableDownloads).map(
                      ([peerId, fileOffers]) => (
                        <div className="filelistbox" key={peerId}>
                          <CollapsibleContainer
                            title={
                              peers.find((u) => u.peerId === peerId)?.name ||
                              "Anonymous"
                            }
                          >
                            <div className="filelistcontainer">
                              {fileOffers.map(({ id, name, size, ownerId }) => (
                                <div className="filelistbox" key={id}>
                                  <div className="horizontal">
                                    <div style={{ paddingRight: "1em" }}>
                                      <h5>{name}</h5>
                                      <p>{fancyBytes(size)}</p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        downloadManagerInstance.requestFile(
                                          ownerId,
                                          id
                                        )
                                      }
                                    >
                                      Request
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContainer>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="card" style={{ width: "100%" }}>
                <h3>Active Transfers</h3>
                <div className="filelistcontainer">
                  {/* {progressTrayStatuses.map((status) => (//TODO: fixme change to new sys
                      <div
                        key={status.id}
                        className={`filelistbox ${status.id}`}
                      >
                        <h5
                          style={{
                            color: "var(--accent-major)",
                            fontWeight: "600",
                          }}
                        >
                          {status.toMe
                            ? ` ← ${status.fileName}`
                            : `${status.fileName} →`}
                        </h5>
                        <progress
                          id={`progbar-${status.id}-${status.toId}`}
                          className="progressbar"
                          value="0"
                          min="0"
                          max="100"
                        />
                      </div>
                    ))} */}
                </div>
              </div>
            </div>
          )}
        </Tabs.Content>
        <Tabs.List aria-label="tabs example">
          <Tabs.Trigger value="tab1" title="Chat">
            <ChatProcessing />
          </Tabs.Trigger>
          <Tabs.Trigger value="tab2" title="Downloads">
            <Download />
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <RoomCard roomId={roomId} leaveRoom={leaveRoom} />
    </>
  );
}

export default MainModal;
