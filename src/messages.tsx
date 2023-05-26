import { useEffect, useRef } from "preact/hooks";
import { Message, User } from "./helpers/types";

export default function Messages(props: {
  messages: Message[];
  users: User[];
}) {
  const lastMessage = useRef<HTMLDivElement>(null);
  const { messages, users } = props;
  useEffect(() => {
    if (lastMessage.current)
      lastMessage.current.scrollIntoView({ behavior: "smooth", block: "end" });
  });
  return (
    <div className="filelistcontainer">
      {messages.map((message, index) =>
        message.type === "system" ? (
          <div
            key={index}
            className="filelistbox"
            style={{ textAlign: "center" }}
          >
            {message.text}
          </div>
        ) : message.type === "fromMe" ? (
          <div
            key={index}
            ref={index + 1 === messages.length ? lastMessage : null}
            className={`tag is-medium filelistbox`}
            style={{
              backgroundColor: "#f5f5f5",
              color: "black",
              textAlign: "right",
              marginLeft: "auto",
              marginRight: 0,
              width: "fit-content",
            }}
          >
            {message.text}
          </div>
        ) : (
          <>
            <span style={{ fontWeight: "bold" }}>
              {users.find((user) => user.peerId === message.sentBy)?.name}
            </span>
            <div
              key={index}
              ref={index + 1 === messages.length ? lastMessage : null}
              className={`tag is-medium filelistbox`}
              style={{
                backgroundColor: "#00d1b2",
                color: "white",
                textAlign: "left",
                width: "fit-content",
              }}
            >
              {message.text}
            </div>
          </>
        )
      )}
    </div>
  );
}
