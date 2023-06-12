import VolumeHigh from "mdi-preact/VolumeHighIcon";
import VolumeMute from "mdi-preact/VolumeMuteIcon";

export default function MuteUserButton(props: {
  isMuted: boolean;
  toggleMuted: () => void;
}) {
  const { isMuted, toggleMuted } = props;
  return (
    <div className="collapsible">
      <h4 onClick={toggleMuted}>
        <p style={{ color: "var(--accent-major)" }}>
          {isMuted ? <VolumeMute /> : <VolumeHigh />}
        </p>
      </h4>
    </div>
  );
}
