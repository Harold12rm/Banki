const fs = require("fs");

const files = [
  "app/import/actions.ts",
  "app/banks/new/page.tsx",
  "app/banks/[bankId]/edit/page.tsx",
  "app/banks/[bankId]/questions/new/page.tsx",
  "app/banks/[bankId]/questions/[questionId]/edit/page.tsx",
];

function ensureImport(content) {
  if (content.includes('import { requireAdmin } from "@/lib/auth";')) {
    return content;
  }

  const imports = content.match(/^(import .+?;\r?\n)+/m);

  if (imports) {
    return content.replace(
      imports[0],
      imports[0] + 'import { requireAdmin } from "@/lib/auth";\n'
    );
  }

  return 'import { requireAdmin } from "@/lib/auth";\n' + content;
}

function protectActions(content) {
  const actionRegex =
    /(async function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{\s*\r?\n\s*"use server";)/g;

  return content.replace(actionRegex, (match) => {
    if (match.includes("await requireAdmin();")) {
      return match;
    }

    return match + "\n\n  await requireAdmin();";
  });
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("No existe:", file);
    continue;
  }

  let content = fs.readFileSync(file, "utf8");

  content = ensureImport(content);
  content = protectActions(content);

  fs.writeFileSync(file, content, "utf8");
  console.log("Protegido:", file);
}
