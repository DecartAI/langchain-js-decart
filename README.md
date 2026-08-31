# @decartai/langchain

LangChain.js integration for [Decart AI](https://decart.ai) - Image Editing.

## Installation

```bash
npm install @decartai/langchain @langchain/core
```

## Setup

Get your API key from [platform.decart.ai](https://platform.decart.ai) and set it as an environment variable:

```bash
export DECART_API_KEY="your-api-key"
```

Or pass it directly to the tool:

```typescript
const tool = new DecartImageTool({ apiKey: "your-api-key" });
```

## Quick Start

```typescript
import { readFile } from "node:fs/promises";
import { DecartImageTool } from "@decartai/langchain";

const tool = new DecartImageTool();

// Provide the source image as base64 (or a data: URL). Read/fetch it yourself —
// the tool does not fetch remote URLs.
const image = (await readFile("./photo.jpg")).toString("base64");

// Image-to-image editing
const editedImage = await tool.invoke({
  prompt: "Change the sky to aurora borealis",
  image,
});
// Returns: data:image/png;base64,...
```

## Using with LangChain Agents

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { readFile } from "node:fs/promises";
import { DecartImageTool } from "@decartai/langchain";

const llm = new ChatAnthropic({ model: "claude-sonnet-4-20250514" });
const tool = new DecartImageTool();

// Bind the tool to the model
const llmWithTools = llm.bindTools([tool]);

// The tool takes the source image as base64 — read/fetch it yourself, since the
// tool does not fetch remote URLs.
const image = (await readFile("./photo.jpg")).toString("base64");

// Let the model decide the edit prompt, then supply the resolved image bytes
const response = await llmWithTools.invoke([
  new HumanMessage("Edit my photo to add a futuristic city skyline at night."),
]);

// Execute the tool call if present, injecting the image bytes into the args
if (response.tool_calls?.length > 0) {
  const result = await tool.invoke({ ...response.tool_calls[0].args, image });
  console.log("Edited image:", result);
}
```

## DecartImageTool

Edit images using Decart AI. Returns base64-encoded PNG images.

### Parameters

| Parameter       | Type               | Description                          |
| --------------- | ------------------ | ------------------------------------ |
| `prompt`        | `string`           | Edit instructions for the image      |
| `image`         | `string`           | Source image as base64 or data: URL (required) |
| `resolution`    | `"480p" \| "720p"` | Output resolution (default: "720p")  |
| `seed`          | `number`           | Random seed for reproducibility      |
| `enhancePrompt` | `boolean`          | Auto-enhance prompt (default: true)  |

### Models

- `lucy-pro-i2i` - Image-to-image editing

### Constructor Options

| Option    | Type     | Description                            |
| --------- | -------- | -------------------------------------- |
| `apiKey`  | `string` | Decart API key (or use DECART_API_KEY) |
| `baseUrl` | `string` | Custom API base URL                    |

## API Reference

For detailed API documentation, see the [Decart API Documentation](https://docs.platform.decart.ai).

## License

MIT
