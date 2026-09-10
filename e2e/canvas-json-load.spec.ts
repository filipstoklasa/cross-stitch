import { expect, test } from "@playwright/test";
import path from "path";

test("Loads configuration from json and applies it to the canvas", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/");
  await page.getByTestId("menu-button").click();

  const fileInput = page.locator("[data-testid='file-config']");
  await expect(fileInput).toHaveAttribute("hidden");
  await fileInput.setInputFiles([path.join(__dirname, "assets/config.json")]);

  // loading the file closes the drawer...
  await expect(page.getByText("Canvas configuration")).toBeHidden();

  // ...applies the fixture's dimensions (1500 x 1500 @ square 10)...
  await page.getByTestId("menu-button").click();
  await expect(page.getByTestId("scene-width-input")).toHaveValue("1500");
  await expect(page.getByTestId("square-size-input")).toHaveValue("10");
  await page.keyboard.press("Escape");

  // ...and paints its 640 black cells onto the canvas
  await expect(async () => {
    const hasBlackFill = await page.evaluate(() => {
      const c = document.getElementById("scene") as HTMLCanvasElement;
      const ctx = c.getContext("2d")!;
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < data.length; i += 4) {
        if (
          data[i] < 20 &&
          data[i + 1] < 20 &&
          data[i + 2] < 20 &&
          data[i + 3] > 200
        )
          return true;
      }
      return false;
    });
    expect(hasBlackFill).toBe(true);
  }).toPass();
});
