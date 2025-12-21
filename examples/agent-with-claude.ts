/**
 * Demo: Using DecartImageTool with Claude
 *
 * This example shows how to use the DecartImageTool with Claude
 * to generate images via the Decart AI API.
 *
 * Run with: npx tsx examples/agent-with-claude.ts
 */

// Fill in your API keys here:
process.env.ANTHROPIC_API_KEY = "";
process.env.DECART_API_KEY = "";

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

	// Send a message asking to generate an image
	console.log("Asking Claude to generate an image...\n");

	const response = await llmWithTools.invoke([
		new HumanMessage(
			"Generate an image of a beautiful sunset over mountains with orange and purple sky. Use the decart_image_generator tool.",
		),
	]);

	console.log("Response:", response.content);

	// Check if there are tool calls
	if (response.tool_calls && response.tool_calls.length > 0) {
		console.log("\nTool calls:", response.tool_calls);

		// Execute the tool call
		for (const toolCall of response.tool_calls) {
			if (toolCall.name === "decart_image_generator") {
				console.log("\nExecuting tool with args:", toolCall.args);

				const result = await imageGeneratorTool.invoke(toolCall.args);

				if (result.startsWith("data:image")) {
					const base64Data = result.split(",")[1];
					const buffer = Buffer.from(base64Data, "base64");
					writeFileSync("generated-image.png", buffer);
					console.log("\nImage saved to: generated-image.png");
				} else {
					console.log("Tool result:", result);
				}
			}
		}
	}
}

main().catch(console.error);
