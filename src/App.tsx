import { useEffect, useRef, useState } from "preact/hooks";
import shortid from "shortid";
import { BaseRoomConfig } from "trystero";
import { Room, TorrentRoomConfig, joinRoom } from "trystero/torrent";
import MainModal from "./MainModal";
import "./assets/App.css";
import { isRtcSupported } from "./helpers/helpers";
import pcdLogo from "/logo.svg";

//TODO: 4.0: add accounts with "boosting", paid fb vs free webtorrent. We should likely have our own tracker so we don't get blamed for outages

const installedTrackers = [
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.btorrent.xyz",
  "wss://tracker.files.fm:7073/announce",
  "wss://qot.abiir.top:443/announce",
];

export const tradeName = "paracord_chat";

const defaultRoomConfig: BaseRoomConfig & TorrentRoomConfig = {
  appId: tradeName,
  trackerUrls: installedTrackers,
  rtcConfig: {
    iceServers: [
      { urls: "stun:46.165.240.76:3478" },
      { urls: "stun:108.61.211.199:3478" },
      {
        urls: "turn:46.165.240.76:3478",
        credential: "asperTinO1",
        username: "otrto",
      },
      {
        urls: "turn:108.61.211.199:3478",
        credential: "asperTinO1",
        username: "otrto",
      },
    ],
  },
};

const RTCSupport = isRtcSupported();

function RoomCreator(props: {
  bootStrapRoom: (id: string, password?: string) => void;
}) {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const roomRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { bootStrapRoom } = props;
  return (
    <>
      <div className="headtext horizontal">
        <img style={{ height: ".5em" }} src={pcdLogo} />
        <h1 className="headtext">Paracord</h1>
      </div>
      <div className="center">
        <div className="card">
          <h2>Join a room</h2>
          <div className="horizontal">
            <h3>PD-</h3>
            <input
              ref={roomRef}
              className="textbox"
              name="userInput"
              type="text"
              autoComplete="off"
              placeholder="Room ID"
            />
            <button
              className="button"
              onClick={() =>
                roomRef.current && (roomRef.current.value = shortid.generate())
              }
            >
              Random
            </button>
          </div>
          <div className="horizontal">
            <h3>Password(optional):</h3>
            <input
              ref={passwordRef}
              className="textbox"
              name="userInput"
              type={passwordVisible ? "text" : "password"}
              autoComplete="off"
              placeholder="Password"
            />
            <button
              className="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </div>
          <button
            className="button"
            onClick={() =>
              roomRef.current &&
              bootStrapRoom(
                roomRef.current.value,
                passwordRef.current ? passwordRef.current.value : undefined
              )
            }
          >
            Join
          </button>
        </div>
      </div>
    </>
  );
}

function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const bootStrapRoom = (id: string, roomPassword?: string) => {
    if (id && !room) {
      const newRoom = joinRoom(
        { ...defaultRoomConfig, password: roomPassword },
        id
      );
      setRoomId(id);
      setRoom(newRoom);
      window.location.hash = `${id}?${roomPassword}`;
    }
  };

  useEffect(() => {
    if (window.top) {
      const roomInfo = window.top.location.hash.slice(1).split("?");
      if (roomInfo.length > 1) {
        bootStrapRoom(roomInfo[0], roomInfo[1]);
      } else {
        bootStrapRoom(roomInfo[0]);
      }
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
      {RTCSupport ? (
        room && roomId ? (
          <>
            <MainModal room={room} roomId={roomId} leaveRoom={leaveRoom} />
          </>
        ) : (
          <RoomCreator bootStrapRoom={bootStrapRoom} />
        )
      ) : (
        <>
          <div className="headtext horizontal">
            <img style={{ height: ".5em" }} src={pcdLogo} />
            <h1 className="headtext">Paracord</h1>
          </div>
          <div className="center">
            <div className="card">
              <h2>Sorry, your browser is not supported</h2>
              <p>
                Paracord uses WebRTC to connect peers, and your browser does not
                support it. Please use a browser that supports WebRTC, such as
                Google Chrome.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App;
