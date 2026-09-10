import { expect, test } from "@playwright/test";

test("zoom controls change the zoom level and the canvas stays crisp", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/");

  const zoomValue = page.getByTestId("scale-value");
  await expect(zoomValue).toHaveText("100%");

  await page.getByTestId("scale-up").click();
  await expect(zoomValue).toHaveText("125%");

  await page.getByTestId("scale-up").click();
  await page.getByTestId("scale-down").click();
  await expect(zoomValue).toHaveText("125%");

  await page.getByTestId("scale-down").click();
  await expect(zoomValue).toHaveText("100%");

  // wheel zooms in on the pointer
  const scene = page.getByTestId("scene");
  await scene.hover({ position: { x: 200, y: 200 } });
  await page.mouse.wheel(0, -600);
  await expect(async () => {
    const pct = Number((await zoomValue.textContent())!.replace("%", ""));
    expect(pct).toBeGreaterThan(100);
  }).toPass();

  // the backing store is sized to the viewport * devicePixelRatio, not the grid
  const ok = await page.evaluate(() => {
    const c = document.getElementById("scene") as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1;
    return (
      Math.abs(c.width - c.getBoundingClientRect().width * dpr) <= dpr &&
      c.width > 0
    );
  });
  expect(ok).toBe(true);

  // changing dimensions resets the zoom
  await page.getByTestId("menu-button").click();
  await page.getByTestId("square-size-input").selectOption("10");
  await page.keyboard.press("Escape");
  await expect(zoomValue).toHaveText("100%");

  await expect(page).toHaveScreenshot();
});
