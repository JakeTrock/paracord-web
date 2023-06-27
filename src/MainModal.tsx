import * as Tabs from "@radix-ui/react-tabs";
import ChatProcessing from "mdi-preact/ChatProcessingIcon";
import Download from "mdi-preact/DownloadIcon";
import { useEffect, useState } from "preact/hooks";
import { Room } from "trystero/torrent";
import ChatManager from "./TrysteroManagers/chatManager";
import DownloadManager from "./TrysteroManagers/downloadManager";
import UserManager from "./TrysteroManagers/userManager";
import "./assets/App.css";
import { generateKeyPair } from "./helpers/cryptoSuite";
import { ChatView } from "./views/ChatView";
import { DownloadView } from "./views/DownloadView";
import { RoomCard } from "./views/RoomCard";
import { UserView } from "./views/UserView";

function MainModal(props: {
  room: Room;
  roomId: string;
  leaveRoom: () => void;
}) {
  const { room, roomId, leaveRoom } = props;

  const [userManagerInstance] = useState(
    new UserManager({
      room,
      roomId,
    })
  );

  const [chatManagerInstance] = useState(
    new ChatManager({
      room,
      roomId,
    })
  );

  const [downloadManagerInstance] = useState(
    new DownloadManager({
      room,
      roomId,
    })
  );

  useEffect(() => {
    generateKeyPair().then((keyPair) =>
      userManagerInstance.createPersona(keyPair)
    );
  }, []);

  return (
    <>
      <RoomCard roomId={roomId} leaveRoom={leaveRoom} />
      <Tabs.Root defaultValue="tab1">
        <div className="horizontal">
          <div style={{ width: "80%", height: "100%" }}>
            <Tabs.Content value="tab1">
              <ChatView chatManagerInstance={chatManagerInstance} />
            </Tabs.Content>
            <Tabs.Content value="tab2">
              <DownloadView downloadManagerInstance={downloadManagerInstance} />
            </Tabs.Content>
          </div>
          <UserView roomId={roomId} userManagerInstance={userManagerInstance} />
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
