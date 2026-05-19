const fs = require("fs");

const file = "app/missed/page.tsx";

if (!fs.existsSync(file)) {
  console.log("No existe:", file);
  process.exit(0);
}

let content = fs.readFileSync(file, "utf8");

if (!content.includes('getCurrentUser')) {
  content = content.replace(
    /^(import .+?;\r?\n)+/m,
    (imports) => imports + 'import { redirect } from "next/navigation";\nimport { getCurrentUser } from "@/lib/supabase/server";\n'
  );
}

content = content.replace(
  /userId:\s*"demo-user"/g,
  `userId: userId`
);

content = content.replace(
  /export default async function ([A-Za-z0-9_]+)\(\) \{/,
  `export default async function $1() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
`
);

fs.writeFileSync(file, content, "utf8");
console.log("Actualizado:", file);
