/**
 * @decartai/langchain
 *
 * LangChain.js integration for Decart AI - Image Editing.
 *
 * This package provides a LangChain tool for image-to-image editing.
 *
 * @example
 * ```typescript
 * import { DecartImageTool } from "@decartai/langchain";
 *
 * const tool = new DecartImageTool();
 * const exampleImageUrl = "https://picsum.photos/id/10/480/360.jpg";
 *
 * const edited = await tool.invoke({
 *   prompt: "Add a rainbow",
 *   imageUrl: exampleImageUrl
 * });
 * ```
 *
 * @packageDocumentation
 */

export { DecartImageTool, type DecartImageToolParams } from "./tools/image.js";
