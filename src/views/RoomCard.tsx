import ChevronLeft from "mdi-preact/ChevronLeftIcon";
import Copy from "mdi-preact/ContentCopyIcon";
import pcdLogo from "/logo.svg";

export function RoomCard(props: { roomId: string; leaveRoom: () => void }) {
  const { roomId, leaveRoom } = props;
  return (
    <div className="horizontal" style={{ borderBottom: "1px solid #eaeaea" }}>
      <button onClick={leaveRoom}>
        <ChevronLeft />
        Leave
      </button>
      <img style={{ height: "4em" }} src={pcdLogo} />
      <div style={{ width: "100%" }}>
        <h1>Paracord</h1>
        <hr />
        <div className="horizontal">
          <h4 style={{ paddingRight: "1em" }}>Room ID</h4>
          <h2>{roomId}</h2>
          <button
            style={{ marginLeft: "auto" }}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            Copy room link <Copy />
          </button>
        </div>
      </div>
    </div>
  );
}
