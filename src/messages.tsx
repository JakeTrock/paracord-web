import React, { useEffect } from "react";
import { User } from "./User";

export type Message = MessageFromMe | MessageToMe | MessageSystem;

export interface MessageFromMe {
  type: "fromMe";
  msgId: string;
  text: string;
  sentAt: number;
}

export interface MessageToMe {
  type: "toMe";
  msgId: string;
  text: string;
  sentAt: number;
  sentBy: string;
  recievedAt: number;
}

export interface MessageSystem {
  type: "system";
  text: string;
  sentAt: number;
}

interface IMessagesProps {
  messages: Message[];
  users: User[];
}

export const generateMsgID = () => Math.random().toString(36).substring(2, 15);

export default function Messages(props: IMessagesProps) {
  const lastMessage = React.useRef<HTMLDivElement>(null);
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
