"use client";

export interface GeneratedFile {
  file: string;
  content: string;
}

export function generateProjectArchitecture(type: string): GeneratedFile[] {
  switch (type) {
    // -----------------------------------------------------------------------
    // Web — Frameworks frontend
    // -----------------------------------------------------------------------
    case "nextjs":
      return [
        {
          file: "src/app/layout.tsx",
          content: `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}`,
        },
        {
          file: "src/app/page.tsx",
          content: `export default function Home() {
  return <div>Bienvenue — Architecture Next.js</div>;
}`,
        },
        {
          file: "src/components/ui/Button.tsx",
          content: `export default function Button({ children }: { children: React.ReactNode }) {
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
  return <h1>Bienvenue — Architecture React</h1>;
}`,
        },
        {
          file: "src/components/Button.tsx",
          content: `export default function Button({ children }: { children: React.ReactNode }) {
  return <button className="btn">{children}</button>;
}`,
        },
      ];

    case "vue":
      return [
        {
          file: "src/App.vue",
          content: `<template>
  <div id="app">
    <h1>Bienvenue — Architecture Vue</h1>
    <router-view />
  </div>
</template>

<script setup lang="ts">
// Point d'entrée de l'application Vue
</script>`,
        },
        {
          file: "src/components/BaseButton.vue",
          content: `<template>
  <button class="btn">
    <slot />
  </button>
</template>

<script setup lang="ts">
// Composant bouton réutilisable
</script>`,
        },
        {
          file: "src/main.ts",
          content: `import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");`,
        },
      ];

    case "svelte":
      return [
        {
          file: "src/App.svelte",
          content: `<script lang="ts">
  let name = "Svelte";
</script>

<main>
  <h1>Bienvenue — Architecture {name}</h1>
</main>

<style>
  main { text-align: center; padding: 2rem; }
</style>`,
        },
        {
          file: "src/lib/components/Button.svelte",
          content: `<button class="btn">
  <slot />
</button>

<style>
  .btn { padding: 0.5rem 1rem; background: #4f46e5; color: white; border-radius: 0.5rem; }
</style>`,
        },
      ];

    case "astro":
      return [
        {
          file: "src/pages/index.astro",
          content: `---
// Page d'accueil Astro
const title = "Bienvenue — Architecture Astro";
---

<html lang="fr">
  <head><title>{title}</title></head>
  <body>
    <h1>{title}</h1>
  </body>
</html>`,
        },
        {
          file: "src/components/Card.astro",
          content: `---
export interface Props { title: string; }
const { title } = Astro.props;
---

<div class="card">
  <h2>{title}</h2>
  <slot />
</div>`,
        },
      ];

    // -----------------------------------------------------------------------
    // Mobile
    // -----------------------------------------------------------------------
    case "react-native":
    case "expo":
      return [
        {
          file: "App.tsx",
          content: `import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Bienvenue — Application Mobile</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});`,
        },
        {
          file: "src/components/Button.tsx",
          content: `import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props { title: string; onPress: () => void; }

export default function Button({ title, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: "#4f46e5", padding: 12, borderRadius: 8 },
  text: { color: "#fff", textAlign: "center" },
});`,
        },
      ];

    case "swiftui":
      return [
        {
          file: "ContentView.swift",
          content: `import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Bienvenue — Application SwiftUI")
                .font(.title)
                .padding()
        }
    }
}

#Preview {
    ContentView()
}`,
        },
        {
          file: "App.swift",
          content: `import SwiftUI

@main
struct MainApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`,
        },
      ];

    case "kotlin":
      return [
        {
          file: "MainActivity.kt",
          content: `package com.example.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { Greeting() }
    }
}

@Composable
fun Greeting() {
    Text(text = "Bienvenue — Application Kotlin")
}`,
        },
      ];

    // -----------------------------------------------------------------------
    // Desktop
    // -----------------------------------------------------------------------
    case "electron":
      return [
        {
          file: "main.js",
          content: `const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({ width: 1024, height: 768 });
  win.loadFile("index.html");
}

app.whenReady().then(createWindow);`,
        },
        {
          file: "index.html",
          content: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Application Electron</title></head>
<body><h1>Bienvenue — Application Desktop Electron</h1></body>
</html>`,
        },
      ];

    case "tauri":
      return [
        {
          file: "src/main.ts",
          content: `import { invoke } from "@tauri-apps/api/core";

document.querySelector("#app")!.innerHTML = \`
  <h1>Bienvenue — Application Desktop Tauri</h1>
  <button id="greet">Saluer</button>
  <p id="result"></p>
\`;

document.querySelector("#greet")?.addEventListener("click", async () => {
  const result = await invoke<string>("greet", { name: "Prestige Build" });
  document.querySelector("#result")!.textContent = result;
});`,
        },
        {
          file: "src-tauri/src/main.rs",
          content: `#[tauri::command]
fn greet(name: &str) -> String {
    format!("Bonjour, {} !", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("Erreur lors du lancement de l'application Tauri");
}`,
        },
      ];

    // -----------------------------------------------------------------------
    // Backend
    // -----------------------------------------------------------------------
    case "node":
      return [
        {
          file: "src/index.js",
          content: `console.log("Backend Node.js prêt");`,
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
  res.send("API Express en cours d'exécution");
});

app.listen(3000, () => console.log("Serveur démarré sur le port 3000"));`,
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

app.listen(3000, () => console.log("API REST en cours d'exécution"));`,
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
    res.json([{ id: 1, name: "Jean Dupont" }]);
  },
};`,
        },
      ];

    case "python":
    case "fastapi":
      return [
        {
          file: "main.py",
          content: `from fastapi import FastAPI

