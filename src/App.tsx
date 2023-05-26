import { useEffect, useState } from "preact/hooks";
import { BaseRoomConfig } from "trystero";
import { Room, TorrentRoomConfig, joinRoom } from "trystero/torrent"; //TODO: Could use strategy conversion to also do firebase, but that's evil
import MainModal from "./MainModal";
import "./assets/App.css";
import { generateRoomID } from "./helpers/helpers";
import pcdLogo from "/logo.svg";

const config: BaseRoomConfig & TorrentRoomConfig = {
  appId: "paracord_chat",
  trackerUrls: ["wss://tracker.openwebtorrent.com"], //TODO: MOAR
  password: "password", //TODO: make this a prompt
};

function App() {
  //TODO: check if RTC is supported, and webtorrent trackers are reachable
  const [room, setRoom] = useState<Room | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const bootStrapRoom = (id: string) => {
    //TODO: encrypt system
    if (!room) {
      const newRoom = joinRoom(config, id);
      setRoomId(id);
      setRoom(newRoom);
      window.location.hash = id;
    }
  };

  useEffect(() => {
    const targetRoomId = window.top && window.top.location.hash.slice(1);
    if (targetRoomId) {
      bootStrapRoom(targetRoomId);
    }
  }, []);

  const leaveRoom = () => {
    if (room) {
      room.leave();
      setRoom(null);
      setRoomId(null);
      window.location.hash = "";
    }
  };

  return (
    <>
      {room && roomId ? (
        <>
          <MainModal room={room} roomId={roomId} leaveRoom={leaveRoom} />
        </>
      ) : (
        <>
          <div className="headtext horizontal">
            <img style={{ height: ".5em" }} src={pcdLogo} />
            <h1 className="headtext">Paracord</h1>
          </div>
          <div className="center">
            <div className="card">
              <h2>Join a room</h2>
              <div className="horizontal">
                <h1>PD-</h1>
                <input
                  className="textbox"
                  name="userInput"
                  type="text"
                  autoComplete="off"
                  placeholder="Room ID"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      bootStrapRoom(e.currentTarget.value);
                    }
                  }}
                />
              </div>
            </div>

            <div className="card">
              <h2>Or create a room</h2>
              <button
                className="button"
                onClick={() => {
                  bootStrapRoom(generateRoomID());
                }}
              >
                Create
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App;
