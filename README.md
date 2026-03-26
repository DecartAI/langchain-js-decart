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
import { DecartImageTool } from "@decartai/langchain";

const tool = new DecartImageTool();
const exampleImageUrl = "https://picsum.photos/id/10/480/360.jpg";

// Image-to-image editing
const editedImage = await tool.invoke({
  prompt: "Change the sky to aurora borealis",
  imageUrl: exampleImageUrl,
});
// Returns: data:image/png;base64,...
```

## Using with LangChain Agents

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { DecartImageTool } from "@decartai/langchain";

const llm = new ChatAnthropic({ model: "claude-sonnet-4-20250514" });
const tool = new DecartImageTool();
const exampleImageUrl = "https://picsum.photos/id/10/480/360.jpg";

// Bind the tool to the model
const llmWithTools = llm.bindTools([tool]);

// Ask the model to edit an image
const response = await llmWithTools.invoke([
  new HumanMessage(
    `Edit this image to add a futuristic city skyline at night: ${exampleImageUrl}`
  ),
]);

// Execute the tool call if present
if (response.tool_calls?.length > 0) {
  const result = await tool.invoke(response.tool_calls[0].args);
  console.log("Edited image:", result);
}
```

## DecartImageTool

Edit images using Decart AI. Returns base64-encoded PNG images.

### Parameters

| Parameter       | Type               | Description                          |
| --------------- | ------------------ | ------------------------------------ |
| `prompt`        | `string`           | Edit instructions for the image      |
| `imageUrl`      | `string`           | Source image URL (required)           |
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
