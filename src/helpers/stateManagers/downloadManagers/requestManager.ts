import { create } from "zustand";
import { FileOffer } from "../../types";

interface OfferStore {
  requestableDownloads: { [key: string]: FileOffer[] };
  updateOrAddRequestable: (peerId: string, offers: FileOffer[]) => void;
  removeRequestablesForId: (peerId: string) => void;
}

export const useOfferStore = create<OfferStore>((set) => ({
  requestableDownloads: {},

  updateOrAddRequestable: (peerId: string, offers: FileOffer[]) =>
    set((state) => ({
      requestableDownloads: {
        ...state.requestableDownloads,
        [peerId]: offers,
      },
    })),
  removeRequestablesForId: (peerId: string) =>
    set((state) => ({
      requestableDownloads: (() => {
        const requestables = state.requestableDownloads;
        if (peerId in requestables) delete requestables[peerId];
        return requestables;
      })(),
    })),
}));
