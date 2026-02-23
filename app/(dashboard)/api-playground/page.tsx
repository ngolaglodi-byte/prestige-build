"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function ApiPlaygroundPage() {
  const [endpoint, setEndpoint] = useState("/v1/generate");
  const [method, setMethod] = useState("POST");
  const [body, setBody] = useState(`{
  "prompt": "Create a landing page hero section"
}`);
  const [response, setResponse] = useState("");

  const runRequest = () => {
    setResponse(`{
  "status": "success",
  "result": "Generated code example..."
}`);
  };

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Back to Dashboard
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center mt-16 fade-in px-6">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          API <span className="text-accent">Playground</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Test the Prestige Build API directly from your browser.
        </p>
      </div>

      {/* Playground */}
      <div className="max-w-5xl mx-auto mt-16 grid grid-cols-2 gap-6 px-6">

        {/* Request */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Request</h2>

          <div className="flex gap-3">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-surfaceLight border border-border rounded-smooth px-3 py-2"
            >
              <option>POST</option>
              <option>GET</option>
            </select>

            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2"
            />
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth p-4 h-64 font-mono text-sm"
          />

          <button
            onClick={runRequest}
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft"
          >
            Send Request
          </button>
        </div>

        {/* Response */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Response</h2>

          <pre className="bg-surfaceLight border border-border rounded-smooth p-4 h-96 overflow-auto text-sm">
{response}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
