import { useState } from "preact/hooks";
import { FileUploader } from "react-drag-drop-files";
import streamSaver from "streamsaver";
import { Room } from "trystero/torrent";
import "./assets/App.css";
import CollapsibleContainer from "./helpers/Collapsible";
import { fancyBytes, generateFileID } from "./helpers/helpers";
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

  const [realFiles, setRealFiles] = useState<{ [id: string]: File }>({});
  const [requestableFiles, setRequestableFiles] = useState<{
    [userId: string]: FileMetaData[];
  }>({});

  onFileProgress((percent, peerId, metadata) => {
    const processedMeta = metadata as unknown as {
      filename: string;
      filesize: number;
    };
    console.log(
      //TODO: progressbar
      `${percent * 100}% done receiving ${
        processedMeta.filename
      } from ${peerId}`
    );
  });

  const requestFile = (fromUser: string, id: string) => {
    sendFileRequest(id, fromUser);
  };

  getFileRequest((id, peerId) => {
    console.log(`Received request for ${id} from ${peerId}`);
    if ((id as unknown as string) in realFiles) {
      const currentFile = realFiles[id as unknown as string];
      sendFile(
        currentFile,
        peerId,
        {
          filename: currentFile.name,
          filesize: currentFile.size,
        },
        (percent, peerId) =>
          console.log(
            `${percent * 100}% done sending ${currentFile.name} to ${peerId}`
          )
      );
    }
  });

  getFile((file, peerId, metadata) => {
    const processedMeta = metadata as unknown as {
      filename: string;
      filesize: number;
    };
    console.log(`Received file ${processedMeta.filename} from ${peerId}`);

    const fileStream = streamSaver.createWriteStream(processedMeta.filename, {
      //TODO: may need to polyfill at some point
      size: processedMeta.filesize, // (optional filesize)
    });
    const procFile = new Response(file as unknown as Uint8Array).body;
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
    sendFileOffer(files);
  };

  getFileOffer((files, peerId) => {
    console.log(`Received file offer from ${peerId}`);
    setRequestableFiles((requestableFiles) => ({
      ...requestableFiles,
      [peerId]: files as unknown as FileMetaData[],
    }));
  });

  const removeRealFile = (id: string) => {
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
        (file) => (filesToAdd[generateFileID()] = file)
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
                          <h5>{name}</h5>
                          <p>{fancyBytes(size)}</p>
                          <button onClick={() => requestFile(userId, id)}>
                            Request
                          </button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContainer>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Transfer;
