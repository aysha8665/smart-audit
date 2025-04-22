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
    <div className={`p-4 m-2 rounded-lg shadow-sm ${
      message.isUser 
        ? "bg-blue-50 border-blue-200 ml-8" 
        : "bg-gray-50 border-gray-200 mr-8"
    } border`}>
      <strong className={`text-sm ${
        message.isUser ? "text-blue-700" : "text-gray-700"
      }`}>
        {message.isUser ? "You" : "Auditor"}:
      </strong>
      <div className="mt-2 text-gray-800 whitespace-pre-line">
        {message.text}
      </div>
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
    setIsLoading(true);

    try {
      const formData = new FormData();
      auditSource.files.forEach(file => formData.append("files", file));
      formData.append("githubUrl", auditSource.githubUrl);
      formData.append("directCode", auditSource.directCode);

      setMessages(prev => [...prev, {
        isUser: true,
        text: `Submitted audit request:\nFiles: ${auditSource.files.map(f => f.name).join(", ") || "None"}\nGitHub: ${auditSource.githubUrl || "None"}\nDirect code: ${auditSource.directCode ? "Provided" : "None"}`
      }]);

      const response = await fetch("/api/audit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setMessages(prev => [...prev, { isUser: false, text: result.analysis }]);
    } catch (error) {
      setMessages(prev => [...prev, { isUser: false, text: "Error during analysis. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Smart Contract Auditor
        </h1>

        <div className="max-h-96 overflow-y-auto mb-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No messages yet. Submit a contract to start the audit.
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessageItem key={index} message={message} />
            ))
          )}
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              Analyzing contracts...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Contract Files (.sol, .vy)
            </label>
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".sol,.vy"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </div>
            {auditSource.files.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {auditSource.files.map(f => f.name).join(", ")}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={auditSource.githubUrl}
              onChange={(e) => setAuditSource(prev => ({ ...prev, githubUrl: e.target.value }))}
              placeholder="https://github.com/user/repo"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Contract Code
            </label>
            <textarea
              value={auditSource.directCode}
              onChange={(e) => setAuditSource(prev => ({ ...prev, directCode: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg h-40 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="// Paste your contract code here..."
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold
              ${isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
              } transition-colors duration-200`}
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Analyze Contracts"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;