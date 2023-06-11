import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useRef } from "preact/hooks";
import { selfId } from "trystero";
import { Message, User } from "../helpers/types";

dayjs.extend(relativeTime);

export default function Messages(props: {
  messageQueue: Message[];
  users: User[];
}) {
  const { messageQueue, users } = props;
  const lastMessage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (lastMessage.current)
      lastMessage.current.scrollIntoView({ behavior: "smooth", block: "end" });
  });
  //TODO: infinite scroll, get scroll posn and request more messages if 100 from top
  return (
    <div className="filelistcontainer">
      {messageQueue
        .sort((a, b) => a.recievedAt - b.recievedAt)
        .map((message: Message, index) =>
          message.sentBy === "system" ? ( //TODO: add system messages
            <div
              key={index}
              className="filelistbox"
              style={{ textAlign: "center" }}
            >
              {message.text}
              <p style={{ color: "grey" }}>
                {dayjs().to(dayjs(message.recievedAt))}
              </p>
            </div>
          ) : message.sentBy === selfId ? (
            <div
              key={index}
              ref={index + 1 === messageQueue.length ? lastMessage : null}
              className={`tag is-medium filelistbox`}
              style={{
                backgroundColor: "var(--accent-minor-light)",
                color: "black",
                textAlign: "right",
                marginLeft: "auto",
                marginRight: 0,
                width: "fit-content",
              }}
            >
              {message.text}
              <p style={{ color: "grey" }}>
                {dayjs().to(dayjs(message.recievedAt))}
              </p>
            </div>
          ) : (
            <>
              <span style={{ fontWeight: "bold" }}>
                {users.find((user) => user.peerId === message.sentBy)?.name}
              </span>
              <div
                key={index}
                ref={index + 1 === messageQueue.length ? lastMessage : null}
                className={`tag is-medium filelistbox`}
                style={{
                  backgroundColor: "var(--accent-major-light)",
                  color: "white",
                  textAlign: "left",
                  width: "fit-content",
                }}
              >
                {message.text}
                <p style={{ color: "grey" }}>
                  {dayjs().to(dayjs(message.recievedAt))}
                </p>
              </div>
            </>
          )
        )}
    </div>
  );
}
