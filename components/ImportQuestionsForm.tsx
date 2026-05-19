"use client";

import Papa from "papaparse";
import { useMemo, useState } from "react";
import { importQuestions } from "@/app/import/actions";

type CsvRow = Record<string, string | undefined>;

type BankOption = {
  id: string;
  name: string;
  subject: string | null;
};

type ImportQuestionsFormProps = {
  banks: BankOption[];
};

type RowIssue = {
  rowNumber: number;
  message: string;
};

function normalizeKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function getValue(row: CsvRow, possibleKeys: string[]) {
  for (const key of Object.keys(row)) {
    const normalized = normalizeKey(key);

    if (possibleKeys.includes(normalized)) {
      return String(row[key] || "").trim();
    }
  }

  return "";
}

function getPreviewRow(row: CsvRow) {
  return {
    bank: getValue(row, ["bank"]),
    prompt: getValue(row, ["prompt"]),
    option1: getValue(row, ["option1"]),
    option2: getValue(row, ["option2"]),
    option3: getValue(row, ["option3"]),
    option4: getValue(row, ["option4"]),
    option5: getValue(row, ["option5"]),
    correctOption: getValue(row, ["correctoption"]),
    explanation: getValue(row, ["explanation"]),
    topic: getValue(row, ["topic"]),
    subtopic: getValue(row, ["subtopic"]),
    difficulty: getValue(row, ["difficulty"]),
  };
}

function parseCorrectOption(value: string) {
  const clean = value.trim().toUpperCase();

  const letterMap: Record<string, number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
  };

  if (letterMap[clean]) {
    return letterMap[clean];
  }

  const number = Number(clean);

  return Number.isInteger(number) ? number : 0;
}

function validateRow(row: CsvRow, index: number, targetBankId: string): RowIssue[] {
  const preview = getPreviewRow(row);
  const issues: RowIssue[] = [];

  const rowNumber = index + 2;

  const optionTexts = [
    preview.option1,
    preview.option2,
    preview.option3,
    preview.option4,
    preview.option5,
  ].filter(Boolean);

  const correctOption = parseCorrectOption(preview.correctOption);

  if (!targetBankId && !preview.bank) {
    issues.push({
      rowNumber,
      message: "Falta BANK. Puedes llenar la columna BANK o elegir un banco de destino.",
    });
  }

  if (!preview.prompt) {
    issues.push({
      rowNumber,
      message: "Falta PROMPT, el texto de la pregunta.",
    });
  }

  if (optionTexts.length < 2) {
    issues.push({
      rowNumber,
      message: "Debe tener al menos 2 alternativas.",
    });
  }

  if (!preview.correctOption) {
    issues.push({
      rowNumber,
      message: "Falta CORRECT OPTION.",
    });
  } else if (
    !Number.isInteger(correctOption) ||
    correctOption < 1 ||
    correctOption > optionTexts.length
  ) {
    issues.push({
      rowNumber,
      message:
        "CORRECT OPTION no coincide con las alternativas disponibles. Usa A-E o 1-5.",
    });
  }

  if (!preview.explanation) {
    issues.push({
      rowNumber,
      message: "Falta EXPLANATION, la explicación de la respuesta.",
    });
  }

  if (!preview.topic) {
    issues.push({
      rowNumber,
      message: "Falta TOPIC, el tema de la pregunta.",
    });
  }

  const difficulty = preview.difficulty.trim().toLowerCase();

  if (
    difficulty &&
    !["easy", "medium", "hard", "facil", "fácil", "media", "medio", "dificil", "difícil"].includes(
      difficulty
    )
  ) {
    issues.push({
      rowNumber,
      message:
        "DIFFICULTY no reconocida. Usa easy, medium, hard, fácil, media o difícil.",
    });
  }

  return issues;
}

