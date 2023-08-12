import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import DOMPurify from "dompurify";
import Reply from "mdi-preact/ReplyIcon";
import { useEffect, useRef } from "preact/hooks";
import { generateHexColorFromString } from "./helpers";
import { Message } from "./types";

dayjs.extend(relativeTime);

const formatMessage = (message: string) => {
  const replyRegex = />>(.{9})/gi;

  const linkRegex =
    /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;

  message = message.replace(
    linkRegex,
    `<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>`
  );
  message = message.replace(replyRegex, `<a class="msgLink $1">&gt;&gt;$1</a>`);

  return message;
};

export default function RenderMessage(props: {
  message: Message;
  sentByName: string;
  index: number;
  isLast: boolean;
}) {
  const { message, index, isLast, sentByName } = props;
  const lastMessage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isLast && lastMessage.current)
      lastMessage.current.scrollIntoView({ behavior: "smooth", block: "end" });
    Array.from(document.getElementsByClassName("msgLink")).forEach(
      (element) => {
        element.setAttribute("cursor", "pointer");
        element.addEventListener("click", (e) => {
          const id = (e.target as HTMLAnchorElement).className.split(" ")[1];
          const msg = document.getElementById(id);
          if (msg) msg.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    );
  });
  return (
    <>
      {message.sentBy === "system" ? (
        <div
          key={index}
          className="filelistbox"
          style={{
            textAlign: "center",
            border: "1px solid rgba(var(--card-border-rgb), 0.20)",
            borderRadius: "var(--border-radius)",
          }}
        >
          {message.text}
          <p style={{ color: "grey" }}>
            {dayjs().to(dayjs(message.recievedAt))}
          </p>
        </div>
      ) : (
        <>
          <div className="horizontal">
            <div
              key={message.id}
              id={message.id}
              ref={isLast ? lastMessage : null}
              className={`tag is-medium filelistbox`}
              style={{
                backgroundColor: "var(--background-rgb)",
                color: "var(--foreground-rgb)",
                textAlign: "left",
                width: "fit-content",
              }}
            >
              <span className="horizontal">
                <h4
                  style={{
                    fontWeight: "bold",
                    color: generateHexColorFromString(message.sentBy),
                  }}
                >
                  {sentByName}
                </h4>
                <p
                  style={{
                    paddingLeft: "1em",
                    fontSize: ".8em",
                    color: "grey",
                  }}
                >
                  {dayjs().to(dayjs(message.recievedAt))}
                </p>
                <div
                  style={{
                    paddingLeft: "1em",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    const textBox = document.getElementById(
                      "userTextBox"
                    ) as HTMLFormElement;
                    if (textBox) textBox.value += `>>${message.id} `;
                  }}
                >
                  <Reply />
                </div>
              </span>
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(formatMessage(message.text)),
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
