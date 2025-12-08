import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock fetch before importing the tool
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

import { DecartImageTool } from "../../src/tools/image.js";

const MOCK_API_KEY = "test-api-key";
const MOCK_PROMPT = "A beautiful sunset over mountains";
const MOCK_IMAGE_DATA = new Uint8Array([137, 80, 78, 71]); // PNG header bytes

describe("DecartImageTool", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, DECART_API_KEY: MOCK_API_KEY };

    // Default mock implementation for successful response
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
      expect(tool.description).toContain("Generate or edit images");
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
      expect(schema.shape.orientation).toBeDefined();
      expect(schema.shape.seed).toBeDefined();
      expect(schema.shape.imageUrl).toBeDefined();
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

  describe("text-to-image generation", () => {
    it("should call correct endpoint with correct headers for t2i", async () => {
      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: MOCK_PROMPT,
        resolution: "720p",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.decart.ai/v1/generate/lucy-pro-t2i");
      expect(options.method).toBe("POST");
      expect((options.headers as Record<string, string>)["X-API-KEY"]).toBe(MOCK_API_KEY);
    });

    it("should send prompt in FormData body", async () => {
      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: MOCK_PROMPT,
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const formData = options.body as FormData;

      expect(formData.get("prompt")).toBe(MOCK_PROMPT);
    });

    it("should include optional parameters when provided", async () => {
      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: MOCK_PROMPT,
        resolution: "480p",
        orientation: "portrait",
        seed: 42,
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const formData = options.body as FormData;

      expect(formData.get("resolution")).toBe("480p");
      expect(formData.get("orientation")).toBe("portrait");
      expect(formData.get("seed")).toBe("42");
    });

    it("should return base64 data URL", async () => {
      const tool = new DecartImageTool();
      const result = await tool.invoke({
        prompt: MOCK_PROMPT,
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
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${customBaseUrl}/v1/generate/lucy-pro-t2i`);
    });
  });

  describe("image-to-image editing", () => {
    it("should use i2i endpoint when imageUrl is provided", async () => {
      const mockImageBlob = new Blob(["source-image"], { type: "image/jpeg" });

      // First call: fetch source image, Second call: API call
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockImageBlob),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(MOCK_IMAGE_DATA.buffer),
          headers: new Headers({ "content-type": "image/png" }),
        } as Response);

      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: "Change sky to sunset",
        imageUrl: "https://example.com/image.jpg",
      });

      // First call should be to fetch the source image
      expect(mockFetch.mock.calls[0][0]).toBe("https://example.com/image.jpg");

      // Second call should be to the i2i endpoint
      const [url] = mockFetch.mock.calls[1] as [string, RequestInit];
      expect(url).toBe("https://api.decart.ai/v1/generate/lucy-pro-i2i");
    });

    it("should include data blob in FormData for i2i", async () => {
      const mockImageBlob = new Blob(["source-image"], { type: "image/jpeg" });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockImageBlob),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(MOCK_IMAGE_DATA.buffer),
          headers: new Headers({ "content-type": "image/png" }),
        } as Response);

      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: "Change sky to sunset",
        imageUrl: "https://example.com/image.jpg",
      });

      const [, options] = mockFetch.mock.calls[1] as [string, RequestInit];
      const formData = options.body as FormData;

      expect(formData.get("data")).toBeDefined();
      expect(formData.get("prompt")).toBe("Change sky to sunset");
    });

    it("should include enhance_prompt for i2i when provided", async () => {
      const mockImageBlob = new Blob(["source-image"], { type: "image/jpeg" });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockImageBlob),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(MOCK_IMAGE_DATA.buffer),
          headers: new Headers({ "content-type": "image/png" }),
        } as Response);

      const tool = new DecartImageTool();
      await tool.invoke({
        prompt: "Change sky to sunset",
        imageUrl: "https://example.com/image.jpg",
        enhancePrompt: false,
      });

      const [, options] = mockFetch.mock.calls[1] as [string, RequestInit];
      const formData = options.body as FormData;

      expect(formData.get("enhance_prompt")).toBe("false");
    });

    it("should throw error if source image fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      } as Response);

      const tool = new DecartImageTool();
      await expect(
        tool.invoke({
          prompt: "Edit this",
          imageUrl: "https://example.com/missing.jpg",
        })
      ).rejects.toThrow("Failed to fetch source image");
    });
  });

  describe("error handling", () => {
    it("should throw on API error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      } as Response);

      const tool = new DecartImageTool();
      await expect(
        tool.invoke({ prompt: MOCK_PROMPT })
      ).rejects.toThrow("Decart API error (401): Unauthorized");
    });

    it("should wrap errors with context", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const tool = new DecartImageTool();
      await expect(
        tool.invoke({ prompt: MOCK_PROMPT })
      ).rejects.toThrow("Decart image generation failed: Network error");
    });
  });
});
