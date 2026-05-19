const fs = require("fs");

const files = [
  "app/banks/new/page.tsx",
  "app/banks/[bankId]/edit/page.tsx",
  "app/banks/[bankId]/questions/new/page.tsx",
  "app/banks/[bankId]/questions/[questionId]/edit/page.tsx",
];

function ensureImport(content) {
  if (content.includes('import { requireAdmin } from "@/lib/auth";')) {
    return content;
  }

  const match = content.match(/^(import .+?;\r?\n)+/m);

  if (match) {
    return content.replace(
      match[0],
      match[0] + 'import { requireAdmin } from "@/lib/auth";\n'
    );
  }

  return 'import { requireAdmin } from "@/lib/auth";\n' + content;
}

function makeDefaultAsync(content) {
  return content.replace(
    /export default function ([A-Za-z0-9_]+)\s*\(/,
    "export default async function $1("
  );
}

function insertRequireAdmin(content) {
  if (content.includes("await requireAdmin();")) {
    return content;
  }

  const index = content.indexOf("return (");

  if (index === -1) {
    console.log("No encontré return (, revisar manualmente.");
    return content;
  }

  return (
    content.slice(0, index) +
    "await requireAdmin();\n\n  " +
    content.slice(index)
  );
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("No existe:", file);
    continue;
  }

  let content = fs.readFileSync(file, "utf8");

  content = ensureImport(content);
  content = makeDefaultAsync(content);
  content = insertRequireAdmin(content);

  fs.writeFileSync(file, content, "utf8");
  console.log("Actualizado:", file);
}
