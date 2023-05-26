import { render } from "preact";
import "./assets/globals.css";
import App from "./App";

render(<App />, document.getElementById("app") as HTMLElement);
