import "./assets/App.css";
import { Room } from "trystero/torrent";
import { useExtendedState } from "./helpers/helpers";
import { useState, useEffect } from "preact/hooks";
import { Chat } from "./Chat";
import Transfer from "./Transfer";
import { User } from "./helpers/types";

function RoomCard(props: { roomId: string; leaveRoom: () => void }) {
  const { roomId, leaveRoom } = props;
  return (
    <div className="card">
      <h1>Paracord</h1>
      <h2>Room ID</h2>
      <p>{roomId}</p>
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
        {peers.map(({ name, peerId }) => (
          <li key={peerId}>
            <h5>{name}</h5>
            <p>{peerId}</p>
          </li>
        ))}
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
  const [myName, setMyName] = useExtendedState<string>("Anonymous");
  const [peers, setPeers] = useState<User[]>([]);

  const [[sendName, getName]] = useState(() => room.makeAction("name"));

  getName((name, peerId) =>
    setPeers((p) => {
      const newPeers = p.map((p) => {
        if (p.peerId === peerId) p.name = name as unknown as string;
        return p;
      });
      return newPeers;
    })
  );

  useEffect(() => {
    sendName(myName);
  }, [myName, sendName]);

  room.onPeerJoin((peerId) => {
    sendName(myName, peerId);
    setPeers((peers) => [...peers, { peerId, name: "Anonymous" }]);
  });

  room.onPeerLeave((peerId) =>
    setPeers((peers) => peers.filter((p) => p.peerId !== peerId))
  );

  return (
    <>
      <div className="horizontal">
        <RoomCard roomId={roomId} leaveRoom={leaveRoom} />
        <Chat room={room} users={peers} />
        <UserManager myName={myName} setMyName={setMyName} peers={peers} />
      </div>
      <br />
      <Transfer room={room} users={peers} />
    </>
  );
}

export default MainModal;
