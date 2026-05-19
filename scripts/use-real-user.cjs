const fs = require("fs");
const path = require("path");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
  console.log("Actualizado:", file);
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content;

  const importRegex = /^(import .+?;\r?\n)+/m;
  const match = content.match(importRegex);

  if (match) {
    return content.replace(importRegex, match[0] + importLine + "\n");
  }

  return importLine + "\n" + content;
}

function ensureRedirectImport(content) {
  if (content.includes('from "next/navigation"')) {
    content = content.replace(
      /import\s+\{\s*notFound\s*\}\s+from\s+"next\/navigation";/,
      'import { notFound, redirect } from "next/navigation";'
    );

    if (!content.includes("redirect")) {
      content = content.replace(
        /import\s+\{([^}]+)\}\s+from\s+"next\/navigation";/,
        (full, inside) => {
          const names = inside.split(",").map((x) => x.trim());
          if (!names.includes("redirect")) names.push("redirect");
          return `import { ${names.join(", ")} } from "next/navigation";`;
        }
      );
    }

    return content;
  }

  return 'import { redirect } from "next/navigation";\n' + content;
}

function replaceDemoUser(content) {
  const block = `const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;`;

  return content.replace(
    /const userId = "demo-user";/g,
    block
  );
}

function replaceDemoUserInAction(content) {
  const block = `const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para guardar tu progreso.");
  }

  const userId = user.id;`;

  return content.replace(
    /const userId = "demo-user";/g,
    block
  );
}

function updateFile(file, updater) {
  if (!fs.existsSync(file)) {
    console.log("No existe, omitido:", file);
    return;
  }

  const original = read(file);
  const updated = updater(original);

  if (original !== updated) {
    write(file, updated);
  } else {
    console.log("Sin cambios:", file);
  }
}

const supabaseDir = path.join("lib", "supabase");
fs.mkdirSync(supabaseDir, { recursive: true });

const serverFile = path.join(supabaseDir, "server.ts");
if (!fs.existsSync(serverFile)) {
  write(serverFile, `import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Puede ocurrir en Server Components.
          }
        },
      },
    }
  );
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
`);
}

const clientFile = path.join(supabaseDir, "client.ts");
if (!fs.existsSync(clientFile)) {
  write(clientFile, `import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`);
}

updateFile("app/practice/actions.ts", (content) => {
  content = ensureImport(
    content,
    'import { getCurrentUser } from "@/lib/supabase/server";'
  );

  content = replaceDemoUserInAction(content);

  return content;
});

const serverPages = [
  "app/stats/page.tsx",
  "app/review/page.tsx",
  "app/review/session/page.tsx",
  "app/practice/[bankId]/page.tsx",
  "app/practice/[bankId]/start/page.tsx",
];

for (const file of serverPages) {
  updateFile(file, (content) => {
    content = ensureRedirectImport(content);

    content = ensureImport(
      content,
      'import { getCurrentUser } from "@/lib/supabase/server";'
    );

    content = replaceDemoUser(content);

    return content;
  });
}

console.log("");
console.log("Buscando demo-user restante...");

const searchFiles = [
  ...serverPages,
  "app/practice/actions.ts",
];

let found = false;

for (const file of searchFiles) {
  if (!fs.existsSync(file)) continue;

  const content = read(file);

  if (content.includes("demo-user")) {
    found = true;
    console.log("Todavía contiene demo-user:", file);
  }
}

if (!found) {
  console.log("Listo. No quedan referencias demo-user en los archivos principales.");
}

console.log("");
console.log("Ahora ejecuta:");
console.log("npm run dev");
