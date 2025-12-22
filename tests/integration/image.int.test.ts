import { describe, it, expect, beforeAll } from "@jest/globals";
import { DecartImageTool } from "../../src/tools/image.js";

describe("DecartImageTool Integration", () => {
  let tool: DecartImageTool;

  beforeAll(() => {
    // Will throw if DECART_API_KEY is not set
    tool = new DecartImageTool();
  });

  it("generates an image from text (t2i)", async () => {
    const result = await tool.invoke({
      prompt: "A beautiful sunset over mountains",
      resolution: "480p",
    });

    // Result should be a base64 data URL
    expect(result).toMatch(/^data:image\/(png|jpeg|webp);base64,/);

    // Should have actual content (not empty)
    const base64Part = result.split(",")[1];
    expect(base64Part.length).toBeGreaterThan(100);
  }, 60000);

  it("generates image with portrait orientation", async () => {
    const result = await tool.invoke({
      prompt: "A cat sitting on a windowsill",
      orientation: "portrait",
      resolution: "480p",
    });

    expect(result).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
  }, 60000);

  it("generates image with landscape orientation", async () => {
    const result = await tool.invoke({
      prompt: "A wide ocean view",
      orientation: "landscape",
      resolution: "480p",
    });

    expect(result).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
  }, 60000);

  it("generates reproducible images with seed", async () => {
    const prompt = "A simple geometric pattern";
    const seed = 12345;

    const result1 = await tool.invoke({
      prompt,
      seed,
      resolution: "480p",
    });

    const result2 = await tool.invoke({
      prompt,
      seed,
      resolution: "480p",
    });

    // Same seed should produce identical images
    expect(result1).toBe(result2);
  }, 120000);
});
