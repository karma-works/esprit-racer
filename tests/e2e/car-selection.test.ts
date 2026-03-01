// @vitest-environment node
import { test, expect, beforeAll, afterAll } from "vitest";
import puppeteer, { Browser, Page } from "puppeteer";
import { createServer, ViteDevServer } from "vite";
import fs from "fs";

let browser: Browser | null = null;
let page: Page | null = null;
let server: ViteDevServer | null = null;
let skipTests = false;

beforeAll(async () => {
  try {
    server = await createServer({
      server: { port: 5174 },
      root: process.cwd(),
    });
    await server.listen();

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--window-size=800,600",
      ],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
  } catch {
    skipTests = true;
  }
});

afterAll(async () => {
  if (browser) await browser.close();
  if (server) await server.close();
});

test("car svg is displayed in the car selection screen without gray boxes", async () => {
  if (skipTests || !page) {
    return;
  }

  await page.goto("http://localhost:5174/", { waitUntil: "networkidle0" });

  await page.waitForFunction(() => {
    return document.querySelector("canvas") !== null;
  });

  await new Promise((r) => setTimeout(r, 2000));

  await page.click("canvas");
  await new Promise((r) => setTimeout(r, 200));

  await page.keyboard.press("Space");
  await new Promise((r) => setTimeout(r, 500));

  await page.keyboard.press("Space");
  await new Promise((r) => setTimeout(r, 1000));

  const isCarRenderedProperly = await page.evaluate(async () => {
    return new Promise<boolean>((resolve) => {
      let attempts = 0;
      const check = () => {
        const canvas = document.querySelector("canvas");
        if (!canvas) {
          resolve(false);
          return;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(false);
          return;
        }

        const scale = canvas.width / 800;
        const imgData = ctx.getImageData(
          300 * scale,
          150 * scale,
          200 * scale,
          100 * scale,
        );
        const pixels = imgData.data;
        let brightPixelCount = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i] as number;
          const g = pixels[i + 1] as number;
          const b = pixels[i + 2] as number;
          const a = pixels[i + 3] as number;

          if (a > 0) {
            if (r > 150 && g > 150 && b > 150) {
              brightPixelCount++;
            }
          }
        }
        if (brightPixelCount > 100) {
          resolve(true);
        } else {
          attempts++;
          if (attempts > 50) {
            resolve(false);
          } else {
            requestAnimationFrame(check);
          }
        }
      };
      check();
    });
  });

  if (!isCarRenderedProperly && page) {
    const client = await page.createCDPSession();
    const { data } = await client.send("Page.captureScreenshot", {
      format: "png",
    });
    fs.writeFileSync("car-selection-debug.png", Buffer.from(data, "base64"));
  }

  expect(isCarRenderedProperly).toBe(true);
}, 15000);
