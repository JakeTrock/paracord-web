import React from "react";

export function useExtendedState<T>(initialState: T) {
    const [state, setState] = React.useState<T>(initialState);
    const getLatestState = () =>
      new Promise<T>((resolve) => {
        setState((s) => {
          resolve(s);
          return s;
        });
      });
  
    return [state, setState, getLatestState] as const;
  }