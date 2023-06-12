import { useRef } from "preact/hooks";
import ChatManager from "../helpers/TrysteroManagers/chatManager";
import Messages from "./messages";

export function ChatView(props: { chatManagerInstance: ChatManager }) {
  const { chatManagerInstance } = props;
  const messageBox = useRef<HTMLInputElement>(null);

  return (
    <>
      <Messages />
      <div className="horizontal">
        <input
          ref={messageBox}
          className="textbox"
          name="userInput"
          type="text"
          autoComplete="off"
          placeholder="Type your message"
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              messageBox.current !== null &&
              chatManagerInstance
            ) {
              chatManagerInstance.sendChat(messageBox.current.value);
              messageBox.current.value = "";
            }
          }}
        />
        <button
          onClick={() => {
            if (messageBox.current !== null && chatManagerInstance) {
              chatManagerInstance.sendChat(messageBox.current.value);
              messageBox.current.value = "";
            }
          }}
          type="button"
        >
          send ➔
        </button>
      </div>
    </>
  );
}
