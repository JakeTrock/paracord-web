import "./assets/App.css";
import { ActionReceiver, ActionSender, Room, joinRoom } from "trystero/torrent";
import { useExtendedState } from "./helpers";
import { useState, useEffect } from "preact/hooks";
import { Chat } from "./Chat";
import Transfer from "./Transfer";

export interface User {
  peerId: string;
  name: string | "Anonymous";
}

function UserManager(props: { room: Room }) {
  //TODO: when system refreshes on quit, it still gets mad that 'name' et al are recreated
  const { room } = props;
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
      <Chat room={room} users={peers} />
      <Transfer room={room} users={peers} />
    </>
  );
}

export default UserManager;
