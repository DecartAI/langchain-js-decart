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
 *
 * const edited = await tool.invoke({
 *   prompt: "Add a rainbow",
 *   image: "data:image/png;base64,iVBORw0KGgo..."
 * });
 * ```
 *
 * @packageDocumentation
 */

export { DecartImageTool, type DecartImageToolParams } from "./tools/image.js";
