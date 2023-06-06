import { Room } from "trystero/torrent";
import "./assets/App.css";

import { useRef, useState } from "preact/hooks";
import shortid from "shortid";
import { decryptMessage, encryptMessage } from "./helpers/cryptoSuite";
import { Message, MessageFromMe, MessageToMe, User } from "./helpers/types";
import Messages from "./messages";

export function Chat(props: {
  room: Room;
  users: User[];
  encryptionInfo?: CryptoKeyPair | undefined;
}) {
  const { room, users, encryptionInfo } = props;

  const [[sendChatAction, getChatAction]] = useState(() =>
    room.makeAction("chat")
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const messageBox = useRef<HTMLInputElement>(null);

  const sendChat = async () => {
    if (messageBox.current === null || messageBox.current.value.trim() === "")
      return;
    const message = messageBox.current.value;
    const newMessage: MessageFromMe = {
      type: "fromMe",
      msgId: shortid.generate(),
      text: message,
      sentAt: Date.now(),
    };
    const msgString = JSON.stringify(newMessage);
    const messagesToSend = users.map(async ({ peerId, pubKey }) => {
      if (pubKey) {
        await encryptMessage(pubKey, msgString).then((encodedMessage) => {
          sendChatAction(encodedMessage, [peerId]);
        });
      }
    });
    await Promise.all(messagesToSend);
    // sendChatAction(newMessage);
    setMessages((messages) => [...messages, newMessage]);
    messageBox.current.value = "";
  };

  getChatAction(async (data, peerId) => {
    if (!encryptionInfo) return console.error("No private key");
    const dataDecoded = await decryptMessage(
      encryptionInfo.privateKey,
      data as unknown as string
    )
      .then((data) => {
        return JSON.parse(data) as MessageToMe;
      })
      .catch((e) => console.error(e));
    if (dataDecoded === undefined)
      return console.error("Could not decrypt message");
    // const dataDecoded = data as MessageToMe;
    const newMessage: Message = {
      type: "toMe",
      msgId: dataDecoded.msgId,
      text: dataDecoded.text,
      sentAt: dataDecoded.sentAt,
      sentBy: peerId,
      recievedAt: Date.now(),
    };
    setMessages((messages) => [...messages, newMessage]);
  });

  return (
    <>
      <div className="card" style={{ width: "100%" }}>
        <h2>Chat</h2>
        <div className="card">
          <Messages users={users} messages={messages} />
          <div className="horizontal">
            <input
              ref={messageBox}
              className="textbox"
              name="userInput"
              type="text"
              autoComplete="off"
              placeholder="Type your message"
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
            />
            <button onClick={sendChat} type="button">
              send ➔
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
