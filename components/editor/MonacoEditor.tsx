"use client";

import Editor from "@monaco-editor/react";

export default function MonacoEditor({ code, onChange, language }) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage={language || "javascript"}
        value={code}
        theme="vs-dark"
        onChange={(value) => onChange(value || "")}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
