import { StateUpdater } from "preact/hooks";
import shortid from "shortid";
import streamSaver from "streamsaver";
import { Room, selfId } from "trystero";
import { decryptMessage, encryptMessage } from "../cryptoSuite";
import { FileMetaData, FileOffer, FileProgress, User } from "../types";
import DBManager from "./dbManager";

export default class DownloadManager {
  private getRealFiles: () => Promise<{ [key: string]: File }>;
  private setRealFiles: StateUpdater<{ [key: string]: File }>;
  private sendFileRequest: (id: string, peerIds?: string | string[]) => void;
  private sendFileOffer: (files: string, peerIds?: string | string[]) => void;
  private getUsers: () => Promise<User[]>;
  private requestableDownloads;
  private setProgressQueue: StateUpdater<FileProgress[]>;

  constructor({
    room,
    roomId,
    dbManager,
    realFiles,
    downloadCache,
    setProgressQueue,
    privateKey,
  }: {
    room: Room;
    roomId: string;
    dbManager: DBManager;
    realFiles: [
      () => Promise<{
        [key: string]: File;
      }>,
      StateUpdater<{
        [key: string]: File;
      }>
    ];
    downloadCache: [
      () => Promise<{
        [key: string]: FileOffer[];
      }>,
      StateUpdater<{
        [key: string]: FileOffer[];
      }>
    ];
    setProgressQueue: StateUpdater<FileProgress[]>;
    privateKey: CryptoKey;
  }) {
    const [sendFile, getFile, onFileProgress] = room.makeAction("transfer");
    const [sendFileRequest, getFileRequest] = room.makeAction("fileRequest");
    const [sendFileOffer, getFileOffer] = room.makeAction("fileOffer");
    this.sendFileRequest = sendFileRequest;
    this.sendFileOffer = sendFileOffer;
    this.setProgressQueue = setProgressQueue;

    const [requestableDownloads, setRequestableDownloads] = downloadCache;

    const [getRealFiles, setRealFiles] = realFiles;
    this.getRealFiles = getRealFiles;
    this.setRealFiles = setRealFiles;

    this.requestableDownloads = requestableDownloads;

    this.getUsers = () => dbManager.getAllUsers(roomId);
    console.log("DownloadManager initialized");

    onFileProgress((percent, peerId, metadata) => {
      const processedMeta = metadata as FileMetaData;
      setProgressQueue((prev) => {
        const newProg = prev.filter((prog) => prog.id !== processedMeta.id);
        newProg.push({
          id: processedMeta.id,
          name: processedMeta.name,
          progress: percent,
          toMe: true,
        });
        return newProg;
      });
    });

    getFileRequest((data, peerId) => {
      decryptMessage(privateKey, data as unknown as string)
        .then(async (data) => {
          const id = data as string;
          console.log(`Received file request from ${peerId} for ${id}`);
          const realFiles = await this.getRealFiles();
          if (realFiles && (id as string) in realFiles) {
            const currentFile = realFiles[id as string];

            sendFile(
              //TODO: encrypt
              currentFile,
              peerId,
              {
                id: id as string,
                name: currentFile.name,
                size: currentFile.size,
              },
              (percent, peerId) =>
                setProgressQueue((prev) => {
                  const newProg = prev.filter(
                    (prog) => prog.id !== (id as string)
                  );
                  if (percent !== 1)
                    newProg.push({
                      id: id as string,
                      name: currentFile.name,
                      progress: percent,
                      toMe: true,
                    });
                  return newProg;
                })
            );
          }
        })
        .catch((e) => console.error(e));
    });

    getFile((file, peerId, metadata) => {
      const processedMeta = metadata as FileMetaData;
      console.log(`Received file ${processedMeta.name} from ${peerId}`);
      this.setProgressQueue((oldStatuses) =>
        oldStatuses.filter((s) => s.id !== processedMeta.id)
      );

      const fileStream = streamSaver.createWriteStream(processedMeta.name, {
        //TODO: may need to polyfill at some point
        size: processedMeta.size, // (optional filesize)
      });
      const procFile = new Response(file as Uint8Array).body;
      if (procFile) procFile.pipeTo(fileStream).catch(console.error);
    });

    getFileOffer((data, peerId) => {
      console.log(`Received file offer from ${peerId}`);
      decryptMessage(privateKey, data as unknown as string)
        .then((data) => {
          const files = JSON.parse(data) as FileOffer[];
          setRequestableDownloads((priorDownloads) => {
            return { ...priorDownloads, [peerId]: files as FileOffer[] };
          });
        })
        .catch((e) => console.error(e));
    });
  }

  public requestFile = async (fromUser: string, id: string) => {
    const allRequestable = await this.requestableDownloads();
    const requestableFiles = allRequestable[fromUser];
    const findName =
      requestableFiles && requestableFiles.find((f) => f.id === id);
    if (findName) {
      this.setProgressQueue((oldStatuses: FileProgress[]) => {
        return [
          ...oldStatuses,
          {
            id: findName.id,
            name: findName.name,
            progress: 0,
            toMe: true,
          } as FileProgress,
        ];
      });

      const pubKey = (await this.getUsers()).find(
        (u) => u.peerId === fromUser
      )?.pubKey;

      if (pubKey) {
        await encryptMessage(pubKey, id).then((encodedMessage) => {
          this.sendFileRequest(encodedMessage, fromUser); //TODO: encrypt
        });
      }
    } else {
      alert("file not found!");
    }
  };

  public offerRequestableFiles = async (
    toOffer: { [id: string]: File } | undefined
  ) => {
    const realFiles = await this.getRealFiles();
    if (!toOffer) toOffer = realFiles;
    if (!toOffer) return;
    const files: FileOffer[] = Object.entries(toOffer).map(([id, file]) => ({
      id,
      ownerId: selfId as string, //TODO: remove when user manager class added
      name: file.name,
      size: file.size,
    }));
    const msgString = JSON.stringify(files);

    const users = await this.getUsers();
    const offersToSend = users.map(async ({ peerId, pubKey }) => {
      if (pubKey) {
        await encryptMessage(pubKey, msgString).then((encodedMessage) => {
          this.sendFileOffer(encodedMessage, [peerId]);
        });
      }
    });
    console.log(offersToSend);
    await Promise.all(offersToSend);
  };

  public removeRealFile = (id: string) => {
    this.setProgressQueue((prev) => {
      const newProg = prev.filter((prog) => prog.id !== (id as string));
      return newProg;
    });

    Array.from(document.getElementsByClassName(id)).forEach(
      (el) => el.remove() // remove indicator
    );

    this.setRealFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[id];
      return newFiles;
    });
  };

  public addRealFiles = (initialList: File[]) => {
    const filesToAdd: { [key: string]: File } = {};
    Array.from(initialList).map(
      (file) => (filesToAdd[shortid.generate()] = file)
    );

    console.log(filesToAdd);

    this.setRealFiles((prev) => {
      const newFiles = { ...prev, ...filesToAdd };
      this.offerRequestableFiles(newFiles);
      return newFiles;
    });
  };
}