app = FastAPI(title="API Prestige Build")

@app.get("/")
def root():
    return {"message": "Bienvenue — API FastAPI"}

@app.get("/health")
def health():
    return {"status": "ok"}`,
        },
        {
          file: "requirements.txt",
          content: `fastapi>=0.100.0
uvicorn>=0.23.0`,
        },
        {
          file: "src/models.py",
          content: `from pydantic import BaseModel

class Item(BaseModel):
    id: int
    name: str
    description: str | None = None`,
        },
      ];

    case "go":
      return [
        {
          file: "main.go",
          content: `package main

import (
\t"fmt"
\t"net/http"
)

func main() {
\thttp.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
\t\tfmt.Fprintf(w, "Bienvenue — API Go")
\t})
\thttp.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
\t\tfmt.Fprintf(w, "ok")
\t})
\tfmt.Println("Serveur démarré sur :8080")
\thttp.ListenAndServe(":8080", nil)
}`,
        },
        {
          file: "go.mod",
          content: `module prestige-app

go 1.21`,
        },
      ];

    // -----------------------------------------------------------------------
    // Applications complètes
    // -----------------------------------------------------------------------
    case "saas":
      return [
        {
          file: "src/app/page.tsx",
          content: `export default function Dashboard() {
  return <div>Bienvenue sur votre tableau de bord SaaS</div>;
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
          content: `export default function Card({ children }: { children: React.ReactNode }) {
  return <div className="p-4 bg-[#1A1A1A] rounded-lg">{children}</div>;
}`,
        },
      ];

    case "saas-advanced":
      return [
        {
          file: "src/app/page.tsx",
          content: `export default function Dashboard() {
  return <div>Tableau de bord SaaS Avancé</div>;
}`,
        },
        {
          file: "src/app/api/auth/login/route.ts",
          content: `export async function POST(req: Request) {
  return Response.json({ success: true });
}`,
        },
        {
          file: "src/app/api/billing/route.ts",
          content: `export async function GET() {
  return Response.json({ plan: "free", credits: 100 });
}`,
        },
        {
          file: "src/components/ui/Card.tsx",
          content: `export default function Card({ children }: { children: React.ReactNode }) {
  return <div className="p-4 bg-[#1A1A1A] rounded-lg">{children}</div>;
}`,
        },
      ];

    case "dashboard":
      return [
        {
          file: "src/app/page.tsx",
          content: `export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-[#1A1A1A] rounded-lg">
          <p className="text-sm text-gray-400">Utilisateurs</p>
          <p className="text-3xl font-bold">1 234</p>
        </div>
        <div className="p-4 bg-[#1A1A1A] rounded-lg">
          <p className="text-sm text-gray-400">Revenus</p>
          <p className="text-3xl font-bold">€12 345</p>
        </div>
        <div className="p-4 bg-[#1A1A1A] rounded-lg">
          <p className="text-sm text-gray-400">Projets</p>
          <p className="text-3xl font-bold">56</p>
        </div>
      </div>
    </div>
  );
}`,
        },
        {
          file: "src/components/dashboard/StatCard.tsx",
          content: `interface Props { label: string; value: string; }

export default function StatCard({ label, value }: Props) {
  return (
    <div className="p-4 bg-[#1A1A1A] rounded-lg">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}`,
        },
      ];

    case "ecommerce":
      return [
        {
          file: "src/app/page.tsx",
          content: `export default function StorePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Boutique</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-[#1A1A1A] rounded-lg">
          <h2 className="font-bold">Produit 1</h2>
          <p className="text-gray-400">€29.99</p>
        </div>
      </div>
    </div>
  );
}`,
        },
        {
          file: "src/components/store/ProductCard.tsx",
          content: `interface Props { name: string; price: number; image?: string; }

export default function ProductCard({ name, price }: Props) {
  return (
    <div className="p-4 bg-[#1A1A1A] rounded-lg">
      <h2 className="font-bold">{name}</h2>
      <p className="text-gray-400">€{price.toFixed(2)}</p>
      <button className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded">
        Ajouter au panier
      </button>
    </div>
  );
}`,
        },
        {
          file: "src/app/api/products/route.ts",
          content: `export async function GET() {
  return Response.json([
    { id: 1, name: "Produit 1", price: 29.99 },
    { id: 2, name: "Produit 2", price: 49.99 },
  ]);
}`,
        },
      ];

    case "game":
      return [
        {
          file: "src/index.html",
          content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Jeu Prestige Build</title>
  <style>
    body { margin: 0; overflow: hidden; background: #111; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script src="game.js"></script>
</body>
</html>`,
        },
        {
          file: "src/game.js",
          content: `const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let x = canvas.width / 2;
let y = canvas.height / 2;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#4f46e5";
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  requestAnimationFrame(draw);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") y -= 5;
  if (e.key === "ArrowDown") y += 5;
  if (e.key === "ArrowLeft") x -= 5;
  if (e.key === "ArrowRight") x += 5;
});

draw();`,
        },
      ];

    case "template":
      return [
        {
          file: "src/index.html",
          content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template Prestige Build</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header><h1>Mon Projet</h1></header>
  <main><p>Commencez à construire ici.</p></main>
  <script src="app.js"></script>
</body>
</html>`,
        },
        {
          file: "src/styles.css",
          content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; background: #111; color: #eee; padding: 2rem; }
header { margin-bottom: 2rem; }`,
        },
        {
          file: "src/app.js",
          content: `// Point d'entrée JavaScript
console.log("Template prêt");`,
        },
      ];

    default:
      return [];
  }
}
