import { User } from "../helpers/types";

export function UserView(props: {
  myName: string;
  myId: string;
  setMyName: (name: string) => void;
  peers: User[];
}) {
  const { myName, myId, setMyName, peers } = props;
  return (
    <div className="sidebar filelistcontainer" style={{ overflow: "scroll" }}>
      <h2>You</h2>
      <input
        type="text"
        value={myName}
        autocapitalize={"off"}
        autoComplete={"off"}
        style={{ width: "100%" }}
        onChange={(e) => setMyName(e.currentTarget.value)}
      />
      <p>{myId}</p>
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
