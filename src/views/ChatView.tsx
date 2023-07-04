import { useRef } from "preact/hooks";
import ChatManager from "../TrysteroManagers/chatManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import Messages from "./messages";

export function ChatView(props: { chatManagerInstance: ChatManager }) {
  const { chatManagerInstance } = props;
  const messageBox = useRef<HTMLInputElement>(null);
  const typingUsers = useClientSideUserTraits((state) => state.typingUsers);
  const userNames = useUserStore((state) =>
    state.users.map((p) => {
      return { id: p.id, name: p.name };
    })
  );
  const uiInteractive = useUserStore(
    (state) => state.users.filter((p) => p.active).length > 0
  );

  return (
    <>
      <Messages />
      <div className="horizontal" style={{ overflow: "hidden" }}>
        {typingUsers.length > 0 &&
          typingUsers.map((typingId) => {
            const userName = userNames.find((u) => u.id === typingId)?.name;
            return (
              <p key={typingId} style={{ color: "grey" }}>
                {userName} is typing...
              </p>
            );
          })}
      </div>
      <div className="horizontal">
        <input
          ref={messageBox}
          id="userTextBox"
          className="textbox"
          name="userInput"
          type="text"
          autoComplete="off"
          placeholder="Type your message"
          disabled={!uiInteractive}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              messageBox.current !== null &&
              chatManagerInstance
            ) {
              chatManagerInstance.sendChat(messageBox.current.value);
              messageBox.current.value = "";
            } else {
              chatManagerInstance.sendTypingIndicator(true);
            }
          }}
          onfocusout={(e) => chatManagerInstance.sendTypingIndicator(false)}
        />
        <button
          onClick={() => {
            if (messageBox.current !== null && chatManagerInstance) {
              chatManagerInstance.sendChat(messageBox.current.value);
              messageBox.current.value = "";
            }
          }}
          disabled={!uiInteractive}
          type="button"
        >
          send ➔
        </button>
      </div>
    </>
  );
}
