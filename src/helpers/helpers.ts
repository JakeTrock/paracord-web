import { useState } from "preact/hooks";
import shortid from "shortid";
import { useMessageStore } from "./stateManagers/messageStore";

export function useExtendedState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const getLatestState = () =>
    new Promise<T>((resolve) => {
      setState((s) => {
        resolve(s);
        return s;
      });
    });

  return [state, setState, getLatestState] as const;
}

export const fancyBytes = (bytes: number) => {
  const size = Math.floor(bytes / 1e6);
  return size < 1 ? `${Math.floor(bytes / 1e3)}Kb` : `${size}Mb`;
};

export const isRtcSupported = () => {
  const peerConn =
    window.RTCPeerConnection ||
    //@ts-ignore
    window.mozRTCPeerConnection ||
    //@ts-ignore
    window.webkitRTCPeerConnection;
  const canDataChannel = !!(
    peerConn &&
    peerConn.prototype &&
    peerConn.prototype.createDataChannel
  );
  return !!peerConn && canDataChannel;
};

export const sendSystemMessage = (roomId: string, text: string) =>
  useMessageStore.getState().addMessage({
    id: shortid.generate(),
    text,
    sentAt: new Date().getTime(),
    roomId: roomId,
    sentBy: "system",
    recievedAt: new Date().getTime(),
  });
