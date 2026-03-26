import { describe, it, expect, beforeAll } from "@jest/globals";
import { DecartImageTool } from "../../src/tools/image.js";

// A publicly accessible test image
const TEST_IMAGE_URL = "https://picsum.photos/id/10/480/360.jpg";

describe("DecartImageTool Integration", () => {
  let tool: DecartImageTool;

  beforeAll(() => {
    // Will throw if DECART_API_KEY is not set
    tool = new DecartImageTool();
  });

  it("edits an image (i2i)", async () => {
    const result = await tool.invoke({
      prompt: "Add a beautiful sunset sky",
      imageUrl: TEST_IMAGE_URL,
      resolution: "480p",
    });

    // Result should be a base64 data URL
    expect(result).toMatch(/^data:image\/(png|jpeg|webp);base64,/);

    // Should have actual content (not empty)
    const base64Part = result.split(",")[1];
    expect(base64Part.length).toBeGreaterThan(100);
  }, 60000);

  it("generates reproducible edits with seed", async () => {
    const prompt = "Make it look like a painting";
    const seed = 12345;

    const result1 = await tool.invoke({
      prompt,
      imageUrl: TEST_IMAGE_URL,
      seed,
      resolution: "480p",
    });

    const result2 = await tool.invoke({
      prompt,
      imageUrl: TEST_IMAGE_URL,
      seed,
      resolution: "480p",
    });

    // Same seed should produce identical images
    expect(result1).toBe(result2);
  }, 120000);
});
