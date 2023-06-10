import { useRef } from "preact/hooks";
import ChatManager from "../helpers/TrysteroManagers/chatManager";
import { Message, User } from "../helpers/types";
import Messages from "./messages";

export function ChatView(props: {
  messageQueue: Message[];
  peers: User[];
  chatManagerInstance: ChatManager | undefined;
  roomId: string;
}) {
  const { messageQueue, peers, chatManagerInstance, roomId } = props;
  const messageBox = useRef<HTMLInputElement>(null);

  return (
    <>
      <Messages users={peers} messageQueue={messageQueue} />
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
              chatManagerInstance.sendChat(messageBox.current.value, roomId);
              messageBox.current.value = "";
            }
          }}
        />
        <button
          onClick={() => {
            if (messageBox.current !== null && chatManagerInstance) {
              chatManagerInstance.sendChat(messageBox.current.value, roomId);
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
