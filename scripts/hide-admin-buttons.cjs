const fs = require("fs");

function updateFile(file, updater) {
  if (!fs.existsSync(file)) {
    console.log("No existe:", file);
    return;
  }

  let content = fs.readFileSync(file, "utf8");
  const original = content;

  content = updater(content);

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Actualizado:", file);
  } else {
    console.log("Sin cambios:", file);
  }
}

function ensureImport(content) {
  const importLine = 'import { getCurrentProfile } from "@/lib/auth";';

  if (content.includes(importLine)) {
    return content;
  }

  const importMatch = content.match(/^(import .+?;\r?\n)+/m);

  if (importMatch) {
    return content.replace(importMatch[0], importMatch[0] + importLine + "\n");
  }

  return importLine + "\n" + content;
}

function insertIsAdmin(content) {
  if (content.includes("const isAdmin = profile?.role === \"admin\";")) {
    return content;
  }

  const returnIndex = content.indexOf("return (");

  if (returnIndex === -1) {
    console.log("No encontré return (");
    return content;
  }

  return (
    content.slice(0, returnIndex) +
    'const profile = await getCurrentProfile();\n  const isAdmin = profile?.role === "admin";\n\n  ' +
    content.slice(returnIndex)
  );
}

function hideAdminLinksBanksList(content) {
  // Crear banco principal
  content = content.replace(
    /(\s*)<Link\s+href="\/banks\/new"\s+className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\s*>\s*Crear banco\s*<\/Link>/g,
    '$1{isAdmin && (\n$1  <Link\n$1    href="/banks/new"\n$1    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\n$1  >\n$1    Crear banco\n$1  </Link>\n$1)}'
  );

  // Editar banco
  content = content.replace(
    /(\s*)<Link\s+href=\{`\/banks\/\$\{bank\.id\}\/edit`\}\s+className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\s*>\s*Editar banco\s*<\/Link>/g,
    '$1{isAdmin && (\n$1  <Link\n$1    href={`/banks/${bank.id}/edit`}\n$1    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\n$1  >\n$1    Editar banco\n$1  </Link>\n$1)}'
  );

  // Form eliminar banco
  content = content.replace(
    /(\s*)<form action=\{deleteBank\.bind\(null, bank\.id\)\}>\s*<ConfirmSubmitButton([\s\S]*?)Eliminar banco\s*<\/ConfirmSubmitButton>\s*<\/form>/g,
    '$1{isAdmin && (\n$1  <form action={deleteBank.bind(null, bank.id)}>\n$1    <ConfirmSubmitButton$2Eliminar banco\n$1    </ConfirmSubmitButton>\n$1  </form>\n$1)}'
  );

  // Añadir pregunta link
  content = content.replace(
    /(\s*)<Link\s+href=\{`\/banks\/\$\{bank\.id\}\/questions\/new`\}\s+className="text-sm font-semibold text-slate-700 hover:text-slate-950"\s*>\s*Añadir pregunta ?\s*<\/Link>/g,
    '$1{isAdmin && (\n$1  <Link\n$1    href={`/banks/${bank.id}/questions/new`}\n$1    className="text-sm font-semibold text-slate-700 hover:text-slate-950"\n$1  >\n$1    Añadir pregunta ?\n$1  </Link>\n$1)}'
  );

  return content;
}

function hideAdminLinksBankDetail(content) {
  // Añadir pregunta botón grande
  content = content.replace(
    /(\s*)<Link\s+href=\{`\/banks\/\$\{bank\.id\}\/questions\/new`\}\s+className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\s*>\s*Añadir pregunta\s*<\/Link>/g,
    '$1{isAdmin && (\n$1  <Link\n$1    href={`/banks/${bank.id}/questions/new`}\n$1    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\n$1  >\n$1    Añadir pregunta\n$1  </Link>\n$1)}'
  );

  // Editar banco
  content = content.replace(
    /(\s*)<Link\s+href=\{`\/banks\/\$\{bank\.id\}\/edit`\}\s+className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\s*>\s*Editar banco\s*<\/Link>/g,
    '$1{isAdmin && (\n$1  <Link\n$1    href={`/banks/${bank.id}/edit`}\n$1    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\n$1  >\n$1    Editar banco\n$1  </Link>\n$1)}'
  );

  // Eliminar banco
  content = content.replace(
    /(\s*)<form action=\{deleteBank\.bind\(null, bank\.id\)\}>\s*<ConfirmSubmitButton([\s\S]*?)Eliminar banco\s*<\/ConfirmSubmitButton>\s*<\/form>/g,
    '$1{isAdmin && (\n$1  <form action={deleteBank.bind(null, bank.id)}>\n$1    <ConfirmSubmitButton$2Eliminar banco\n$1    </ConfirmSubmitButton>\n$1  </form>\n$1)}'
  );

  // Editar pregunta
  content = content.replace(
    /(\s*)<Link\s+href=\{`\/banks\/\$\{bank\.id\}\/questions\/\$\{question\.id\}\/edit`\}\s+className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\s*>\s*Editar pregunta\s*<\/Link>/g,
    '$1{isAdmin && (\n$1  <Link\n$1    href={`/banks/${bank.id}/questions/${question.id}/edit`}\n$1    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"\n$1  >\n$1    Editar pregunta\n$1  </Link>\n$1)}'
  );

  return content;
}

updateFile("app/banks/page.tsx", (content) => {
  content = ensureImport(content);
  content = insertIsAdmin(content);
  content = hideAdminLinksBanksList(content);
  return content;
});

updateFile("app/banks/[bankId]/page.tsx", (content) => {
  content = ensureImport(content);
  content = insertIsAdmin(content);
  content = hideAdminLinksBankDetail(content);
  return content;
});

console.log("");
console.log("Listo. Ahora verifica visualmente /banks y /banks/[bankId].");
