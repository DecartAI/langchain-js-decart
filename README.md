# @decartai/langchain

LangChain.js integration for [Decart AI](https://decart.ai) - Image Generation and Editing.

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
import { DecartImageTool } from "@decartai/langchain";

const tool = new DecartImageTool();

// Text-to-image generation
const image = await tool.invoke({
  prompt: "A serene mountain landscape at sunset",
  resolution: "720p",
});
// Returns: data:image/png;base64,...

// Image-to-image editing
const editedImage = await tool.invoke({
  prompt: "Change the sky to aurora borealis",
  imageUrl: "https://example.com/original.jpg",
});
```

## Using with LangChain Agents

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { DecartImageTool } from "@decartai/langchain";

const llm = new ChatAnthropic({ model: "claude-sonnet-4-20250514" });
const tool = new DecartImageTool();

// Bind the tool to the model
const llmWithTools = llm.bindTools([tool]);

// Ask the model to generate an image
const response = await llmWithTools.invoke([
  new HumanMessage("Generate an image of a futuristic city at night"),
]);

// Execute the tool call if present
if (response.tool_calls?.length > 0) {
  const result = await tool.invoke(response.tool_calls[0].args);
  console.log("Generated image:", result);
}
```

## DecartImageTool

Generate or edit images using Decart AI. Returns base64-encoded PNG images.

### Parameters

| Parameter       | Type                        | Description                          |
| --------------- | --------------------------- | ------------------------------------ |
| `prompt`        | `string`                    | Text description or edit instruction |
| `resolution`    | `"480p" \| "720p"`          | Output resolution (default: "720p")  |
| `orientation`   | `"landscape" \| "portrait"` | Output orientation (t2i only)        |
| `seed`          | `number`                    | Random seed for reproducibility      |
| `imageUrl`      | `string`                    | Source image URL for i2i editing     |
| `enhancePrompt` | `boolean`                   | Auto-enhance prompt (default: true)  |

### Models

- `lucy-pro-t2i` - Text-to-image (used when no imageUrl provided)
- `lucy-pro-i2i` - Image-to-image (used when imageUrl provided)

### Constructor Options

| Option    | Type     | Description                            |
| --------- | -------- | -------------------------------------- |
| `apiKey`  | `string` | Decart API key (or use DECART_API_KEY) |
| `baseUrl` | `string` | Custom API base URL                    |

## API Reference

For detailed API documentation, see the [Decart API Documentation](https://docs.platform.decart.ai).

## License

MIT
