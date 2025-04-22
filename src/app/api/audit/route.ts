import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableParallel } from "@langchain/core/runnables";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key is not configured");
    return NextResponse.json(
      { error: "OpenAI API key is not configured" },
      { status: 500 }
    );
  }

  // Process different input types
  let contractCode = "";
  const files = formData.getAll("files") as File[];
  if (files.length > 0) {
    for (const file of files) {
      try {
        const text = await file.text();
        if (!text.trim()) {
          console.warn(`Empty file: ${file.name}`);
          continue;
        }
        contractCode += `\n\n// File: ${file.name}\n${text}`;
      } catch (err) {
        console.error(`Error reading file ${file.name}:`, err);
        return NextResponse.json(
          { error: `Failed to read file: ${file.name}` },
          { status: 500 }
        );
      }
    }
  }

  const directCode = formData.get("directCode") as string;
  if (directCode) {
    contractCode += `\n\n// Direct Code Input:\n${directCode}`;
  }

  if (!contractCode.trim()) {
    return NextResponse.json(
      { error: "No valid contract code provided" },
      { status: 400 }
    );
  }

  // Initialize LLM
  const model = new ChatOpenAI({
    temperature: 0.2,
    modelName: "gpt-4-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  // Define prompts for each chain
  const syntaxCheckPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(`You are a smart contract compiler. Your task is to check if the provided smart contract code compiles without errors. If there are any compilation errors, list them. If there are no errors, say "No compilation errors."`),
    new HumanMessage(`Please check the following smart contract code for compilation errors:\n\n{contract_code}`)
  ]);

  const vulnerabilityPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(`You are a senior smart contract security auditor. Your task is to analyze the provided smart contract code for security vulnerabilities such as reentrancy, integer overflows, unchecked sends, etc. List all findings with their locations (file/line number) and descriptions.`),
    new HumanMessage(`Please audit the following smart contract code for security vulnerabilities:\n\n{contract_code}`)
  ]);

  const gasOptimizationPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(`You are a smart contract gas optimization expert. Your task is to analyze the provided smart contract code for opportunities to reduce gas costs. Identify functions or operations that can be optimized and suggest improvements.`),
    new HumanMessage(`Please review the following smart contract code for gas optimization opportunities:\n\n{contract_code}`)
  ]);

  const bestPracticesPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(`You are a smart contract best practices expert. Your task is to check if the provided smart contract code follows industry best practices, such as using safe math libraries, avoiding tx.origin, using proper event emissions, etc. List all deviations from best practices with their locations and suggest corrections.`),
    new HumanMessage(`Please check the following smart contract code for adherence to best practices:\n\n{contract_code}`)
  ]);

  const reportPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(`You are a report compiler for smart contract audits. Your task is to take the following audit findings and compile them into a structured report. The report should include sections for syntax check, security vulnerabilities, gas optimization, and best practices. Each section should list the findings with their severities, locations, descriptions, and recommendations if applicable.`),
    new HumanMessage(`Here are the audit findings:\nSyntax Check: {syntaxCheck}\nVulnerabilities: {vulnerabilities}\nGas Optimization: {gasOptimization}\nBest Practices: {bestPractices}\nPlease compile this into a structured report.`)
  ]);

  // Define individual chains
  const syntaxCheckChain = syntaxCheckPrompt.pipe(model).pipe(new StringOutputParser());
  const vulnerabilityChain = vulnerabilityPrompt.pipe(model).pipe(new StringOutputParser());
  const gasOptimizationChain = gasOptimizationPrompt.pipe(model).pipe(new StringOutputParser());
  const bestPracticesChain = bestPracticesPrompt.pipe(model).pipe(new StringOutputParser());
  const reportChain = reportPrompt.pipe(model).pipe(new StringOutputParser());

  // Define parallel chains for concurrent execution
  const auditChains = new RunnableParallel({
    steps: {
      syntaxCheck: syntaxCheckChain,
      vulnerabilities: vulnerabilityChain,
      gasOptimization: gasOptimizationChain,
      bestPractices: bestPracticesChain,
    }
  });

  // Define the full audit chain
  const fullAuditChain = auditChains.pipe(reportChain);

  try {
    const result = await fullAuditChain.invoke({ contract_code: contractCode });
    return NextResponse.json({ analysis: result });
  } catch (error: unknown) {
    console.error("Audit error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Analysis failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}