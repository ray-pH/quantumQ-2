import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";
import starter from "../examples/starter-pack/pack.json" with { type: "json" };

test("opens the pack guide in a new browser tab", async ({ page, context }) => {
  const guide =
    "https://github.com/ray-pH/quantumQ-2/blob/main/CUSTOM_PACKS.md";
  await context.route(guide, (route) => route.fulfill({ body: "Pack guide" }));
  await page.goto("/");
  const menuUrl = page.url();
  const popup = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Pack guide" }).click();
  await expect(await popup).toHaveURL(guide);
  await expect(page).toHaveURL(menuUrl);
});

test("fits custom gate labels by their rendered width as the board resizes", async ({
  page,
}) => {
  const flip = starter.gates[0];
  const firstLevel = starter.sections[0].levels[0];
  const pack = {
    ...starter,
    gates: [
      flip,
      { ...flip, id: "wide", name: "Wide label", symbol: "WWWWWWWW" },
      { ...flip, id: "thin", name: "Thin label", symbol: "IIIIIIII" },
    ],
    sections: [
      {
        ...starter.sections[0],
        levels: [
          { ...firstLevel, gates: [...firstLevel.gates, "wide", "thin"] },
        ],
      },
    ],
  };

  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "labels.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(
      zipSync({ "pack.json": strToU8(JSON.stringify(pack)) }),
    ),
  });
  await page.getByRole("button", { name: pack.name, exact: true }).click();
  await page.getByRole("button", { name: "Level 1, Flip a qubit" }).click();

  const palette = page.getByRole("group", { name: "Available gates" });
  const wideGate = palette.getByRole("button", { name: "Wide label" });
  const single = palette.getByText("F", { exact: true });
  const wide = wideGate.getByText("WWWWWWWW", { exact: true });
  const thin = palette.getByText("IIIIIIII", { exact: true });
  await expect
    .poll(async () => (await single.boundingBox())?.height)
    .toBeGreaterThan(35);
  const wideAtDesktop = (await wide.boundingBox())!;
  expect(wideAtDesktop.height).toBeGreaterThan(0);
  expect((await thin.boundingBox())!.height).toBeGreaterThan(
    wideAtDesktop.height,
  );

  await wideGate.click();
  await page.getByRole("button", { name: /^Qubit 1, column 1, Empty/ }).click();
  const boardLabel = page
    .getByRole("button", { name: "Qubit 1, column 1, Wide label" })
    .getByText("WWWWWWWW", { exact: true });

  await page.setViewportSize({ width: 390, height: 740 });
  await expect
    .poll(async () => (await wide.boundingBox())?.width)
    .toBeLessThan(wideAtDesktop.width);
  for (const label of [single, wide, thin, boardLabel]) {
    await expect
      .poll(() =>
        label.evaluate((element) => {
          const text = element.getBoundingClientRect();
          const face = element.parentElement!.getBoundingClientRect();
          return (
            text.width > 0 &&
            text.left > face.left &&
            text.right < face.right &&
            text.top > face.top &&
            text.bottom < face.bottom
          );
        }),
      )
      .toBe(true);
  }
});

