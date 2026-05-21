import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectVisible(page, label, locator) {
  await locator.waitFor({ state: "visible", timeout: 15_000 });
  console.log(`  ✓ ${label}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

await context.addInitScript(() => {
  const fakeSpeak = (utterance) => setTimeout(() => utterance.onend?.({}), 1);
  const stub = {
    speak: fakeSpeak,
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
    pending: false,
    speaking: false,
    paused: false,
    onvoiceschanged: null,
  };
  Object.defineProperty(window, "speechSynthesis", { value: stub, writable: false });
});

const page = await context.newPage();
page.setDefaultTimeout(15_000);
const consoleWarnings = [];
const consoleErrors = [];
const failedRequests = [];
page.on("console", (message) => {
  if (message.type() === "warning") consoleWarnings.push(message.text());
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", (request) => {
  failedRequests.push(request.url());
});

async function cookWord(page, word) {
  for (const letter of word) {
    await page.getByRole("button", { name: letter, exact: true }).first().click();
  }
}

try {
  console.log(`Donut Kitchen smoke test against ${BASE}`);

  await page.goto(`${BASE}/student/fixture-student-1`, { waitUntil: "networkidle" });
  await expectVisible(page, "home shows Donut Kitchen", page.getByText("Donut Kitchen"));
  await page.getByText("Donut Kitchen").first().click();

  await expectVisible(page, "spelling route title is Donut Kitchen", page.getByText("Donut Kitchen"));
  await expectVisible(page, "first donut counter appears", page.getByText(/Donut 1 of/));
  await expectVisible(page, "hear again button appears", page.getByRole("button", { name: "Hear it again" }));
  await expectVisible(
    page,
    "first empty cooking slot appears",
    page.getByRole("button", { name: /Empty letter slot 1/ }),
  );
  await expectVisible(page, "initial kitchen instruction appears", page.getByText("Listen, then decorate the donut word."));

  const ingredientButtons = await page.getByRole("button", { name: /^[a-z]$/ }).count();
  assert(ingredientButtons >= 3, `Expected at least 3 letter ingredient buttons, found ${ingredientButtons}`);
  console.log(`  ✓ ${ingredientButtons} letter ingredient buttons`);

  await cookWord(page, "cat");
  await expectVisible(page, "correct word decorates donut", page.getByText(/Perfect!|Good fix!/));
  await expectVisible(page, "coin reward appears", page.getByText(/\+2 coins|\+1 coins/));

  const remainingWords = ["sat", "mat", "hat", "bat"];
  for (let i = 0; i < remainingWords.length; i++) {
    const word = remainingWords[i];
    const donutNumber = i + 2;
    await expectVisible(page, `donut ${donutNumber} appears`, page.getByText(`Donut ${donutNumber} of 5`));
    await cookWord(page, word);
    await expectVisible(page, `${word} cooks`, page.getByText(/Perfect!|Good fix!/));
  }
  await expectVisible(page, "completion screen shows full pet", page.getByText("Whiskers is full!"));

  assert(
    !consoleWarnings.some((warning) => warning.includes("[student-data] REST")),
    `Fixture demo should not query Supabase content. Warnings: ${consoleWarnings.join(" | ")}`,
  );
  assert(
    !consoleErrors.some((error) => error.includes("SupabaseTracker")),
    `Fixture demo should not use Supabase tracker. Errors: ${consoleErrors.join(" | ")}`,
  );
  assert(
    !failedRequests.some((url) => url.includes("supabase.co/rest/v1")),
    `Fixture demo should not request Supabase REST. Failed requests: ${failedRequests.join(" | ")}`,
  );

  console.log("Donut Kitchen smoke test passed");
  process.exit(0);
} catch (err) {
  console.error("Donut Kitchen smoke test failed:", err.message);
  console.error("URL at failure:", page.url());
  process.exit(1);
} finally {
  await browser.close();
}
