// @vitest-environment node
import { test, expect, beforeAll, afterAll } from "vitest";
import puppeteer, { Browser, Page } from "puppeteer";
import { createServer, ViteDevServer } from "vite";
import fs from "fs";

let browser: Browser;
let page: Page;
let server: ViteDevServer;

beforeAll(async () => {
    server = await createServer({
        server: { port: 5174 },
        root: process.cwd(),
    });
    await server.listen();

    browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=800,600"],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
});

afterAll(async () => {
    if (browser) await browser.close();
    if (server) await server.close();
});

test("car svg is displayed in the car selection screen without gray boxes", async () => {
    await page.goto("http://localhost:5174/", { waitUntil: "networkidle0" });

    await page.waitForFunction(() => {
        return document.querySelector("canvas") !== null;
    });

    await new Promise(r => setTimeout(r, 2000));

    // Focus canvas because keyboard events require focus
    await page.click("canvas");
    await new Promise(r => setTimeout(r, 200));

    // Spacebar 1: Skips to Music Selection
    await page.keyboard.press("Space");
    await new Promise(r => setTimeout(r, 500));

    // Spacebar 2: Skips to Car Selection
    await page.keyboard.press("Space");
    await new Promise(r => setTimeout(r, 1000));

    const isCarRenderedProperly = await page.evaluate(async () => {
        return new Promise(resolve => {
            let attempts = 0;
            const check = () => {
                const canvas = document.querySelector("canvas");
                if (!canvas) { resolve(false); return; }

                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (!ctx) { resolve(false); return; }

                const scale = canvas.width / 800;
                const imgData = ctx.getImageData(350 * scale, 100 * scale, 100 * scale, 100 * scale);
                const pixels = imgData.data;
                let foundNonGray = false;

                for (let i = 0; i < pixels.length; i += 4) {
                    const r = pixels[i] as number;
                    const g = pixels[i + 1] as number;
                    const b = pixels[i + 2] as number;
                    const a = pixels[i + 3] as number;

                    if (a > 0) {
                        // The placeholder is exactly RGB 34, 34, 34 (#222222)
                        // The background is exactly RGB 0, 32, 0 (#002000)
                        // If we get bright pixels (r > 150), it's definitely the SVG
                        if (r > 150 && g > 150 && b > 150) {
                            foundNonGray = true;
                        }
                    }
                }
                if (foundNonGray) {
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

    if (!isCarRenderedProperly) {
        const client = await page.createCDPSession();
        const { data } = await client.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync("car-selection-debug.png", Buffer.from(data, "base64"));
    }

    expect(isCarRenderedProperly).toBe(true);
}, 15000);
