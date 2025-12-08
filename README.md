# @langchain/decart

LangChain.js integration for [Decart AI](https://decart.ai) - Image Generation and Editing.

## Installation

```bash
npm install @langchain/decart @langchain/core
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
import { DecartImageTool } from "@langchain/decart";

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
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { DecartImageTool } from "@langchain/decart";

const llm = new ChatOpenAI({ model: "gpt-4o-mini" });
const tools = [new DecartImageTool()];

const agent = createReactAgent({ llm, tools });

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Generate an image of a futuristic city at night",
    },
  ],
});
```

## DecartImageTool

Generate or edit images using Decart AI. Returns base64-encoded PNG images.

### Parameters

| Parameter       | Type                        | Description                          |
| --------------- | --------------------------- | ------------------------------------ |
| `prompt`        | `string`                    | Text description or edit instruction |
| `resolution`    | `"480p" \| "720p"`          | Output resolution (default: "720p")  |
| `orientation`   | `"landscape" \| "portrait"` | Output orientation                   |
| `seed`          | `number`                    | Random seed for reproducibility      |
| `imageUrl`      | `string`                    | Source image URL for i2i editing     |
| `enhancePrompt` | `boolean`                   | Auto-enhance prompt (default: true)  |

### Models

- `lucy-pro-t2i` - Text-to-image (default)
- `lucy-pro-i2i` - Image-to-image (when imageUrl provided)

### Constructor Options

| Option         | Type     | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `apiKey`       | `string` | Decart API key (or use DECART_API_KEY)   |
| `baseUrl`      | `string` | Custom API base URL                      |
| `defaultModel` | `string` | Default model (default: "lucy-pro-t2i")  |

## API Reference

For detailed API documentation, see the [Decart API Documentation](https://docs.platform.decart.ai).

## License

MIT
