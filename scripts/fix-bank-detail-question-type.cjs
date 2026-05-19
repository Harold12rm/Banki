const fs = require("fs");

const file = "app/banks/[bankId]/page.tsx";

let content = fs.readFileSync(file, "utf8");

content = content.replace(
  "const questionIds = questions.map((question) => question.id);",
  "const questionIds = questions.map((question: { id: string }) => question.id);"
);

fs.writeFileSync(file, content, "utf8");

console.log("Corregido:", file);
