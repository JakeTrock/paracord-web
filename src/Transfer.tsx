import { useState } from "preact/hooks";
import { FileUploader } from "react-drag-drop-files";
import shortid from "shortid";
import streamSaver from "streamsaver";
import { Room } from "trystero/torrent";
import "./assets/App.css";
import CollapsibleContainer from "./helpers/Collapsible";
import { fancyBytes } from "./helpers/helpers";
import { FileMetaData, User } from "./helpers/types";

function Transfer(props: { room: Room; users: User[] }) {
  const { room, users } = props;
  const [[sendFile, getFile, onFileProgress]] = useState(() =>
    room.makeAction("transfer")
  );
  const [[sendFileRequest, getFileRequest]] = useState(() =>
    room.makeAction("fileRequest")
  );
  const [[sendFileOffer, getFileOffer]] = useState(() =>
    room.makeAction("fileOffer")
  );

  //TODO: filelist needs to be sent on init,
  //perhaps pop a dialog of some sort/add share
  //button(autoshare switch needed too I guess)
  //Theoretically couldnt you useeffect the userlist?

  interface statusBar {
    id: string;
    toId: string;
    fileName: string;
    toMe: boolean;
  }

  const [realFiles, setRealFiles] = useState<{ [id: string]: File }>({});
  const [requestableFiles, setRequestableFiles] = useState<{
    [userId: string]: FileMetaData[];
  }>({});
  const [progressTrayStatuses, setProgressTrayStatuses] = useState<statusBar[]>(
    []
  );

  onFileProgress((percent, peerId, metadata) => {
    const processedMeta = metadata as FileMetaData;

    const progbar = document.getElementById(
      `progbar-${processedMeta.id}-${peerId}`
    ) as HTMLProgressElement;
    if (progbar) progbar.value = percent * 100;
  });

  const requestFile = (fromUser: string, id: string) => {
    const findName = requestableFiles[fromUser].find((f) => f.id === id);
    if (findName) {
      setProgressTrayStatuses((oldStatuses) => [
        ...oldStatuses,
        {
          id: id as string,
          toId: fromUser,
          fileName: findName.name,
          toMe: true,
        },
      ]);
      sendFileRequest(id, fromUser); //TODO: encrypt
    } else {
      alert("file not found!");
    }
  };

  getFileRequest((id, peerId) => {
    console.log(`Received request for ${id} from ${peerId}`);
    if ((id as string) in realFiles) {
      const currentFile = realFiles[id as string];
      setProgressTrayStatuses((oldStatuses) => [
        ...oldStatuses,
        {
          id: id as string,
          toId: peerId,
          fileName: currentFile.name,
          toMe: false,
        },
      ]);
      sendFile(
        //TODO: encrypt
        currentFile,
        peerId,
        {
          id: id as string,
          name: currentFile.name,
          size: currentFile.size,
        },
        (percent, peerId) => {
          const progbar = document.getElementById(
            `progbar-${id}-${peerId}`
          ) as HTMLProgressElement;
          if (progbar) {
            progbar.value = percent * 100;
            if (percent === 1) {
              document.getElementById(`progbar-${id}-${peerId}`)?.remove();
            }
          }
        }
      );
    }
  });

  getFile((file, peerId, metadata) => {
    const processedMeta = metadata as FileMetaData;
    console.log(`Received file ${processedMeta.name} from ${peerId}`);
    setProgressTrayStatuses((oldStatuses) =>
      oldStatuses.filter((s) => s.id !== processedMeta.id)
    );

    const fileStream = streamSaver.createWriteStream(processedMeta.name, {
      //TODO: may need to polyfill at some point
      size: processedMeta.size, // (optional filesize)
    });
    const procFile = new Response(file as Uint8Array).body;
    if (procFile) procFile.pipeTo(fileStream).catch(console.error);
  });

  const offerRequestableFiles = (
    toOffer: { [id: string]: File } = realFiles
  ) => {
    const files = Object.entries(toOffer).map(([id, file]) => ({
      id,
      name: file.name,
      size: file.size,
    }));
    sendFileOffer(files); //TODO: encrypt
  };

  getFileOffer((files, peerId) => {
    console.log(`Received file offer from ${peerId}`);
    setRequestableFiles((requestableFiles) => ({
      ...requestableFiles,
      [peerId]: files as FileMetaData[],
    }));
  });

  const removeRealFile = (id: string) => {
    setProgressTrayStatuses(
      (oldStatuses) => oldStatuses.filter((st) => st.id !== id) //remove indicator representation
    );

    Array.from(document.getElementsByClassName(id)).forEach(
      (el) => el.remove() // remove indicator
    );

    setRealFiles((files) => {
      const newFiles = { ...files };
      delete newFiles[id];
      return newFiles;
    });
  };

  const addRealFiles = (initialList: File[]) => {
    setRealFiles((files) => {
      const filesToAdd: { [key: string]: File } = {};
      Array.from(initialList).map(
        (file) => (filesToAdd[shortid.generate()] = file)
      );
      const newFiles = { ...files, ...filesToAdd };
      offerRequestableFiles(newFiles);
      return newFiles;
    });
  };

  return (
    <>
      <div className="card">
        <h2>Transfer</h2>

        <div className="horizontal">
          <div className="card" style={{ width: "50%" }}>
            <h3>Send File</h3>
            <FileUploader
              multiple
              required
              handleChange={addRealFiles}
              name="file"
            >
              <div className="uploadbox">Drag &amp; Drop files here</div>
            </FileUploader>
            <div className="filelistcontainer">
              {realFiles &&
                Object.entries(realFiles).map(([id, file]) => (
                  <div className="filelistbox" key={id}>
                    {file.name} <p>{fancyBytes(file.size)} </p>
                    <button
                      type="button"
                      className="bigbutton"
                      style={{ padding: "0.3em" }}
                      onClick={() => removeRealFile(id)}
                    >
                      ✖
                    </button>
                    <hr />
                  </div>
                ))}
            </div>
          </div>

          <div className="card" style={{ width: "50%" }}>
            <h3>Request File</h3>
            <div className="filelistcontainer">
              {Object.entries(requestableFiles).map(([userId, files]) => (
                <div className="filelistbox" key={userId}>
                  <CollapsibleContainer
                    title={
                      users.find((u) => u.peerId === userId)?.name ||
                      "Anonymous"
                    }
                  >
                    <div className="filelistcontainer">
                      {files.map(({ id, name, size }) => (
                        <div className="filelistbox" key={id}>
                          <div className="horizontal">
                            <div style={{ paddingRight: "1em" }}>
                              <h5>{name}</h5>
                              <p>{fancyBytes(size)}</p>
                            </div>
                            <button onClick={() => requestFile(userId, id)}>
                              Request
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContainer>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ width: "100%" }}>
          <h3>Active Transfers</h3>
          <div className="filelistcontainer">
            {progressTrayStatuses.map((status) => (
              <div key={status.id} className={`filelistbox ${status.id}`}>
                <h5
                  style={{
                    color: "var(--accent-major)",
                    fontWeight: "600",
                  }}
                >
                  {status.toMe
                    ? ` ← ${status.fileName}`
                    : `${status.fileName} →`}
                </h5>
                <progress
                  id={`progbar-${status.id}-${status.toId}`}
                  className="progressbar"
                  value="0"
                  min="0"
                  max="100"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Transfer;
