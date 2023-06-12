import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import RenderMessage from "../helpers/RenderMessage";
import { useMessageStore } from "../helpers/stateManagers/messageStore";

dayjs.extend(relativeTime);

export default function Messages() {
  const messageQueue = useMessageStore((store) => store.messages);

  //TODO: infinite scroll, get scroll posn and request more messages if 100 from top
  return (
    <div className="filelistcontainer">
      {messageQueue
        .sort((a, b) => a.recievedAt - b.recievedAt)
        .map((message, index) => (
          <RenderMessage
            message={message}
            index={index}
            isLast={index === messageQueue.length - 1}
          />
        ))}
    </div>
  );
}
