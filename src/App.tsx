import "./assets/App.css";
import { Room, TorrentRoomConfig, joinRoom } from "trystero/torrent"; //TODO: Could use strategy conversion to also do firebase, but that's evil
import React from "react";
import UserManager from "./User";
import { BaseRoomConfig } from "trystero";

const generateID = () => (Math.random() + 1).toString(36).substring(2, 6);

const config: BaseRoomConfig & TorrentRoomConfig = {
  appId: "paracord_chat",
  trackerUrls: ["wss://tracker.openwebtorrent.com"], //TODO: MOAR
  password: "password", //TODO: make this a prompt
};

function App() {
  //TODO: check if RTC is supported, and webtorrent trackers are reachable
  const [room, setRoom] = React.useState<Room | null>(null);
  const [roomId, setRoomId] = React.useState<string | null>(null);

  const bootStrapRoom = (id: string) => {
    //TODO: should also be able to set from URL
    if (!room) {
      const newRoom = joinRoom(config, id);

      setRoomId(id);

      setRoom(newRoom);
    }
  };

  return (
    <>
      {room ? (
        <>
          <h1>Paracord</h1>
          <div className="card">
            <h2>Room ID</h2>
            <p>{roomId}</p>
          </div>
          <UserManager room={room} />
          <button
            onClick={() => {
              room.leave();
              setRoom(null);
            }}
          >
            Leave Room
          </button>
        </>
      ) : (
        <>
          <h1>Paracord</h1>
          <div className="card">
            <h2>Join a room</h2>
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

          <div className="card">
            <h2>Or create a room</h2>
            <button
              className="button"
              onClick={() => {
                bootStrapRoom(generateID());
              }}
            >
              Create
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default App;