test("imports, rearranges, and saves custom level packs with image and text gates", async ({
  page,
}) => {
  await page.goto("/");
  const menu = page.getByRole("region", { name: "Levels", exact: true });
  const packs = menu.getByRole("region", { name: "Custom level packs" });
  expect(await menu.getByRole("heading").allTextContents()).toContain(
    "Sandbox",
  );
  await expect(menu.getByRole("heading").last()).toHaveText(
    "Custom level packs",
  );

  const input = packs.locator('input[type="file"]');
  await input.setInputFiles({
    name: "starter.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(
      zipSync({ "pack.json": strToU8(JSON.stringify(starter)) }),
    ),
  });
  const first = packs.getByRole("region", { name: starter.name });
  const firstToggle = first.getByRole("button", {
    name: starter.name,
    exact: true,
  });
  const firstSection = first.getByRole("heading", { name: "Getting started" });
  const dialog = page.getByRole("dialog");
  const firstInfo = first.getByRole("button", {
    name: `Info about ${starter.name}`,
  });
  await expect(firstToggle).toHaveAttribute("aria-expanded", "false");
  await firstInfo.click();
  await expect(dialog).toHaveAccessibleName(starter.name);
  await expect(
    dialog.getByText(starter["author-id"], { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText(starter.version, { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText("Practice (2)")).toBeVisible();
  const customGates = dialog.getByRole("region", { name: "Custom gates" });
  const flipRow = customGates.getByRole("row", { name: /^Bit flip/ });
  await expect(flipRow.getByText("F", { exact: true })).toBeVisible();
  await expect(flipRow.locator("mtable mtext")).toHaveText([
    "0",
    "1",
    "1",
    "0",
  ]);
  await expect(flipRow.getByRole("cell").last().locator("math")).toHaveText([
    /\|0⟩\s*→\s*\|1⟩/,
    /\|1⟩\s*→\s*\|0⟩/,
  ]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(firstToggle).toHaveAttribute("aria-expanded", "false");
  await expect(firstSection).toBeHidden();
  await firstToggle.press("Enter");
  await expect(firstToggle).toHaveAttribute("aria-expanded", "true");
  await expect(firstSection).toBeVisible();
  await expect(first.getByRole("heading", { name: "Practice" })).toBeVisible();
  await firstToggle.click();
  await expect(firstSection).toBeHidden();

  const manifest = {
    ...starter,
    id: "artwork",
    name: "Artwork pack",
    gates: [
      { ...starter.gates[0], image: "assets/flip.png" },
      {
        id: "mixed",
        name: "Mixed amplitudes",
        symbol: "M",
        matrix: [
          [
            [0.5, 0.5],
            [0.5, -0.5],
          ],
          [
            [-0.5, -0.5],
            [0.5, -0.5],
          ],
        ],
      },
    ],
  };
  const image = readFileSync(
    new URL("../public/assets/sprites/gateNOT.png", import.meta.url),
  );
  const zip = {
    name: "artwork.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(
      zipSync({
        "pack.json": strToU8(JSON.stringify(manifest)),
        "assets/flip.png": image,
      }),
    ),
  };
  await input.setInputFiles(zip);
  const second = packs.getByRole("region", { name: manifest.name });
  const secondToggle = second.getByRole("button", {
    name: manifest.name,
    exact: true,
  });
  await second.getByRole("button", { name: "Move Artwork pack up" }).click();
  const headings = packs.getByRole("heading", { level: 3 });
  await expect(headings).toHaveText(["Artwork pack", starter.name]);
  await expect(secondToggle).toHaveAttribute("aria-expanded", "false");
  await second.getByRole("button", { name: "Move Artwork pack down" }).click();
  await expect(headings).toHaveText([starter.name, "Artwork pack"]);
  await second.getByRole("button", { name: "Move Artwork pack up" }).click();

  await input.setInputFiles(zip);
  await expect(packs.getByRole("alert")).toContainText("your-username/artwork");
  await expect(headings).toHaveCount(2);

  await page.getByRole("button", { name: "Gates", exact: true }).click();
  await expect(dialog).toHaveAccessibleName("Gates");
  await expect(dialog.getByText("Hadamard (H)", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 3 })).toHaveText([
    manifest.name,
    starter.name,
  ]);
  await expect(
    dialog.getByRole("region", { name: manifest.name }).locator("img"),
  ).toHaveAttribute("src", /^data:image\/png;base64,/);
  const mixed = dialog.getByRole("row", { name: /Mixed amplitudes/ });
  await expect(mixed.locator("math > mrow mtext")).toHaveText([
    "(0.5 + 0.5i)",
    "|0⟩",
    "(−0.5 − 0.5i)",
    "|1⟩",
    "(0.5 − 0.5i)",
    "|0⟩",
    "(0.5 − 0.5i)",
    "|1⟩",
  ]);
  await expect(
    dialog
      .getByRole("region", { name: starter.name })
      .getByText("F", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();

  await secondToggle.click();
  const puzzle = second.getByRole("button", { name: "Level 1, Flip a qubit" });
  const sandbox = second.getByRole("button", {
    name: /^Sandbox 2, Try the gates/,
  });
  await expect(sandbox).toBeDisabled();
  await expect(sandbox).toHaveAccessibleName(
    "Sandbox 2, Try the gates, locked",
  );
  await puzzle.click();
  const paletteGate = page.getByRole("button", {
    name: "Bit flip",
    exact: true,
  });
  await expect(paletteGate.locator("img")).toHaveAttribute(
    "src",
    /^data:image\/png;base64,/,
  );
  expect(
    await paletteGate
      .locator("img")
      .evaluate((img) => (img as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await paletteGate.click();
  await page.getByRole("button", { name: /^Qubit 1, column 1, Empty/ }).click();
  await page.getByRole("button", { name: "Evaluate" }).click();
  await expect(dialog).toHaveAccessibleName("Success");
  await dialog.getByRole("button", { name: "Next Level" }).click();
  await page.getByRole("button", { name: "Hadamard (H)", exact: true }).click();
  await page.getByRole("button", { name: /^Qubit 1, column 1, Empty/ }).click();
  await page.getByRole("button", { name: "Evaluate" }).click();
  await expect(dialog).toHaveAccessibleName("Success");
  await dialog.getByRole("button", { name: "Level Menu" }).click();
  await expect(puzzle).toHaveText("1");
  await expect(sandbox).toBeEnabled();

  await page.reload();
  await expect(headings).toHaveText(["Artwork pack", starter.name]);
  await expect(secondToggle).toHaveAttribute("aria-expanded", "false");
  await secondToggle.click();
  await expect(puzzle).toHaveText("1");
  await expect(sandbox).toBeEnabled();
  await firstToggle.click();
  await expect(
    first.getByRole("button", { name: "Level 1, Flip a qubit", exact: true }),
  ).toBeVisible();
  await expect(
    first.getByRole("button", { name: "Sandbox 2, Try the gates, locked" }),
  ).toBeDisabled();

  await puzzle.click();
  await expect(paletteGate.locator("img")).toHaveAttribute(
    "src",
    /^data:image\/png;base64,/,
  );
  await page.getByRole("button", { name: "Return to menu" }).click();
  await dialog.getByRole("button", { name: "OK" }).click();
  await first
    .getByRole("button", { name: "Level 1, Flip a qubit", exact: true })
    .click();
  await expect(paletteGate).toHaveText("F");
  await expect(paletteGate.locator("img")).toHaveCount(0);
});
