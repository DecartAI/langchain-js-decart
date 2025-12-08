import { StructuredTool, ToolParams } from "@langchain/core/tools";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { z } from "zod";

const DEFAULT_BASE_URL = "https://api.decart.ai";

/**
 * Parameters for the DecartImageTool.
 */
export interface DecartImageToolParams extends ToolParams {
  /**
   * The Decart API key.
   * If not provided, will use DECART_API_KEY environment variable.
   */
  apiKey?: string;
  /**
   * The base URL for the Decart API.
   * Optional - defaults to Decart's production API.
   */
  baseUrl?: string;
}

/**
 * Input schema for the DecartImageTool.
 * Note: LangChain requires a Zod schema for JSON Schema generation and runtime validation.
 * The SDK only exports TypeScript types which are erased at compile time.
 */
const DecartImageInputSchema = z.object({
  prompt: z
    .string()
    .describe("Text description of the image to generate or edit instructions"),
  resolution: z
    .enum(["480p", "720p"])
    .optional()
    .default("720p")
    .describe("Output resolution"),
  orientation: z
    .enum(["landscape", "portrait"])
    .optional()
    .describe("Output orientation"),
  seed: z
    .number()
    .optional()
    .describe("Random seed for reproducible results"),
  imageUrl: z
    .string()
    .optional()
    .describe("Source image URL for image-to-image editing. If provided, uses lucy-pro-i2i model"),
  enhancePrompt: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to auto-enhance the prompt"),
});

type DecartImageInput = z.infer<typeof DecartImageInputSchema>;

/**
 * Tool for generating and editing images using Decart AI.
 *
 * Supports two modes:
 * - Text-to-Image (lucy-pro-t2i): Generate images from text descriptions
 * - Image-to-Image (lucy-pro-i2i): Edit/transform existing images with text prompts
 *
 * @example
 * ```typescript
 * // Text-to-image
 * const tool = new DecartImageTool({ apiKey: "..." });
 * const result = await tool.invoke({
 *   prompt: "A serene mountain landscape at sunset",
 *   resolution: "720p"
 * });
 *
 * // Image-to-image
 * const result = await tool.invoke({
 *   prompt: "Change the sky to sunset colors",
 *   imageUrl: "https://example.com/image.jpg"
 * });
 * ```
 */
export class DecartImageTool extends StructuredTool<typeof DecartImageInputSchema> {
  static lc_name() {
    return "DecartImageTool";
  }

  get lc_secrets(): { [key: string]: string } | undefined {
    return {
      apiKey: "DECART_API_KEY",
    };
  }

  get lc_namespace(): string[] {
    return [...super.lc_namespace, "decart"];
  }

  name = "decart_image_generator";

  description =
    "Generate or edit images using Decart AI. For text-to-image, provide a prompt. For image editing, also provide an imageUrl. Returns a base64 data URL of the generated image.";

  schema = DecartImageInputSchema;

  private apiKey: string;
  private baseUrl: string;

  constructor(params: DecartImageToolParams = {}) {
    super(params);
    const apiKey = params.apiKey ?? getEnvironmentVariable("DECART_API_KEY");
    if (!apiKey) {
      throw new Error(
        "Decart API key is required. Set DECART_API_KEY environment variable or pass apiKey in constructor."
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = params.baseUrl ?? DEFAULT_BASE_URL;
  }

  protected async _call(
    input: DecartImageInput,
    _runManager?: CallbackManagerForToolRun
  ): Promise<string> {
    const { prompt, resolution, orientation, seed, imageUrl, enhancePrompt } = input;

    try {
      // Choose endpoint based on whether we have source image
      const endpoint = imageUrl
        ? `${this.baseUrl}/v1/generate/lucy-pro-i2i`
        : `${this.baseUrl}/v1/generate/lucy-pro-t2i`;

      // Build form data
      const formData = new FormData();
      formData.append("prompt", prompt);
      if (resolution) formData.append("resolution", resolution);
      if (seed !== undefined) formData.append("seed", String(seed));

      if (imageUrl) {
        // i2i mode - fetch source image and add to form
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch source image: ${imageResponse.statusText}`);
        }
        const imageBlob = await imageResponse.blob();
        formData.append("data", imageBlob);
        // enhance_prompt only applies to i2i
        if (enhancePrompt !== undefined) {
          formData.append("enhance_prompt", String(enhancePrompt));
        }
      } else {
        // t2i mode - orientation only applies here
        if (orientation) formData.append("orientation", orientation);
      }

      // Call the Decart API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Decart API error (${response.status}): ${errorText}`);
      }

      // Convert response to base64 data URL
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = response.headers.get("content-type") || "image/png";

      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Decart image generation failed: ${error.message}`);
      }
      throw error;
    }
  }
}
