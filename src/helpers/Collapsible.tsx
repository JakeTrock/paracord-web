import { VNode } from "preact";
import { useState } from "preact/hooks";

export default function CollapsibleContainer(
  props: any & {
    //TODO: replaceme https://www.radix-ui.com/docs/primitives/components/collapsible#collapsible
    title: string;
    children: VNode<any>;
    open?: boolean;
  }
) {
  const { children, title, open = false, ...extprops } = props;
  const [collapsed, setCollapsed] = useState(!open);
  return (
    <div className="collapsible" {...extprops}>
      <h4 onClick={() => setCollapsed(!collapsed)}>
        <p style={{ color: "var(--accent-major)" }}>
          {collapsed ? "⏵" : "⏷"} {" " + title}
        </p>
      </h4>
      {!collapsed && children}
    </div>
  );
}
