"use client";

export interface GeneratedFile {
  file: string;
  content: string;
}

export function generateProjectArchitecture(type: string): GeneratedFile[] {
  switch (type) {
    case "nextjs":
      return [
        {
          file: "src/app/layout.tsx",
          content: `export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
        },
        {
          file: "src/app/page.tsx",
          content: `export default function Home() {
  return <div>Hello from Next.js Architecture</div>;
}`,
        },
        {
          file: "src/components/ui/Button.tsx",
          content: `export default function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
      {children}
    </button>
  );
}`,
        },
      ];

    case "react":
      return [
        {
          file: "src/App.tsx",
          content: `export default function App() {
  return <h1>Hello from React Architecture</h1>;
}`,
        },
        {
          file: "src/components/Button.tsx",
          content: `export default function Button({ children }) {
  return <button>{children}</button>;
}`,
        },
      ];

    case "node":
      return [
        {
          file: "src/index.js",
          content: `console.log("Node.js backend ready");`,
        },
        {
          file: "src/utils/logger.js",
          content: `export function log(msg) {
  console.log("[LOG]", msg);
}`,
        },
      ];

    case "express":
      return [
        {
          file: "src/server.js",
          content: `import express from "express";
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Express API running");
});

app.listen(3000, () => console.log("Server running on port 3000"));`,
        },
      ];

    case "api-rest":
      return [
        {
          file: "src/server.js",
          content: `import express from "express";
import router from "./routes/index.js";

const app = express();
app.use(express.json());
app.use("/api", router);

app.listen(3000, () => console.log("REST API running"));`,
        },
        {
          file: "src/routes/index.js",
          content: `import { Router } from "express";
import userController from "../controllers/userController.js";

const router = Router();
router.get("/users", userController.list);

export default router;`,
        },
        {
          file: "src/controllers/userController.js",
          content: `export default {
  list(req, res) {
    res.json([{ id: 1, name: "John Doe" }]);
  },
};`,
        },
      ];

    case "saas":
      return [
        {
          file: "src/app/page.tsx",
          content: `export default function Dashboard() {
  return <div>Welcome to your SaaS dashboard</div>;
}`,
        },
        {
          file: "src/app/api/auth/login/route.ts",
          content: `export async function POST(req: Request) {
  return Response.json({ success: true });
}`,
        },
        {
          file: "src/components/ui/Card.tsx",
          content: `export default function Card({ children }) {
  return <div className="p-4 bg-[#1A1A1A] rounded-lg">{children}</div>;
}`,
        },
      ];

    case "saas-advanced":
      return [
        // … (identique à ta version)
      ];

    default:
      return [];
  }
}
