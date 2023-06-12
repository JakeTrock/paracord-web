import streamSaver from "streamsaver";
import { Room, selfId } from "trystero";
import { decryptMessage, encryptMessage } from "../cryptoSuite";
import { sendSystemMessage } from "../helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useRealFiles } from "../stateManagers/downloadManagers/realFileManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { usePersonaStore } from "../stateManagers/userManagers/personaStore";
import { useUserStore } from "../stateManagers/userManagers/userStore";
import { FileMetaData, FileOffer } from "../types";

export default class DownloadManager {
  private sendFileRequest: (id: string, ids?: string | string[]) => void;
  private sendFileOffer: (files: string, ids?: string | string[]) => void;

  constructor({ room, roomId }: { room: Room; roomId: string }) {
    const [sendFile, getFile, onFileProgress] =
      room.makeAction<File>("transfer");
    const [sendFileRequest, getFileRequest] =
      room.makeAction<string>("fileRequest");
    const [sendFileOffer, getFileOffer] = room.makeAction<string>("fileOffer");
    this.sendFileRequest = sendFileRequest;
    this.sendFileOffer = sendFileOffer;

    onFileProgress((progress, id, metadata) => {
      const processedMeta = metadata as FileMetaData;
      useProgressStore
        .getState()
        .updateProgress(processedMeta.id, { progress });
    });

    getFileRequest((data, id) => {
      const currentPersona = usePersonaStore
        .getState()
        .personas.find((persona) => persona.roomId === roomId);
      const privateKey = currentPersona && currentPersona.keyPair.privateKey;
      if (!privateKey) return console.error("Could not find private key");

      decryptMessage(privateKey, data)
        .then(async (id) => {
          const realFiles = useRealFiles.getState().realFiles;
          if (realFiles && id in realFiles) {
            const currentFile = realFiles[id];
            useProgressStore.getState().addProgress({
              id,
              name: currentFile.name,
              progress: 0,
              toMe: false,
            });
            sendFile(
              //TODO: encrypt
              currentFile,
              id,
              {
                id: id,
                name: currentFile.name,
                size: currentFile.size,
              },
              (percent, id) =>
                useProgressStore
                  .getState()
                  .updateProgress(id, { progress: percent })
            );
          }
        })
        .catch((e) => console.error(e));
    });

    getFile((file, id, metadata) => {
      const processedMeta = metadata as FileMetaData;
      useProgressStore.getState().deleteProgress(processedMeta.id);

      const fileStream = streamSaver.createWriteStream(processedMeta.name, {
        //TODO: may need to polyfill at some point
        size: processedMeta.size, // (optional filesize)
      });
      const procFile = new Response(file).body;
      if (procFile) procFile.pipeTo(fileStream).catch(console.error);
    });

    getFileOffer(async (data, id) => {
      const currentPersona = usePersonaStore
        .getState()
        .personas.find((persona) => persona.roomId === roomId);
      const privateKey = currentPersona && currentPersona.keyPair.privateKey;
      if (!privateKey) return console.error("Could not find private key");
      await decryptMessage(privateKey, data)
        .then((data) =>
          useOfferStore.getState().updateOrAddRequestable(id, JSON.parse(data))
        )
        .catch((e) => console.error(e));
      sendSystemMessage(roomId, `${id} offered you files`);
    });
  }

  public requestFile = async (fromUser: string, id: string) => {
    const requestableFiles =
      useOfferStore.getState().requestableDownloads[fromUser];
    const findName =
      requestableFiles && requestableFiles.find((f) => f.id === id);
    if (findName) {
      useProgressStore.getState().addProgress({
        id: findName.id,
        name: findName.name,
        progress: 0,
        toMe: true,
      });

      const pubKey = useUserStore
        .getState()
        .users.find((u) => u.id === fromUser)?.pubKey;

      if (pubKey) {
        await encryptMessage(pubKey, id).then((encodedMessage) =>
          this.sendFileRequest(encodedMessage, fromUser)
        );
      }
    } else {
      alert("file not found!");
    }
  };

  public offerRequestableFiles = async () => {
    const realFiles = useRealFiles.getState().realFiles;
    if (!realFiles) return;
    const files: FileOffer[] = Object.entries(realFiles).map(([id, file]) => ({
      id,
      ownerId: selfId,
      name: file.name,
      size: file.size,
    }));
    const msgString = JSON.stringify(files);

    const offersToSend = useUserStore
      .getState()
      .users.map(async ({ id, pubKey }) => {
        if (pubKey) {
          await encryptMessage(pubKey, msgString).then((encodedMessage) => {
            this.sendFileOffer(encodedMessage, [id]);
          });
        }
      });
    await Promise.all(offersToSend);
  };

  public removeRealFile = (id: string) => {
    useProgressStore.getState().deleteProgress(id);
    useRealFiles.getState().deleteRealFile(id);
  };

  public addRealFiles = (initialList: File[]) => {
    useRealFiles.getState().addRealFiles(initialList);
    this.offerRequestableFiles();
  };
}
