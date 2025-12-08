/**
 * @langchain/decart
 *
 * LangChain.js integration for Decart AI - Image Generation and Editing.
 *
 * This package provides LangChain tools for:
 * - Text-to-image generation (DecartImageTool)
 * - Image-to-image editing (DecartImageTool with imageUrl)
 *
 * @example
 * ```typescript
 * import { DecartImageTool } from "@langchain/decart";
 *
 * const tool = new DecartImageTool();
 *
 * // Text-to-image generation
 * const image = await tool.invoke({ prompt: "A sunset over mountains" });
 *
 * // Image-to-image editing
 * const edited = await tool.invoke({
 *   prompt: "Add a rainbow",
 *   imageUrl: "https://example.com/image.jpg"
 * });
 * ```
 *
 * @packageDocumentation
 */

export * from "./tools/index.js";
