import { selfId } from "trystero";
import UserManager from "../TrysteroManagers/userManager";
import MuteUserButton from "../helpers/MuteUserButton";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";

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
  const mutedPeers = useClientSideUserTraits();
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
      <p style={{ color: "grey" }}>{selfId}</p>
      <h2>Peers</h2>
      <ul>
        {activePeers.length ? (
          activePeers.map(({ name, id }) => (
            <li key={id}>
              <h5 className="horizontal">
                <MuteUserButton
                  toggleMuted={() => mutedPeers.toggleMute(id)}
                  isMuted={mutedPeers.mutedUsers[id] || false}
                />
                {name}
              </h5>
              <p style={{ color: "grey" }}>{id}</p>
            </li>
          ))
        ) : (
          <h3>Waiting...</h3>
        )}
      </ul>
    </div>
  );
}
