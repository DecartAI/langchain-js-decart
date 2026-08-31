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
    .describe("Edit instructions describing how to transform the image"),
  resolution: z
    .enum(["480p", "720p"])
    .optional()
    .describe("Output resolution (default: 720p)"),
  seed: z
    .number()
    .optional()
    .describe("Random seed for reproducible results"),
  image: z
    .string()
    .describe(
      'Source image as base64, or a data: URL (e.g. "data:image/png;base64,..."). ' +
        "Fetch remote images yourself and pass the bytes — this tool does not fetch URLs."
    ),
  enhancePrompt: z
    .boolean()
    .optional()
    .describe("Whether to auto-enhance the prompt (default: true)"),
});

type DecartImageInput = z.infer<typeof DecartImageInputSchema>;

/**
 * Tool for editing images using Decart AI (lucy-pro-i2i).
 *
 * Transforms existing images using text prompts.
 *
 * @example
 * ```typescript
 * const tool = new DecartImageTool({ apiKey: "..." });
 * const result = await tool.invoke({
 *   prompt: "Change the sky to sunset colors",
 *   image: "data:image/png;base64,iVBORw0KGgo..."
 * });
 * ```
 */
export class DecartImageTool extends StructuredTool {
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
    "Edit images using Decart AI. Provide a prompt describing the edit and the source image as base64 (or a data: URL). Returns a base64 data URL of the edited image.";

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
    const { prompt, seed, image } = input;
    const resolution = input.resolution ?? "720p";
    const enhancePrompt = input.enhancePrompt ?? true;

    try {
      const endpoint = `${this.baseUrl}/v1/generate/lucy-pro-i2i`;

      // Build form data
      const formData = new FormData();
      formData.append("prompt", prompt);
      if (resolution) formData.append("resolution", resolution);
      if (seed !== undefined) formData.append("seed", String(seed));

      // Decode the caller-supplied image (base64, or a data: URL) into bytes.
      // This tool intentionally does NOT fetch remote URLs: an agent-driven tool
      // that fetched an arbitrary URL from the host would be an SSRF vector.
      // Resolve remote images yourself and pass the bytes.
      const imageBase64 = image.startsWith("data:") ? (image.split(",", 2)[1] ?? "") : image;
      if (!imageBase64) {
        throw new Error("image must be non-empty base64 or a data: URL");
      }
      const imageBlob = new Blob([Buffer.from(imageBase64, "base64")]);
      formData.append("data", imageBlob);
      if (enhancePrompt !== undefined) {
        formData.append("enhance_prompt", String(enhancePrompt));
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
