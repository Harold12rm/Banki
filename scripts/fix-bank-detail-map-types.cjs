const fs = require("fs");

const file = "app/banks/[bankId]/page.tsx";

let content = fs.readFileSync(file, "utf8");

content = content.replace(
  "allQuestions.map((question) => question.topic)",
  "allQuestions.map((question: { topic: string }) => question.topic)"
);

content = content.replace(
  "{questions.map((question, index) => {",
  "{questions.map((question: { id: string; prompt: string; topic: string; subtopic: string | null; difficulty: string; explanation: string; options: { id: string; text: string; isCorrect: boolean }[] }, index: number) => {"
);

fs.writeFileSync(file, content, "utf8");

console.log("Tipos corregidos en:", file);
