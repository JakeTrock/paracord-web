import "./assets/App.css";
import {
  ActionProgress,
  ActionReceiver,
  ActionSender,
  Room,
  joinRoom,
} from "trystero/torrent";
import { User } from "./User";
import { useState } from "preact/hooks";

type FileMetaData = { id: string; owner?: string; name: string; size: number };

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

  const [realFiles, setRealFiles] = useState<{ [id: string]: File }>({});
  const [requestableFiles, setRequestableFiles] = useState<{
    [userId: string]: FileMetaData[];
  }>({});

  onFileProgress((percent, peerId, metadata) =>
    console.log(
      //TODO: progressbar
      `${percent * 100}% done receiving ${metadata.filename} from ${peerId}`
    )
  );

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
    console.log(`Received file ${metadata.filename} from ${peerId}`);

    //TODO: file saving mechanism
    console.log(file);
  });

  const offerRequestableFiles = () => {
    const files = Object.entries(realFiles).map(([id, file]) => ({
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

  const addRealFile = (file: File) => {
    const id = Math.random().toString(36).substring(2, 15);
    setRealFiles((files) => ({ ...files, [id]: file }));
  };

  const removeRealFile = (id: string) => {
    setRealFiles((files) => {
      const newFiles = { ...files };
      delete newFiles[id];
      return newFiles;
    });
  };

  return (
    <>
      <div className="card">
        <h2>Transfer</h2>
        <div className="card">
          <h3>Send File</h3>
          <input
            type="file"
            onChange={(e) => {
              if (e.currentTarget.files === null) return;
              addRealFile(e.currentTarget.files[0]);
            }}
          />
          <ul>
            {Object.entries(realFiles).map(([id, file]) => (
              <li key={id}>
                <h5>{file.name}</h5>
                <p>{file.size}</p>
                <button onClick={() => removeRealFile(id)}>Remove</button>
              </li>
            ))}
          </ul>
          <button onClick={offerRequestableFiles}>Offer</button>

          <h3>Request File</h3>
          <ul>
            {Object.entries(requestableFiles).map(([userId, files]) => (
              <li key={userId}>
                <h5>{users.find((u) => u.peerId === userId)?.name}</h5>
                <ul>
                  {files.map(({ id, name, size }) => (
                    <li key={id}>
                      <h5>{name}</h5>
                      <p>{size}</p>
                      <button onClick={() => requestFile(userId, id)}>
                        Request
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default Transfer;
