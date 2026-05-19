const fs = require("fs");
const path = require("path");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = walk("app");

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  content = content.replace(
    /questions\.map\(\(question\) => question\.id\)/g,
    "questions.map((question: { id: string }) => question.id)"
  );

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Actualizado:", file);
  }
}
