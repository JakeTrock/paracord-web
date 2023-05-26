import "./assets/App.css";
import { Room } from "trystero/torrent";

import { useState, useRef } from "preact/hooks";
import { Message, MessageFromMe, MessageToMe, User } from "./helpers/types";
import { generateMsgID } from "./helpers/helpers";
import Messages from "./messages";

export function Chat(props: { room: Room; users: User[] }) {
  const { room, users } = props;

  const [[sendChatAction, getChatAction]] = useState(() =>
    room.makeAction("chat")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const messageBox = useRef<HTMLInputElement>(null);

  const sendChat = () => {
    if (messageBox.current === null) return;
    const message = messageBox.current.value;
    const newMessage: MessageFromMe = {
      type: "fromMe",
      msgId: generateMsgID(),
      text: message,
      sentAt: Date.now(),
    };
    sendChatAction(newMessage);
    setMessages((messages) => [...messages, newMessage]);
    messageBox.current.value = "";
  };

  getChatAction((data, peerId) => {
    const newMessage: Message = {
      type: "toMe",
      msgId: (data as unknown as MessageToMe).msgId,
      text: (data as unknown as MessageToMe).text,
      sentAt: (data as unknown as MessageToMe).sentAt,
      sentBy: peerId,
      recievedAt: Date.now(),
    };
    setMessages((messages) => [...messages, newMessage]);
  });

  return (
    <>
      <div className="card">
        <h2>Chat</h2>
        <div className="card">
          <Messages users={users} messages={messages} />
          <div className="card">
            <input
              ref={messageBox}
              className="textbox"
              name="userInput"
              type="text"
              autoComplete="off"
              placeholder="Type your message"
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
            />
            <button className="bigbutton" onClick={sendChat} type="button">
              send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
