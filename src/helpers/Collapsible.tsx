import { VNode } from "preact";
import { useState } from "preact/hooks";

export default function CollapsibleContainer(props: {
  title: string;
  children: VNode<any>;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const { children, title } = props;
  return (
    <div className="collapsible">
      <h4 onClick={() => setCollapsed(!collapsed)}>
        <p style={{ color: "var(--accent-major)" }}>
          {collapsed ? "⏵" : "⏷"} {" " + title}
        </p>
      </h4>
      {!collapsed && children}
    </div>
  );
}
