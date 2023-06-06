import { useState } from "preact/hooks";

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
  //@ts-ignore
  const peerConn = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
  const canDataChannel = !!(peerConn && peerConn.prototype && peerConn.prototype.createDataChannel);
  return !!peerConn && canDataChannel;
}