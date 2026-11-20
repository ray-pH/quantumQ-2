import { expect, test } from "@playwright/test";

test("fits the main menu in a short landscape viewport", async ({ page }) => {
  await page.setViewportSize({ width: 873, height: 393 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "About" })).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight),
  ).toBeLessThanOrEqual(393);
});

test("uses the saved gate symbol in both Pauli-X and CNOT help", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "quantumq.save",
      JSON.stringify({ version: 1, unlocked: [1, 4], useNotSymbol: false }),
    );
  });
  await page.goto("/");
  const dialog = page.getByRole("dialog");
  const close = dialog.getByRole("button", { name: "Close" });
  const cnotTargets = dialog.getByAltText("Controlled-NOT target");

  await page.getByRole("button", { name: "Level 4", exact: true }).click();
  await expect(cnotTargets).toHaveCount(2);
  await expect(cnotTargets.first()).toHaveAttribute("src", /gateCXbot\.png$/);
  await close.click();
  await page.getByRole("button", { name: "Return to menu" }).click();
  await dialog.getByRole("button", { name: "OK" }).click();

  await page.getByRole("button", { name: "Options" }).click();
  await dialog.getByRole("checkbox", { name: "Use ⊕ Symbol" }).check();
  await close.click();
  await page.getByRole("button", { name: "Level 4", exact: true }).click();
  await expect(cnotTargets).toHaveCount(2);
  for (const target of await cnotTargets.all()) {
    await expect(target).toHaveAttribute("src", /gateNOT\.png$/);
  }
  await close.click();
  await page.getByRole("button", { name: "Return to menu" }).click();
  await dialog.getByRole("button", { name: "OK" }).click();

  await page.getByRole("button", { name: "Level 1", exact: true }).click();
  const pauliX = dialog.getByAltText("Pauli-X gate");
  await expect(pauliX).toHaveCount(3);
  for (const symbol of await pauliX.all()) {
    await expect(symbol).toHaveAttribute("src", /gateNOT\.png$/);
  }
});

test("renders both Hadamard mappings as MathML fractions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Gates", exact: true }).click();
  const hadamard = page.getByRole("row", { name: /Hadamard/ });
  await expect(hadamard.locator("math mfrac")).toHaveCount(2);
  await expect(hadamard.locator("mfrac msqrt")).toHaveText(["2", "2"]);
  await expect(hadamard.locator("mfrac mrow mo")).toHaveText(["+", "−"]);
});

test("plays the introduction through the first controlled gate and restores progress", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog");
  const evaluate = page.getByRole("button", { name: "Evaluate" });
  const next = dialog.getByRole("button", { name: "Next Level" });

  async function closeHelp() {
    await expect(dialog).toHaveAccessibleName("Help");
    await dialog.getByRole("button", { name: "Close" }).click();
  }

  async function place(row: number, column: number, name = "Empty") {
    await page
      .getByRole("button", {
        name: new RegExp(`^Qubit ${row}, column ${column}, ${name}`),
      })
      .click();
  }

  await expect(page.getByRole("heading", { name: "QuantumQ" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Level 1, locked", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Level 0", exact: true }).click();
  await closeHelp();
  await evaluate.click();
  await expect(dialog).toHaveAccessibleName("Success");
  await next.click();

  await closeHelp();
  await evaluate.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("table")).toContainText("|1⟩");
  await page
    .getByRole("button", { name: "Pauli-X (NOT)", exact: true })
    .click();
  await place(1, 1);
  await evaluate.click();
  await next.click();

  await closeHelp();
  await page
    .getByRole("button", { name: "Pauli-X (NOT)", exact: true })
    .click();
  await place(1, 1);
  await place(2, 1);
  await evaluate.click();
  await next.click();

  await page
    .getByRole("button", { name: "Pauli-X (NOT)", exact: true })
    .click();
  await place(1, 1);
  await place(3, 1);
  await evaluate.click();
  await next.click();

  await closeHelp();
  await expect(
    page.getByRole("button", {
      name: "Qubit 2, column 4, Pauli-X (NOT), locked",
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Control", exact: true }).click();
  await place(1, 4);
  await expect(page.locator(".control-line")).toHaveCount(1);
  await evaluate.click();
  await expect(dialog).toHaveAccessibleName("Success");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Show all" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(4);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveAccessibleName("Return to Menu?");
  await dialog.getByRole("button", { name: "OK" }).click();
  await page.getByRole("button", { name: "Options" }).click();
  await dialog.getByRole("checkbox", { name: "Use ⊕ Symbol" }).check();
  await dialog.getByRole("button", { name: "Close" }).click();

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Level 5", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Options" }).click();
  await expect(dialog.getByRole("checkbox")).toBeChecked();
});

test("keeps the input label visible while scrolling a sandbox on a narrow touch screen", async ({
  browser,
}) => {
  const touch = await browser.newContext({
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await touch.newPage();
  await page.goto("http://127.0.0.1:1420/");
  await page.getByRole("button", { name: "Sandbox 104" }).tap();
  const circuit = page.getByRole("region", { name: "Quantum circuit" });
  const label = page.getByAltText("Input | 0 ⟩").first();
  const before = await label.boundingBox();
  await circuit.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  const after = await label.boundingBox();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(6);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);

  await page.getByRole("button", { name: "Hadamard (H)", exact: true }).tap();
  await page
    .getByRole("button", {
      name: "Qubit 1, column 12, Empty (erase)",
      exact: true,
    })
    .tap();
  await page.getByRole("button", { name: "Evaluate" }).tap();
  await expect(page.getByRole("table")).toContainText("50.00%");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.evaluate(() =>
    window.dispatchEvent(new Event("quantumqback", { cancelable: true })),
  );
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    "Return to Menu?",
  );
  await page.evaluate(() =>
    window.dispatchEvent(new Event("quantumqback", { cancelable: true })),
  );
  await expect(page.getByRole("heading", { name: "QuantumQ" })).toBeVisible();
  await touch.close();
});
