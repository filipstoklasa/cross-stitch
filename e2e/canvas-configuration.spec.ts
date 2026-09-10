import { expect, test } from "@playwright/test";

test("Canvas configuration elements should exist", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await expect(page.getByTestId("menu-button")).toBeVisible();
  await page.getByTestId("menu-button").click();

  await expect(page.getByText("Canvas configuration")).toBeVisible();

  // dimension selects, with their option values
  for (const id of ["scene-width-input", "scene-height-input"]) {
    const select = page.getByTestId(id);
    await expect(select).toBeVisible();
    await expect(select.locator("option")).toHaveText(["25", "50", "75"]);
  }
  await expect(page.getByTestId("square-size-input").locator("option")).toHaveText(
    ["10", "20", "50"],
  );

  await expect(page.getByText("Marker", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Marker color" })).toBeVisible();

  await expect(page.getByText("Input", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "File config" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Background pattern" }),
  ).toBeVisible();

  await expect(page.getByText("Output", { exact: true })).toBeVisible();
  for (const name of [
    "Save to browser",
    "Save as file",
    "Print grid",
    "Print canvas",
  ]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }

  await expect(page.getByText("Auto save mode")).toBeVisible();
  await expect(
    page.getByText(`© ${new Date().getFullYear()} Filip Stoklasa`),
  ).toBeVisible();
  await expect(page.getByText("version:")).toBeVisible();
});
