import * as Tabs from "@radix-ui/react-tabs";
import ChatProcessing from "mdi-preact/ChatProcessingIcon";
import Download from "mdi-preact/DownloadIcon";
import { useEffect, useState } from "preact/hooks";
import { Room, selfId } from "trystero/torrent";
import "./assets/App.css";
import ChatManager from "./helpers/TrysteroManagers/chatManager";
import DBManager from "./helpers/TrysteroManagers/dbManager";
import DownloadManager from "./helpers/TrysteroManagers/downloadManager";
import { generateKeyPair } from "./helpers/cryptoSuite";
import { useExtendedState } from "./helpers/helpers";
import { FileOffer, FileProgress, Message, User } from "./helpers/types";
import { ChatView } from "./views/ChatView";
import { DownloadView } from "./views/DownloadView";
import { RoomCard } from "./views/RoomCard";
import { UserManager } from "./views/UserManager";

const CACHE_LENGTH = 100;

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
  const [chatManagerInstance, setChatManagerInstance] = useState<
    ChatManager | undefined
  >(undefined);
  const [downloadManagerInstance, setDownloadManagerInstance] = useState<
    DownloadManager | undefined
  >(undefined);

  const [[sendName, getName]] = useState(() => room.makeAction("name"));
  const [[sendUserKey, getUserKey]] = useState(() => room.makeAction("pubkey")); //seperated to save bandwidth

  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [realFiles, setRealFiles, asyncGetRealFiles] = useExtendedState<{
    [key: string]: File;
  }>({});
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
      .then(() =>
        dbm.getMessagesAfter(
          //initialize message queue
          roomId,
          new Date(Date.now() - 86400000).getTime(),
          CACHE_LENGTH
        )
      ) //TODO: remove when infinityscroll is implemented
      .then((messages) => setMessageQueue(messages));

    const cm = new ChatManager({
      room,
      dbManager: dbm,
      addToMessageQueue,
      getUsers: asyncGetUsers,
      privateKey: keyPair.privateKey,
    });
    setChatManagerInstance(cm);

    const dm = new DownloadManager({
      room,
      realFiles: [asyncGetRealFiles, setRealFiles],
      downloadCache: [asyncGetRequestableDownloads, setRequestableDownloads],
      setProgressQueue,
      asyncGetUsers,
      privateKey: keyPair.privateKey,
    });
    setDownloadManagerInstance(dm);
  };

  useEffect(() => {
    initSystem();
  }, []);

  room.onPeerJoin(async (peerId) => {
    syncInfo();
    setPeers((peers) => [...peers, { peerId, name: "Anonymous" }]);
  });

  room.onPeerLeave((peerId) => {
    setPeers((peers) => peers.filter((p) => p.peerId !== peerId));
    if (peerId in realFiles) {
      setRealFiles((files) => {
        const ownedFiles = files[peerId];
        setProgressQueue((q) => {
          const newQ = q.filter((f) => !(f.id in ownedFiles));
          return newQ;
        });
        delete files[peerId];
        return files;
      });
    }
  });
  return (
    <>
      <RoomCard roomId={roomId} leaveRoom={leaveRoom} />
      <Tabs.Root defaultValue="tab1">
        <div className="horizontal">
          <div style={{ width: "80%", height: "100%" }}>
            <Tabs.Content value="tab1">
              <ChatView
                messageQueue={messageQueue}
                peers={peers}
                chatManagerInstance={chatManagerInstance}
                roomId={roomId}
              />
            </Tabs.Content>
            <Tabs.Content value="tab2">
              <DownloadView
                progressQueue={progressQueue}
                downloadManagerInstance={downloadManagerInstance}
                requestableDownloads={requestableDownloads}
                realFiles={realFiles}
                peers={peers}
              />
            </Tabs.Content>
          </div>
          <UserManager
            myId={selfId}
            myName={myName}
            setMyName={setMyName}
            peers={peers}
          />
        </div>
        <div className="bottombar">
          <Tabs.List aria-label="tabs example">
            <Tabs.Trigger className="tabbutton" value="tab1" title="Chat">
              <ChatProcessing />
            </Tabs.Trigger>
            <Tabs.Trigger className="tabbutton" value="tab2" title="Downloads">
              <Download />
            </Tabs.Trigger>
          </Tabs.List>
        </div>
      </Tabs.Root>
    </>
  );
}

export default MainModal;
