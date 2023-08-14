import { useRef, useState } from "preact/hooks";
import ChatManager from "../TrysteroManagers/chatManager";
import { useClientSideUserTraits } from "../stateManagers/userManagers/clientSideUserTraits";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import Messages from "./messages";

export function ChatView(props: { chatManagerInstance: ChatManager }) {
  const { chatManagerInstance } = props;
  const messageBox = useRef<HTMLTextAreaElement>(null);
  const typingUsers = useClientSideUserTraits((state) => state.typingUsers);
  const [multilineInput, setMultilineInput] = useState(false);
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
        <button
          onClick={() => setMultilineInput(!multilineInput)}
          disabled={!uiInteractive}
          type="button"
        >
          {multilineInput ? "⬆" : "⬇"}
        </button>
        <textarea //TODO: markdown support
          ref={messageBox}
          id="userTextBox"
          className="textbox"
          rows={multilineInput ? 5 : 1}
          name="userInput"
          type="text"
          autoComplete="off"
          placeholder="Type your message"
          disabled={!uiInteractive}
          onKeyDown={(e) => {
            if (messageBox.current !== null && chatManagerInstance) {
              if (
                e.key === "Enter" &&
                e.shiftKey === false &&
                !multilineInput
              ) {
                chatManagerInstance.sendChat(messageBox.current.value);
                messageBox.current.value = "";
              } else {
                chatManagerInstance.sendTypingIndicator(true);
              }
            }
          }}
          onfocusout={() => chatManagerInstance.sendTypingIndicator(false)}
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
