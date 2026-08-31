import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock fetch before importing the tool
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

import { DecartImageTool } from "../../src/tools/image.js";

const MOCK_API_KEY = "test-api-key";
const MOCK_PROMPT = "Change the sky to sunset colors";
// Source image provided as base64 (decodes to the 12 bytes of "source-image").
const MOCK_IMAGE_B64 = Buffer.from("source-image").toString("base64");
const MOCK_IMAGE_DATA = new Uint8Array([137, 80, 78, 71]); // PNG header bytes
const API_ENDPOINT = "https://api.decart.ai/v1/generate/lucy-pro-i2i";

describe("DecartImageTool", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, DECART_API_KEY: MOCK_API_KEY };

    // The tool makes exactly one fetch: the Decart API call. It no longer
    // fetches the source image — that would be an SSRF vector for an
    // agent-driven tool.
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(MOCK_IMAGE_DATA.buffer),
      headers: new Headers({ "content-type": "image/png" }),
      text: () => Promise.resolve(""),
    } as Response);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("initialization", () => {
    it("should initialize with correct name and description", () => {
      const tool = new DecartImageTool();
      expect(tool.name).toBe("decart_image_generator");
      expect(tool.description).toContain("Edit images");
    });

    it("should use API key from environment variable", () => {
      const tool = new DecartImageTool();
      expect(tool).toBeDefined();
    });

    it("should use API key from constructor params", () => {
      delete process.env.DECART_API_KEY;
      const tool = new DecartImageTool({ apiKey: "custom-key" });
      expect(tool).toBeDefined();
    });

    it("should throw error if no API key provided", () => {
      delete process.env.DECART_API_KEY;
      expect(() => new DecartImageTool()).toThrow("Decart API key is required");
    });

    it("should have correct schema shape", () => {
      const tool = new DecartImageTool();
      const schema = tool.schema;
      expect(schema.shape.prompt).toBeDefined();
      expect(schema.shape.resolution).toBeDefined();
      expect(schema.shape.seed).toBeDefined();
      expect(schema.shape.image).toBeDefined();
    });

    it("should have lc_secrets getter", () => {
      const tool = new DecartImageTool();
      expect(tool.lc_secrets).toEqual({ apiKey: "DECART_API_KEY" });
    });

    it("should have lc_namespace getter", () => {
      const tool = new DecartImageTool();
      expect(tool.lc_namespace).toContain("decart");
    });
  });

  describe("image-to-image editing", () => {
    it("should call i2i endpoint with correct headers", async () => {
      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: MOCK_PROMPT,
        image: MOCK_IMAGE_B64,
      });

      // The only fetch is the API call — no source-image fetch.
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(API_ENDPOINT);
      expect(options.method).toBe("POST");
      expect((options.headers as Record<string, string>)["X-API-KEY"]).toBe(MOCK_API_KEY);
    });

    it("should not fetch a source-image URL (SSRF guard)", async () => {
      const tool = new DecartImageTool();
      // Even when the image string looks like a URL, it is treated as opaque
      // bytes, never fetched.
      await tool.invoke({
        prompt: MOCK_PROMPT,
        image: "https://internal.example/secret",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toBe(API_ENDPOINT);
    });

    it("should decode the base64 image into the data blob", async () => {
      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: MOCK_PROMPT,
        image: MOCK_IMAGE_B64,
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const formData = options.body as FormData;
      const data = formData.get("data") as Blob;

      expect(data).toBeInstanceOf(Blob);
      expect(data.size).toBe("source-image".length); // decoded, not the base64 string
      expect(formData.get("prompt")).toBe(MOCK_PROMPT);
    });

    it("should accept a data: URL", async () => {
      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: MOCK_PROMPT,
        image: `data:image/png;base64,${MOCK_IMAGE_B64}`,
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const formData = options.body as FormData;
      const data = formData.get("data") as Blob;
      expect(data.size).toBe("source-image".length);
    });

    it("should reject an empty image", async () => {
      const tool = new DecartImageTool();
      await expect(
        tool.invoke({ prompt: MOCK_PROMPT, image: "" })
      ).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should include optional parameters when provided", async () => {
      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: MOCK_PROMPT,
        image: MOCK_IMAGE_B64,
        resolution: "480p",
        seed: 42,
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const formData = options.body as FormData;

      expect(formData.get("resolution")).toBe("480p");
      expect(formData.get("seed")).toBe("42");
    });

    it("should include enhance_prompt when provided", async () => {
      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: MOCK_PROMPT,
        image: MOCK_IMAGE_B64,
        enhancePrompt: false,
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const formData = options.body as FormData;

      expect(formData.get("enhance_prompt")).toBe("false");
    });

    it("should return base64 data URL", async () => {
      const tool = new DecartImageTool();
      const result = await tool.invoke({
        prompt: MOCK_PROMPT,
        image: MOCK_IMAGE_B64,
      });

      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it("should use custom baseUrl when provided", async () => {
      const customBaseUrl = "https://custom.api.decart.ai";
      const tool = new DecartImageTool({
        apiKey: MOCK_API_KEY,
        baseUrl: customBaseUrl,
      });
      await tool.invoke({
        prompt: MOCK_PROMPT,
        image: MOCK_IMAGE_B64,
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${customBaseUrl}/v1/generate/lucy-pro-i2i`);
    });
  });

  describe("error handling", () => {
    it("should throw on API error", async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      } as Response);

      const tool = new DecartImageTool();
      await expect(
        tool.invoke({ prompt: MOCK_PROMPT, image: MOCK_IMAGE_B64 })
      ).rejects.toThrow("Decart API error (401): Unauthorized");
    });

    it("should wrap errors with context", async () => {
      mockFetch.mockReset();
      mockFetch.mockRejectedValue(new Error("Network error"));

      const tool = new DecartImageTool();
      await expect(
        tool.invoke({ prompt: MOCK_PROMPT, image: MOCK_IMAGE_B64 })
      ).rejects.toThrow("Decart image generation failed: Network error");
    });
  });
});