export default function ImportQuestionsForm({
  banks,
}: ImportQuestionsFormProps) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [targetBankId, setTargetBankId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const previewRows = useMemo(() => {
    return rows.slice(0, 5).map(getPreviewRow);
  }, [rows]);

  const detectedBanks = useMemo(() => {
    const csvBanks = rows
      .map((row) => getValue(row, ["bank"]))
      .filter(Boolean);

    return Array.from(new Set(csvBanks));
  }, [rows]);

  const selectedBank = banks.find((bank) => bank.id === targetBankId);

  const rowIssues = useMemo(() => {
    return rows.flatMap((row, index) => validateRow(row, index, targetBankId));
  }, [rows, targetBankId]);

  const invalidRowNumbers = useMemo(() => {
    return Array.from(new Set(rowIssues.map((issue) => issue.rowNumber)));
  }, [rowIssues]);

  const validRowsCount = rows.length - invalidRowNumbers.length;
  const invalidRowsCount = invalidRowNumbers.length;
  const canImport = rows.length > 0 && rowIssues.length === 0;

  function handleFile(file: File) {
    setStatus("");
    setError("");
    setRows([]);
    setColumns([]);
    setFileName(file.name);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data.filter((row) =>
          Object.values(row).some((value) => String(value || "").trim())
        );

        setRows(data);
        setColumns(result.meta.fields || []);
        setStatus(`${data.length} filas detectadas.`);
      },
      error: () => {
        setError("No se pudo leer el archivo CSV.");
      },
    });
  }

  async function submit() {
    if (!canImport) {
      setError("Corrige las filas inválidas antes de importar.");
      return;
    }

    try {
      setStatus("Importando preguntas...");
      setError("");

      const result = await importQuestions(rows, targetBankId || undefined);

      setStatus(
        `${result.createdQuestions} preguntas importadas. ${result.duplicatedRows} duplicadas omitidas. ${result.skippedRows} filas inválidas omitidas.`
      );

      setRows([]);
      setColumns([]);
      setFileName("");
      setTargetBankId("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error al importar."
      );
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Instrucciones para importar
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoCard
            title="1. Usa una fila por pregunta"
            description="Cada fila debe tener pregunta, alternativas, respuesta correcta, explicación y tema."
          />

          <InfoCard
            title="2. Elige banco de destino"
            description="Puedes usar la columna BANK del CSV o seleccionar un banco ya creado para importar todo ahí."
          />

          <InfoCard
            title="3. correctOption acepta letras o números"
            description="A equivale a option1, B a option2, C a option3. También puedes usar 1, 2, 3, 4 o 5."
          />

          <InfoCard
            title="4. Banki revisa errores antes de importar"
            description="Si falta una columna importante o hay una respuesta correcta inválida, Banki te avisará antes de guardar."
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Encabezados recomendados
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            BANK, PROMPT, OPTION 1, OPTION 2, OPTION 3, OPTION 4, OPTION 5,
            CORRECT OPTION, EXPLANATION, TOPIC, SUBTOPIC, DIFFICULTY
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            También se aceptan variantes como bank, prompt, option1, option2,
            correctOption, explanation, topic, subtopic y difficulty.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Banco de destino
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          Puedes usar la columna <strong>BANK</strong> del CSV o forzar que
          todas las preguntas vayan a un banco existente.
        </p>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Importar en
          </label>

          <select
            value={targetBankId}
            onChange={(event) => setTargetBankId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950"
          >
            <option value="">Usar la columna BANK del CSV</option>

            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
                {bank.subject ? ` · ${bank.subject}` : ""}
              </option>
            ))}
          </select>

          {targetBankId ? (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Banco seleccionado: {selectedBank?.name}
              </p>

              <p className="mt-1 text-sm text-blue-800">
                Todas las preguntas se importarán en este banco. La columna{" "}
                <strong>BANK</strong> del CSV será ignorada.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                Banki usará la columna <strong>BANK</strong> para decidir en qué
                banco colocar cada pregunta.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-3 block text-sm font-semibold text-slate-800">
            Archivo CSV
          </label>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400 hover:bg-white">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  handleFile(file);
                }
              }}
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">
              📄
            </div>

            <p className="mt-4 text-base font-bold text-slate-950">
              Selecciona tu archivo CSV
            </p>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Sube un archivo exportado desde Google Sheets o Excel. Banki
              revisará las columnas y mostrará una vista previa antes de importar.
            </p>

            <span className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition group-hover:bg-slate-50">
              Elegir archivo
            </span>
          </label>
        </div>

        {fileName && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">
              Archivo cargado correctamente
            </p>

            <p className="mt-1 text-sm text-green-800">{fileName}</p>

            <p className="mt-2 text-sm text-green-800">
              {targetBankId ? (
                <>
                  Se importará en el banco seleccionado:{" "}
                  <strong>{selectedBank?.name}</strong>.
                </>
              ) : (
                <>
                  El banco se tomará de la columna <strong>BANK</strong>, no del
                  nombre del archivo.
                </>
              )}
            </p>
          </div>
        )}

        {columns.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Columnas detectadas
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {columns.map((column) => (
                <span
                  key={column}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  {column}
                </span>
              ))}
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <StatBox title="Filas detectadas" value={rows.length} />
            <StatBox title="Filas válidas" value={validRowsCount} />
            <StatBox title="Filas con errores" value={invalidRowsCount} />
          </div>
        )}

        {rowIssues.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Errores encontrados antes de importar
            </p>

            <p className="mt-1 text-sm text-red-800">
              Corrige estas filas en tu CSV o selecciona un banco de destino si
              el problema es la columna BANK.
            </p>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-2">
              {rowIssues.slice(0, 30).map((issue, index) => (
                <div
                  key={`${issue.rowNumber}-${index}`}
                  className="rounded-xl bg-white p-3 text-sm text-red-800 ring-1 ring-red-100"
                >
                  <strong>Fila {issue.rowNumber}:</strong> {issue.message}
                </div>
              ))}
            </div>

            {rowIssues.length > 30 && (
              <p className="mt-3 text-sm text-red-800">
                Hay {rowIssues.length - 30} errores adicionales no mostrados.
              </p>
            )}
          </div>
        )}

        {!targetBankId && detectedBanks.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Bancos detectados en el CSV
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {detectedBanks.map((bank) => (
                <span
                  key={bank}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200"
                >
                  {bank}
                </span>
              ))}
            </div>

            {detectedBanks.length > 1 && (
              <p className="mt-3 text-sm text-blue-800">
                Hay más de un banco en el archivo. Esto creará o actualizará
                preguntas en bancos diferentes.
              </p>
            )}
          </div>
        )}

        {targetBankId && rows.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Importación dirigida
            </p>

            <p className="mt-1 text-sm text-blue-800">
              Las {rows.length} filas se intentarán importar en{" "}
              <strong>{selectedBank?.name}</strong>. Si el CSV tiene columna
              BANK, será ignorada.
            </p>
          </div>
        )}

        {previewRows.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">
              Vista previa de las primeras 5 filas
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-2 pr-4">Bank</th>
                    <th className="py-2 pr-4">Pregunta</th>
                    <th className="py-2 pr-4">Opción 1</th>
                    <th className="py-2 pr-4">Opción 2</th>
                    <th className="py-2 pr-4">Correcta</th>
                    <th className="py-2 pr-4">Tema</th>
                    <th className="py-2 pr-4">Dificultad</th>
                  </tr>
                </thead>

                <tbody>
                  {previewRows.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="max-w-[160px] py-2 pr-4 text-slate-700">
                        {targetBankId ? selectedBank?.name || "—" : row.bank || "—"}
                      </td>
                      <td className="max-w-[320px] py-2 pr-4 font-medium text-slate-950">
                        {row.prompt || "—"}
                      </td>
                      <td className="max-w-[220px] py-2 pr-4 text-slate-700">
                        {row.option1 || "—"}
                      </td>
                      <td className="max-w-[220px] py-2 pr-4 text-slate-700">
                        {row.option2 || "—"}
                      </td>
                      <td className="py-2 pr-4 font-semibold text-slate-950">
                        {row.correctOption || "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">
                        {row.topic || "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">
                        {row.difficulty || "medium"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!canImport}
          onClick={submit}
          className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rowIssues.length > 0
            ? "Corrige errores antes de importar"
            : "Importar preguntas"}
        </button>

        {status && (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
            {status}
          </p>
        )}

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}

function StatBox({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}