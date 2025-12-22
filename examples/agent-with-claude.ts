/**
 * Demo: Using DecartImageTool with Claude
 *
 * This example shows a multi-step pipeline:
 * 1. Claude decides to generate an image using the DecartImageTool
 * 2. The generated image is passed back to Claude
 * 3. Claude describes what it sees in the generated image
 *
 * Setup:
 * 1. Copy .env.example to .env and fill in your API keys
 * 2. Run with: npx tsx --env-file=.env examples/agent-with-claude.ts
 */

import { writeFileSync } from "node:fs";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { DecartImageTool } from "../src/tools/image.js";

async function main() {
  // Create the Decart image generation tool
  const imageGeneratorTool = new DecartImageTool();

  // Create Claude model with tool binding
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0,
  });

  // Bind the tool to the model
  const llmWithTools = llm.bindTools([imageGeneratorTool]);

  // Step 1: Ask Claude to generate an image
  console.log("=== Step 1: Asking Claude to generate an image ===\n");

  const response = await llmWithTools.invoke([
    new HumanMessage(
      "Generate an image of a beautiful sunset over mountains with orange and purple sky. Use the decart_image_generator tool."
    ),
  ]);

  console.log("Claude's response:", response.content);

  // Step 2: Execute the tool call and get the image
  let generatedImageBase64: string | null = null;

  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log("\n=== Step 2: Executing tool call ===\n");

    for (const toolCall of response.tool_calls) {
      if (toolCall.name === "decart_image_generator") {
        console.log("Generating image with prompt:", toolCall.args.prompt);

        const result = await imageGeneratorTool.invoke(toolCall.args);

        if (result.startsWith("data:image")) {
          generatedImageBase64 = result;
          const base64Data = result.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          writeFileSync("generated-image.png", buffer);
          console.log("Image saved to: generated-image.png");
        }
      }
    }
  }

  // Step 3: Pass the image back to Claude for description
  if (generatedImageBase64) {
    console.log(
      "\n=== Step 3: Asking Claude to describe the generated image ===\n"
    );

    // Send image to Claude for description
    const descriptionResponse = await llm.invoke([
      new HumanMessage({
        content: [
          {
            type: "image_url",
            image_url: {
              url: generatedImageBase64,
            },
          },
          {
            type: "text",
            text: "Please describe this image in detail. What do you see? Does it match what was requested (a beautiful sunset over mountains with orange and purple sky)?",
          },
        ],
      }),
    ]);

    console.log("Claude's description of the generated image:\n");
    console.log(descriptionResponse.content);
  }

  console.log("\n=== Pipeline complete! ===");
}

main().catch(console.error);
