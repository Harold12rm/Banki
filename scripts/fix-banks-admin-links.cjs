const fs = require("fs");

const file = "app/banks/page.tsx";

let content = fs.readFileSync(file, "utf8");

if (!content.includes('import { getCurrentProfile } from "@/lib/auth";')) {
  content = content.replace(
    /^(import .+?;\r?\n)+/m,
    (imports) => imports + 'import { getCurrentProfile } from "@/lib/auth";\n'
  );
}

if (!content.includes('const isAdmin = profile?.role === "admin";')) {
  const returnIndex = content.indexOf("return (");

  content =
    content.slice(0, returnIndex) +
    'const profile = await getCurrentProfile();\n  const isAdmin = profile?.role === "admin";\n\n  ' +
    content.slice(returnIndex);
}

content = content.replace(
  /<Link\s+href=\{`\/banks\/\$\{bank\.id\}\/questions\/new`\}\s+className="text-sm font-semibold text-slate-700 hover:text-slate-950"\s*>\s*Añadir pregunta →\s*<\/Link>/g,
  `{isAdmin && (
                    <Link
                      href={\`/banks/\${bank.id}/questions/new\`}
                      className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                    >
                      Añadir pregunta →
                    </Link>
                  )}`
);

fs.writeFileSync(file, content, "utf8");
console.log("Actualizado:", file);
