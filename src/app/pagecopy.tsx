"use client";

import { useState } from "react";

type ChatMessage = {
  isUser: boolean;
  text: string;
};

type AuditSource = {
  files: File[];
  githubUrl: string;
  directCode: string;
};

const ChatMessageItem = ({ message }: { message: ChatMessage }) => {
  return (
    <div className="whitespace-pre-line border border-b-1 border-slate-400 p-2 m-2">
      <strong>{message.isUser ? "User" : "Auditor"}:</strong>
      <div className="mt-1">{message.text}</div>
    </div>
  );
};

const Home = () => {
  const [auditSource, setAuditSource] = useState<AuditSource>({
    files: [],
    githubUrl: "",
    directCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAuditSource(prev => ({ ...prev, files: Array.from(e.target.files!) }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    // Validate inputs
    if (!auditSource.files.length && !auditSource.githubUrl && !auditSource.directCode) {
      alert("Please provide at least one source of contract code");
      return;
    }
  
    setIsLoading(true);

    try {
      const formData = new FormData();
      auditSource.files.forEach(file => formData.append("files", file));
      formData.append("githubUrl", auditSource.githubUrl);
      formData.append("directCode", auditSource.directCode);

      setMessages(prev => [...prev, { 
        isUser: true, 
        text: `Submitted audit request:\n${auditSource.files.map(f => f.name).join("\n")}
               \nGitHub: ${auditSource.githubUrl || "None"}
               \nDirect code: ${auditSource.directCode ? "Provided" : "None"}`
      }]);

      const response = await fetch("/api/audit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessages(prev => [...prev, { isUser: false, text: result.analysis }]);
    } catch (error) {
      setMessages(prev => [...prev, { isUser: false, text: "Error during analysis" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        {messages.map((message, index) => (
          <ChatMessageItem key={index} message={message} />
        ))}
      </div>

      {isLoading && <div className="text-center p-4">Analyzing contracts...</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Upload Contract Files:</label>
          <input
            type="file"
            multiple
            accept=".sol,.vy"
            onChange={handleFileUpload}
            className="block w-full"
          />
        </div>

        <div>
          <label className="block mb-2">GitHub Repository URL:</label>
          <input
            type="text"
            value={auditSource.githubUrl}
            onChange={(e) => setAuditSource(prev => ({ ...prev, githubUrl: e.target.value }))}
            placeholder="https://github.com/user/repo"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Or paste contract code directly:</label>
          <textarea
            value={auditSource.directCode}
            onChange={(e) => setAuditSource(prev => ({ ...prev, directCode: e.target.value }))}
            className="w-full p-2 border rounded h-32"
            placeholder="// Paste your contract code here..."
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          Analyze Contracts
        </button>
      </form>
    </div>
  );
};

export default Home;