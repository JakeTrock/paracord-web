import { FileUploader } from "react-drag-drop-files";
import DownloadManager from "../TrysteroManagers/downloadManager";
import CollapsibleContainer from "../helpers/Collapsible";
import { fancyBytes } from "../helpers/helpers";
import { useProgressStore } from "../stateManagers/downloadManagers/progressManager";
import { useRealFiles } from "../stateManagers/downloadManagers/realFileManager";
import { useOfferStore } from "../stateManagers/downloadManagers/requestManager";
import { useUserStore } from "../stateManagers/userManagers/userStore";

export function DownloadView(props: {
  downloadManagerInstance: DownloadManager;
}) {
  const { downloadManagerInstance } = props;
  const realFiles = useRealFiles((state) => state.realFiles);
  const requestableDownloads = useOfferStore(
    (state) => state.requestableDownloads
  );
  const progressQueue = useProgressStore((state) => state.progressQueue);
  const uiInteractive = useUserStore(
    (state) => state.users.filter((p) => p.active).length > 0
  );

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
              accept="*"
              disabled={!uiInteractive}
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
                Object.entries(requestableDownloads).map(([id, fileOffers]) => {
                  const userName =
                    useUserStore((state) =>
                      state.users.find((u) => u.id === id)
                    )?.name || "Anonymous";

                  return fileOffers.map(({ id, name, size, ownerId }) => (
                    <div
                      className="filelistbox"
                      style={{
                        border: "1px solid var(--accent-major)",
                        borderRadius: "0.5em",
                      }}
                      key={id}
                    >
                      <div className="horizontal">
                        <h2>{name}</h2>
                        <div
                          style={{
                            paddingLeft: "1em",
                            paddingRight: "1em",
                          }}
                        >
                          <h5>sent by {userName}</h5>
                          <p>{fancyBytes(size)}</p>
                        </div>
                        <button
                          onClick={() =>
                            downloadManagerInstance.requestFile(ownerId, id)
                          }
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  ));
                })}
            </div>
          </CollapsibleContainer>
          <CollapsibleContainer
            className="filelistbox"
            title="Active Transfers"
          >
            <div className="filelistcontainer">
              {/* TODO: add a "stop" button */}
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
