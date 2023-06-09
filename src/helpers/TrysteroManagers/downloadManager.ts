import { StateUpdater } from "preact/hooks";
import shortid from "shortid";
import streamSaver from "streamsaver";
import { Room, selfId } from "trystero";
import { FileMetaData, FileOffer, FileProgress, User } from "../types";

export default class DownloadManager {
  public realFiles: { [key: string]: File } | undefined = undefined;
  private sendFileRequest: (id: string, peerIds?: string | string[]) => void;
  private sendFileOffer: (
    files: FileOffer[],
    peerIds?: string | string[]
  ) => void;
  private getUsers: () => Promise<User[]>; //TODO: remove when user manager class added
  private requestableDownloads;
  private setProgressQueue: StateUpdater<FileProgress[]>;

  constructor(
    room: Room,
    downloadCache: [
      () => Promise<{
        [key: string]: FileOffer[];
      }>,
      StateUpdater<{
        [key: string]: FileOffer[];
      }>
    ],
    setProgressQueue: StateUpdater<FileProgress[]>,
    asyncGetUsers: () => Promise<User[]>, //TODO: remove when user manager class added
    privateKey: CryptoKey
  ) {
    const [sendFile, getFile, onFileProgress] = room.makeAction("transfer");
    const [sendFileRequest, getFileRequest] = room.makeAction("fileRequest");
    const [sendFileOffer, getFileOffer] = room.makeAction("fileOffer");
    this.sendFileRequest = sendFileRequest;
    this.sendFileOffer = sendFileOffer;
    this.setProgressQueue = setProgressQueue;

    const [requestableDownloads, setRequestableDownloads] = downloadCache;

    this.requestableDownloads = requestableDownloads;

    this.getUsers = asyncGetUsers;
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

    getFileRequest((id, peerId) => {
      console.log(`Received request for ${id} from ${peerId}`);
      if (this.realFiles && (id as string) in this.realFiles) {
        const currentFile = this.realFiles[id as string];

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
              const newProg = prev.filter((prog) => prog.id !== (id as string));
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

    getFileOffer((files, peerId) => {
      console.log(`Received file offer from ${peerId}`);
      setRequestableDownloads((priorDownloads) => {
        return { ...priorDownloads, [peerId]: files as FileOffer[] };
      });
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
      this.sendFileRequest(id, fromUser); //TODO: encrypt
    } else {
      alert("file not found!");
    }
  };

  public offerRequestableFiles = (
    toOffer: { [id: string]: File } | undefined = this.realFiles
  ) => {
    if (!toOffer) return;
    const files: FileOffer[] = Object.entries(toOffer).map(([id, file]) => ({
      id,
      ownerId: selfId as string, //TODO: remove when user manager class added
      name: file.name,
      size: file.size,
    }));
    this.sendFileOffer(files); //TODO: encrypt
  };

  public removeRealFile = (id: string) => {
    this.setProgressQueue((prev) => {
      const newProg = prev.filter((prog) => prog.id !== (id as string));
      return newProg;
    });

    Array.from(document.getElementsByClassName(id)).forEach(
      (el) => el.remove() // remove indicator
    );

    const newFiles = { ...this.realFiles };
    delete newFiles[id];
    this.realFiles = newFiles;
  };

  public addRealFiles = (initialList: File[]) => {
    const filesToAdd: { [key: string]: File } = {};
    Array.from(initialList).map(
      (file) => (filesToAdd[shortid.generate()] = file)
    );
    const newFiles = { ...this.realFiles, ...filesToAdd };
    this.offerRequestableFiles(newFiles);
    this.realFiles = newFiles;
  };
}
