import { test } from "@playwright/test";

test("test", async ({ page }) => {
  //TODO: highly brittle(on purpose) replaceme
  await page.goto("http://localhost:5173/");
  await page.getByRole("button", { name: "Random" }).click();
  await page.getByPlaceholder("Password").click();
  await page.getByPlaceholder("Password").fill("khanate453");
  await page.getByRole("button", { name: "Show" }).click();
  await page.getByRole("button", { name: "Hide" }).click();
  await page.getByRole("button", { name: "Join" }).click();
  await page.getByRole("tab", { name: "Downloads" }).click();
  await page.getByText("⏷ Send File").click();
  await page.getByText("⏵ Send Request").click();
  await page.getByText("⏷ Send Request").click();
  await page.getByText("⏵ Active Transfers").click();
  await page.getByText("⏷ Active Transfers").click();
  await page.getByRole("tab", { name: "Chat" }).click();
  await page.getByRole("button", { name: "Copy room link" }).click();
  await page
    .locator("div")
    .filter({ hasText: /^YouqKdbzL8XUn7KJoWltUCSPeersWaiting\.\.\.$/ })
    .getByRole("textbox")
    .click();
  await page
    .locator("div")
    .filter({ hasText: /^YouqKdbzL8XUn7KJoWltUCSPeersWaiting\.\.\.$/ })
    .getByRole("textbox")
    .fill("greg");
  await page.getByText("send ➔YouqKdbzL8XUn7KJoWltUCSPeersWaiting...").click();
  const page1 = await page.context().newPage();
  await page1.getByPlaceholder("Type your message").click();
  await page1.getByPlaceholder("Type your message").fill("hello");
  await page1.getByRole("button", { name: "send ➔" }).click();
  await page.getByRole("tabpanel", { name: "Chat" }).getByRole("img").click();
  await page.getByPlaceholder("Type your message").click();
  await page
    .getByPlaceholder("Type your message")
    .fill(">>b2LBvR-B3 what's going on");
  await page.getByPlaceholder("Type your message").press("Enter");
  await page1.getByText("greg is typing...").click();
  await page1.getByPlaceholder("Type your message").click();
  await page1
    .locator("div")
    .filter({
      hasText: /^YouyLhKliIkvh4uEsvPK93nPeersgregqKdbzL8XUn7KJoWltUCS$/,
    })
    .getByRole("textbox")
    .dblclick();
  await page1
    .locator("div")
    .filter({
      hasText: /^YouyLhKliIkvh4uEsvPK93nPeersgregqKdbzL8XUn7KJoWltUCS$/,
    })
    .getByRole("textbox")
    .press("Meta+a");
  await page1
    .locator("div")
    .filter({
      hasText: /^YouyLhKliIkvh4uEsvPK93nPeersgregqKdbzL8XUn7KJoWltUCS$/,
    })
    .getByRole("textbox")
    .fill("anton");
  await page1.getByPlaceholder("Type your message").click();
  await page1.getByRole("heading", { name: "anton" }).click();
  await page1.getByPlaceholder("Type your message").click();
  await page1.getByPlaceholder("Type your message").fill("nothing much");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("j");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("u");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("s");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("t");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("p");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("a");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("s");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("s");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("i");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("n");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("g");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("t");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("i");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("m");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByPlaceholder("Type your message").fill("e");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page.getByText("anton is typing...").click();
  await page.locator('[id="\\39 cbmrhRht"] path').click();
  await page.getByPlaceholder("Type your message").click();
  await page
    .getByPlaceholder("Type your message")
    .fill(">>9cbmrhRht stop spamming");
  await page.getByPlaceholder("Type your message").press("Enter");
  await page.getByText(">>9cbmrhRht").click();
  await page1.getByText(">>9cbmrhRht").click();
  await page.getByRole("button", { name: "Copy room link" }).click();
  await page.getByPlaceholder("Type your message").click();
  await page
    .getByPlaceholder("Type your message")
    .fill("http://localhost:5173/#dVz26MMyr?khanate453");
  await page.getByPlaceholder("Type your message").press("Enter");
  await page.getByPlaceholder("Type your message").fill("https://crouton.net");
  await page.getByRole("button", { name: "send ➔" }).click();
  await page.getByRole("link", { name: "https://crouton.net" }).click();
  await page
    .locator("div")
    .filter({ hasText: /^YouZ8oCjgrsuQxMmC1R2LSXPeersWaiting\.\.\.$/ })
    .getByRole("textbox")
    .dblclick();
  await page
    .locator("div")
    .filter({ hasText: /^YouZ8oCjgrsuQxMmC1R2LSXPeersWaiting\.\.\.$/ })
    .getByRole("textbox")
    .fill("reed");
  await page.getByRole("tab", { name: "Downloads" }).click();
  await page.getByText("⏷ Send File").click();
  await page.getByText("⏵ Send Request").click();
  await page
    .getByRole("tabpanel", { name: "Downloads" })
    .locator("div")
    .filter({ hasText: "⏷ Send Request" })
    .locator("div")
    .click();
  await page.getByText("⏷ Send Request").click();
  await page.getByText("⏵ Active Transfers").click();
  await page
    .getByRole("tabpanel", { name: "Downloads" })
    .locator("div")
    .filter({ hasText: "⏷ Active Transfers" })
    .locator("div")
    .click();
  await page.getByText("⏷ Active Transfers").click();
  await page1.getByRole("tab", { name: "Downloads" }).click();
  await page1.getByText("Drag & Drop files here").click();
  await page1
    .getByRole("tabpanel", { name: "Downloads" })
    .setInputFiles("index.html");
  await page
    .getByRole("tabpanel", { name: "Downloads" })
    .locator("div")
    .filter({ hasText: "⏵ Active Transfers" })
    .click();
  await page.getByText("⏵ Send Request").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Request" }).click();
  const download = await downloadPromise;
  await page.getByText("⏷ Send Request").click();
  await page1.getByRole("button", { name: "✖" }).click();
  await page1.getByText("⏷ Send File").click();
  await page1.getByRole("tab", { name: "Chat" }).click();
  await page1.getByPlaceholder("Type your message").click();
  await page1.getByPlaceholder("Type your message").fill("I'm muting you");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page1.getByRole("heading", { name: "reed" }).locator("path").click();
  await page.getByRole("tab", { name: "Chat" }).click();
  await page.getByPlaceholder("Type your message").click();
  await page.getByPlaceholder("Type your message").fill("that's rude");
  await page.getByPlaceholder("Type your message").press("Enter");
  await page.getByRole("tab", { name: "Downloads" }).click();
  await page.getByText("Drag & Drop files here").click();
  await page
    .getByRole("tabpanel", { name: "Downloads" })
    .setInputFiles("index.html");
  await page1.getByRole("tab", { name: "Downloads" }).click();
  await page1
    .getByRole("tabpanel", { name: "Downloads" })
    .locator("div")
    .nth(2)
    .click();
  await page1.getByRole("tab", { name: "Chat" }).click();
  await page1.getByRole("heading", { name: "reed" }).locator("path").click();
  await page1.getByPlaceholder("Type your message").click();
  await page1.getByRole("heading", { name: "reed" }).getByRole("img").click();
  await page1.getByPlaceholder("Type your message").click();
  await page1.getByPlaceholder("Type your message").fill("unmuted");
  await page1.getByPlaceholder("Type your message").press("Enter");
  await page.getByRole("tab", { name: "Chat" }).click();
  await page.getByPlaceholder("Type your message").click();
  await page.getByPlaceholder("Type your message").fill("thanks");
  await page.getByPlaceholder("Type your message").press("Enter");
});
