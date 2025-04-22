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
    <div
      className={`p-4 m-3 rounded-xl shadow-md transition-all duration-300 max-w-[80%] ${
        message.isUser
          ? "ml-auto bg-teal-100 border-teal-200 text-teal-900"
          : "mr-auto bg-gray-800 border-gray-700 text-gray-100"
      } border`}
    >
      <strong className="text-sm font-medium">
        {message.isUser ? "You" : "Auditor"}:
      </strong>
      <div className="mt-1 text-sm whitespace-pre-line">{message.text}</div>
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
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAuditSource((prev) => ({
        ...prev,
        files: Array.from(e.target.files!),
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      auditSource.files.forEach((file) => formData.append("files", file));
      formData.append("githubUrl", auditSource.githubUrl);
      formData.append("directCode", auditSource.directCode);

      setMessages((prev) => [
        ...prev,
        {
          isUser: true,
          text: `Submitted audit request:\nFiles: ${
            auditSource.files.map((f) => f.name).join(", ") || "None"
          }\nGitHub: ${auditSource.githubUrl || "None"}\nDirect code: ${
            auditSource.directCode ? "Provided" : "None"
          }`,
        },
      ]);

      const response = await fetch("/api/audit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setMessages((prev) => [
        ...prev,
        { isUser: false, text: result.analysis },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { isUser: false, text: "Error during analysis. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div
        className={`max-w-4xl w-full rounded-2xl shadow-2xl p-6 sm:p-8 transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Smart Contract Auditor
          </h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <div
          className={`max-h-96 overflow-y-auto mb-6 rounded-lg p-4 transition-colors duration-300 ${
            isDarkMode ? "bg-gray-700" : "bg-gray-50"
          }`}
        >
          {messages.length === 0 ? (
            <div className="text-center py-6 opacity-75">
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
            <div className="inline-flex items-center gap-3 text-teal-400">
              <svg
                className="animate-spin h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                />
              </svg>
              <span className="text-sm font-medium">Analyzing contracts...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Upload Contract Files (.sol, .vy)
            </label>
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".sol,.vy"
                onChange={handleFileUpload}
                className={`block w-full text-sm ${
                  isDarkMode
                    ? "text-gray-300 file:bg-teal-900 file:text-teal-300 hover:file:bg-teal-800"
                    : "text-gray-600 file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200"
                } file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium cursor-pointer transition-colors duration-150`}
              />
            </div>
            {auditSource.files.length > 0 && (
              <div
                className={`mt-2 text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Selected: {auditSource.files.map((f) => f.name).join(", ")}
              </div>
            )}
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={auditSource.githubUrl}
              onChange={(e) =>
                setAuditSource((prev) => ({
                  ...prev,
                  githubUrl: e.target.value,
                }))
              }
              placeholder="https://github.com/user/repo"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow duration-200 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Paste Contract Code
            </label>
            <textarea
              value={auditSource.directCode}
              onChange={(e) =>
                setAuditSource((prev) => ({
                  ...prev,
                  directCode: e.target.value,
                }))
              }
              className={`w-full p-4 border rounded-lg h-48 font-mono text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition-shadow duration-200 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
              placeholder="// Paste your contract code here..."
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold text-sm transition-all duration-200 shadow-md ${
              isLoading
                ? "bg-teal-700 cursor-not-allowed opacity-50"
                : "bg-teal-600 hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            } ${isDarkMode ? "focus:ring-offset-gray-800" : "focus:ring-offset-white"}`}
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