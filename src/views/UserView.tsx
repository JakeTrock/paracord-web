import { selfId } from "trystero";
import UserManager from "../helpers/TrysteroManagers/userManager";
import { usePersonaStore } from "../helpers/stateManagers/personaStore";
import { useUserStore } from "../helpers/stateManagers/userStore";

export function UserView(props: {
  roomId: string;
  userManagerInstance: UserManager;
}) {
  const { roomId, userManagerInstance } = props;
  const activePersona = usePersonaStore((state) =>
    state.personas.find((p) => p.roomId === roomId)
  );
  const activePeers = useUserStore((state) =>
    state.users.filter((p) => p.roomId === roomId && p.active)
  );
  return (
    <div className="sidebar filelistcontainer" style={{ overflow: "scroll" }}>
      <h2>You</h2>
      <input
        type="text"
        value={activePersona?.name || "Anonymous"}
        autocapitalize={"off"}
        autoComplete={"off"}
        style={{ width: "100%" }}
        onfocusout={(e) =>
          e.currentTarget.value.trim() !== "" &&
          userManagerInstance.setMyName(e.currentTarget.value)
        }
      />
      <p>{selfId}</p>
      <h2>Peers</h2>
      <ul>
        {activePeers.length ? (
          activePeers.map(({ name, peerId }) => (
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
