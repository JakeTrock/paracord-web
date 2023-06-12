import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useRef } from "preact/hooks";
import { selfId } from "trystero";
import { useUserStore } from "./stateManagers/userStore";
import { Message } from "./types";

dayjs.extend(relativeTime);

export default function RenderMessage(props: {
  message: Message;
  index: number;
  isLast: boolean;
}) {
  const { message, index, isLast } = props;
  const lastMessage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isLast && lastMessage.current)
      lastMessage.current.scrollIntoView({ behavior: "smooth", block: "end" });
  });
  return (
    <>
      {message.sentBy === "system" ? (
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
          ref={isLast ? lastMessage : null}
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
            {
              useUserStore((state) =>
                state.users.find((user) => user.peerId === message.sentBy)
              )?.name
            }
          </span>
          <div
            key={index}
            ref={isLast ? lastMessage : null}
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
      )}
    </>
  );
}
