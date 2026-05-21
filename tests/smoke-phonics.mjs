// tests/smoke-phonics.mjs
// End-to-end smoke test for the Phase 1a vertical slice.
// Run: node tests/smoke-phonics.mjs [--headed] [--slow]

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const HEADED = process.argv.includes("--headed");
const SLOW = process.argv.includes("--slow") ? 250 : 0;
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const STAMP = Date.now().toString(36);
const TEACHER_EMAIL = `teacher.${STAMP}@test.com`;
const PARENT_EMAIL = `parent.${STAMP}@test.com`;
const PASSWORD = "password123";

const SCREENSHOT_DIR = `/tmp/wp-smoke-${STAMP}`;
mkdirSync(SCREENSHOT_DIR, { recursive: true });

let stepNum = 0;
async function step(name, page, fn) {
  stepNum += 1;
  const tag = String(stepNum).padStart(2, "0");
  console.log(`\n[${tag}] ${name}`);
  try {
    await fn();
    if (page) {
      const path = `${SCREENSHOT_DIR}/step-${tag}-${name.replace(/\W+/g, "_")}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`     📸 ${path}`);
    }
  } catch (err) {
    if (page) {
      const path = `${SCREENSHOT_DIR}/FAIL-${tag}.png`;
      await page.screenshot({ path, fullPage: true }).catch(() => {});
      console.log(`     ❌ FAILED — screenshot: ${path}`);
      console.log(`     URL at failure: ${page.url()}`);
    }
    throw err;
  }
}

// Warm up dev routes so on-demand compilation doesn't race the test
async function warmUp() {
  console.log("Warming up dev routes...");
  const routes = ["/", "/signup", "/login", "/teacher", "/teacher/add-student", "/student/fixture-student-1", "/student/fixture-student-1/practice/phonics"];
  for (const r of routes) {
    try {
      const t0 = Date.now();
      await fetch(`${BASE}${r}`);
      const dt = Date.now() - t0;
      process.stdout.write(`  ${r} ${dt}ms\n`);
    } catch (e) {
      console.log(`  ${r} FAILED: ${e.message}`);
    }
  }
}

await warmUp();

const browser = await chromium.launch({ headless: !HEADED, slowMo: SLOW });
console.log(`\nSmoke test starting against ${BASE}`);
console.log(`Teacher email: ${TEACHER_EMAIL}`);
console.log(`Parent email:  ${PARENT_EMAIL}`);
console.log(`Screenshots:   ${SCREENSHOT_DIR}`);

let inviteLink;
let studentId;

try {
  const teacherCtx = await browser.newContext();
  teacherCtx.setDefaultTimeout(30_000);
  teacherCtx.setDefaultNavigationTimeout(30_000);
  const tp = await teacherCtx.newPage();

  await step("teacher signup", tp, async () => {
    await tp.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
    await tp.getByPlaceholder("Your name").fill("Ilana");
    await tp.getByPlaceholder("Email").fill(TEACHER_EMAIL);
    await tp.getByPlaceholder(/Password.*characters/).fill(PASSWORD);
    await tp.getByRole("button", { name: /Create Teacher Account/ }).click();
    // Wait for teacher dashboard CONTENT, not just URL change
    await tp.getByRole("link", { name: /\+ Add Student/ }).waitFor({ timeout: 30_000 });
  });

  await step("teacher add student", tp, async () => {
    await tp.getByRole("link", { name: /\+ Add Student/ }).click();
    // Wait for the actual form (use heading text, not just URL)
    await tp.getByRole("heading", { name: "Add Student" }).waitFor({ timeout: 30_000 });
    await tp.getByPlaceholder("e.g. Maya").fill("Alex");
    await tp.getByPlaceholder("e.g. 7").fill("7");
    await tp.getByRole("button", { name: /Generate Invite Link/ }).click();
    const inviteInput = tp.locator('input[readonly]');
    await inviteInput.waitFor({ state: "visible", timeout: 15_000 });
    inviteLink = await inviteInput.inputValue();
    if (!inviteLink || !inviteLink.includes("/join/")) {
      throw new Error(`Invite link looks wrong: ${inviteLink}`);
    }
    console.log(`     invite: ${inviteLink}`);
  });

  // ----- Parent context (separate cookies) -----
  const parentCtx = await browser.newContext();
  parentCtx.setDefaultTimeout(30_000);
  parentCtx.setDefaultNavigationTimeout(30_000);

  // Stub Web Speech API — headless Chromium doesn't fire SpeechSynthesisUtterance
  // events, so speakPhoneme/speakWord hang forever, blocking handleTap from
  // advancing nextIndex. The stub fires `onend` on the next tick.
  await parentCtx.addInitScript(() => {
    const fakeSpeak = (utt) => setTimeout(() => utt.onend?.({}), 1);
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

  const pp = await parentCtx.newPage();

  // Capture console errors and page errors so failures aren't silent
  pp.on("console", (msg) => {
    if (msg.type() === "error") console.log(`  [parent.console.error] ${msg.text()}`);
  });
  pp.on("pageerror", (err) => console.log(`  [parent.pageerror] ${err.message}`));
  pp.on("requestfailed", (req) => console.log(`  [parent.reqfail] ${req.url()} - ${req.failure()?.errorText}`));

  await step("parent open invite", pp, async () => {
    await pp.goto(inviteLink, { waitUntil: "networkidle" });
    await pp.getByPlaceholder("Your name (parent)").waitFor({ timeout: 30_000 });
  });

  await step("parent signup + child", pp, async () => {
    await pp.getByPlaceholder("Your name (parent)").fill("Test Parent");
    await pp.getByPlaceholder("Your email").fill(PARENT_EMAIL);
    await pp.getByPlaceholder(/Create password/).fill(PASSWORD);
    // Child name + age may be prefilled from invite token
    await pp.getByRole("button", { name: /Join.*Pick a Pet/ }).click();
    // Wait for pet-select page heading
    await pp.getByRole("heading", { name: /Pick Your Pet/ }).waitFor({ timeout: 30_000 });
    const url = new URL(pp.url());
    studentId = url.searchParams.get("student");
    if (!studentId) throw new Error(`No student id in URL: ${pp.url()}`);
    console.log(`     studentId: ${studentId}`);
  });

  await step("pick pet", pp, async () => {
    // Pet buttons render as <button><span>🐱</span><span>Cat</span></button>
    // so accessible name is emoji+label concatenated. Substring match on the label.
    await pp.locator("button").filter({ hasText: "Cat" }).first().click();
    await pp.getByPlaceholder("Name your pet!").fill("Whiskers");
    await pp.getByRole("button", { name: /Let's Go with Whiskers/ }).click();
    // Wait for either /join/success page or student home
    await pp.waitForURL(/\/join\/success|\/student\//, { timeout: 30_000 });
    await pp.waitForLoadState("networkidle");
  });

  await step("navigate to student home", pp, async () => {
    await pp.goto(`${BASE}/student/${studentId}`, { waitUntil: "networkidle" });
    await pp.getByText("Today's practice", { exact: false }).waitFor({ timeout: 30_000 });
  });

  await step("open phonics activity", pp, async () => {
    // The Phonics card is wrapped in a Link
    await pp.getByRole("link", { name: /Phonics/ }).click();
    await pp.getByRole("button", { name: /Just tap, no voice/ }).waitFor({ timeout: 30_000 });
    await pp.getByRole("button", { name: /Just tap, no voice/ }).click();
    // Wait for the first phoneme card (a button with a single-letter visible label)
    await pp.locator('button').filter({ hasText: /^[a-z]$/i }).first().waitFor({ timeout: 15_000 });
  });

  await step("tap through all words", pp, async () => {
    const MAX_WORDS = 8;
    for (let w = 0; w < MAX_WORDS; w++) {
      // Wait for either:
      //   (a) "Tap each sound!" text — confirms BlendingExercise is mounted in
      //       fresh tap-mode (cards are tappable, nextIndex=0)
      //   (b) "Great work!" — completion screen
      // The "Tap each sound!" wait is critical: between words, React unmounts
      // the old BlendingExercise and mounts a new one. Without waiting for the
      // fresh mount, we'd grab stale cards from the previous word's "blended"
      // state which are still in the DOM mid-transition.
      try {
        await Promise.race([
          pp.getByText("Tap each sound!").waitFor({ state: "visible", timeout: 8_000 }),
          pp.getByText("Great work!").waitFor({ state: "visible", timeout: 8_000 }),
        ]);
      } catch {
        // fall through to the count checks
      }
      if ((await pp.getByText("Great work!").count()) > 0) break;
      if ((await pp.getByText("Tap each sound!").count()) === 0) {
        throw new Error(`Word ${w + 1}: "Tap each sound!" never appeared`);
      }

      const cards = await pp
        .locator("button")
        .filter({ hasText: /^[a-z]$/i })
        .all();

      // BlendingExercise.handleTap only accepts the next index in sequence;
      // out-of-order clicks no-op silently.
      for (let i = 0; i < cards.length; i++) {
        try {
          await cards[i].click({ timeout: 2_000, force: true });
        } catch (e) {
          throw new Error(`Word ${w + 1}: failed to click card ${i}: ${e.message}`);
        }
        await pp.waitForTimeout(400);
      }

      try {
        await pp
          .locator('button:has-text("I can say it!")')
          .waitFor({ state: "visible", timeout: 5_000 });
        await pp.locator('button:has-text("I can say it!")').click();
      } catch {
        if ((await pp.getByText("Great work!").count()) > 0) break;
        throw new Error(`Word ${w + 1}: reveal button never appeared`);
      }
    }
  });

  await step("verify completion screen", pp, async () => {
    await pp.getByText("Great work!").waitFor({ timeout: 15_000 });
    const coinText = await pp.getByText(/\+\d+/).first().textContent();
    console.log(`     coin badge: ${coinText}`);
  });

  await step("back to student home", pp, async () => {
    await pp.getByRole("link", { name: /Back to Whiskers/ }).click();
    await pp.getByText("Today's practice", { exact: false }).waitFor({ timeout: 10_000 });
  });

  await step("open spelling activity", pp, async () => {
    await pp.getByRole("link", { name: /Spelling/ }).click();
    // The spelling page has no mic prompt — first letter slot should appear directly
    await pp.locator('button[aria-label*="Empty slot 1"]').waitFor({ timeout: 15_000 });
  });

  await step("spell all words correctly", pp, async () => {
    const MAX_WORDS = 8;
    for (let w = 0; w < MAX_WORDS; w++) {
      try {
        await Promise.race([
          pp.getByText("Great spelling!").waitFor({ state: "visible", timeout: 8_000 }),
          pp.locator('button[aria-label*="Empty slot 1"]').waitFor({ state: "visible", timeout: 8_000 }),
        ]);
      } catch { /* fall through */ }
      if ((await pp.getByText("Great spelling!").count()) > 0) break;

      // Read the word counter to know which word we're on
      const counterText = await pp.locator("p").filter({ hasText: /Word \d+ of \d+/ }).first().textContent();
      const wordNumMatch = counterText?.match(/Word (\d+)/);
      const wordNum = wordNumMatch ? parseInt(wordNumMatch[1], 10) : w + 1;

      // The fixture content is the same as phonics: cat, sat, mat, hat, bat
      const expectedWord = ["cat", "sat", "mat", "hat", "bat"][wordNum - 1];
      if (!expectedWord) {
        if ((await pp.getByText("Great spelling!").count()) > 0) break;
        throw new Error(`Word ${wordNum}: unknown word`);
      }

      // Tap each letter of the expected word in order from the tray.
      // Slot buttons have aria-label "Slot N: x" so their accessible name
      // differs from "x"; tray buttons have just text content so their
      // accessible name IS the letter. exact:true name match isolates the tray.
      for (const ch of expectedWord) {
        const trayButton = pp.getByRole("button", { name: ch, exact: true }).first();
        await trayButton.click({ timeout: 3_000, force: true });
        await pp.waitForTimeout(200);
      }
      // After all letters tapped, auto-check fires. Wait for "Yes!" then transition.
      try {
        await pp.getByText("Yes!").waitFor({ state: "visible", timeout: 5_000 });
      } catch {
        if ((await pp.getByText("Great spelling!").count()) > 0) break;
        throw new Error(`Word ${wordNum} (${expectedWord}): "Yes!" never appeared`);
      }
      await pp.waitForTimeout(1_300); // wait for the transition delay
    }
  });

  await step("verify spelling completion", pp, async () => {
    await pp.getByText("Great spelling!").waitFor({ timeout: 15_000 });
    const coinText = await pp.getByText(/\+\d+/).first().textContent();
    console.log(`     coin badge: ${coinText}`);
  });

  writeFileSync(`${SCREENSHOT_DIR}/state.json`, JSON.stringify({
    teacherEmail: TEACHER_EMAIL,
    parentEmail: PARENT_EMAIL,
    studentId,
    inviteLink,
    timestamp: new Date().toISOString(),
  }, null, 2));

  console.log(`\n✅ ALL STEPS PASSED`);
  console.log(`   studentId for DB verification: ${studentId}`);
  console.log(`   screenshots: ${SCREENSHOT_DIR}`);
  process.exit(0);
} catch (err) {
  console.error(`\n❌ FAILED:`, err.message);
  console.error(`   screenshots: ${SCREENSHOT_DIR}`);
  process.exit(1);
} finally {
  await browser.close();
}
