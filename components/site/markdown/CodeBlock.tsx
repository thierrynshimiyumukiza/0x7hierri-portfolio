"use client";

/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
  };

  return (
    <div className="relative my-6 overflow-hidden rounded-lg border border-[--border] bg-[#1E1E1E]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#2D2D2D] px-4 py-2">
        <span className="text-xs font-semibold uppercase text-gray-400">
          {language}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Copy code to clipboard"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <div className="overflow-x-auto text-sm">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.875rem",
          }}
          showLineNumbers
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
