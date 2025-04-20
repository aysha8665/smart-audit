import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  
  // Process different input types
  const files = formData.getAll("files") as File[];
  const githubUrl = formData.get("githubUrl") as string;
  const directCode = formData.get("directCode") as string;

  // In production, you would want to add:
  // - GitHub repository processing
  // - File content extraction
  // - Code parsing and preprocessing

  // For this example, we'll just concatenate all input sources
  let contractCode = "";
  
  // Process uploaded files
  for (const file of files) {
    const text = await file.text();
    contractCode += `\n\n// File: ${file.name}\n${text}`;
  }

  // Add direct code
  if (directCode) {
    contractCode += `\n\n// Direct Code Input:\n${directCode}`;
  }

  // Initialize LLM
  const model = new ChatOpenAI({
    temperature: 0.2,
    modelName: "gpt-4-turbo-preview"
  });

  // Create audit prompt
  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(`You are a senior smart contract security auditor. Analyze the provided smart contract code for:
- Security vulnerabilities
- Common attack vectors
- Code quality issues
- Best practice violations
- Gas optimization opportunities

Provide findings in this format:
1. [Severity] Issue Title
   - Location: (file/line number)
   - Description: (detailed explanation)
   - Recommendation: (fix suggestion)`),
    new HumanMessage(`Please audit the following smart contract code:\n\n${contractCode}`)
  ]);

  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  try {
    const result = await chain.invoke({});
    return NextResponse.json({ analysis: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}