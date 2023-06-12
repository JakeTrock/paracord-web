import { FileUploader } from "react-drag-drop-files";
import CollapsibleContainer from "../helpers/Collapsible";
import DownloadManager from "../helpers/TrysteroManagers/downloadManager";
import { fancyBytes } from "../helpers/helpers";
import { useProgressStore } from "../helpers/stateManagers/downloadManagers/progressManager";
import { useRealFiles } from "../helpers/stateManagers/downloadManagers/realFileManager";
import { useOfferStore } from "../helpers/stateManagers/downloadManagers/requestManager";
import { useUserStore } from "../helpers/stateManagers/userManagers/userStore";

export function DownloadView(props: {
  downloadManagerInstance: DownloadManager;
}) {
  const { downloadManagerInstance } = props;
  const realFiles = useRealFiles((state) => state.realFiles);
  const requestableDownloads = useOfferStore(
    (state) => state.requestableDownloads
  );
  const progressQueue = useProgressStore((state) => state.progressQueue);

  return (
    <>
      {downloadManagerInstance && (
        <>
          <CollapsibleContainer
            open={true}
            className="filelistbox"
            title="Send File"
          >
            <FileUploader
              multiple
              required
              handleChange={downloadManagerInstance.addRealFiles}
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
                      onClick={() => downloadManagerInstance.removeRealFile(id)}
                    >
                      ✖
                    </button>
                    <hr />
                  </div>
                ))}
            </div>
          </CollapsibleContainer>
          <CollapsibleContainer className="filelistbox" title="Send Request">
            <div className="filelistcontainer">
              {requestableDownloads &&
                Object.entries(requestableDownloads).map(([id, fileOffers]) => (
                  <div className="filelistbox" key={id}>
                    <CollapsibleContainer
                      title={
                        useUserStore((state) =>
                          state.users.find((u) => u.id === id)
                        )?.name || "Anonymous"
                      }
                    >
                      <div className="filelistcontainer">
                        {fileOffers.map(({ id, name, size, ownerId }) => (
                          <div className="filelistbox" key={id}>
                            <div className="horizontal">
                              <div style={{ paddingRight: "1em" }}>
                                <h5>{name}</h5>
                                <p>{fancyBytes(size)}</p>
                              </div>
                              <button
                                onClick={() =>
                                  downloadManagerInstance.requestFile(
                                    ownerId,
                                    id
                                  )
                                }
                              >
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
          </CollapsibleContainer>
          <CollapsibleContainer
            className="filelistbox"
            title="Active Transfers"
          >
            <div className="filelistcontainer">
              {progressQueue.map((status) => (
                <div key={status.id} className={`filelistbox ${status.id}`}>
                  <h5
                    style={{
                      color: "var(--accent-major)",
                      fontWeight: "600",
                    }}
                  >
                    {status.toMe ? ` ← ${status.name}` : `${status.name} →`}
                  </h5>
                  <progress
                    className="progressbar"
                    value={status.progress * 100}
                    min="0"
                    max="100"
                  />
                </div>
              ))}
            </div>
          </CollapsibleContainer>
        </>
      )}
    </>
  );
}
