// 使用原始 standard2 文件为已导入试题包重建稳定题序；默认只校验，传入 --apply 才写库。
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "../src/services/prisma.js";
import {
  parseQuestionBankDocumentText,
  validateQuestionBankDocument,
} from "../src/services/questionBankDocument.js";

interface BackfillOptions {
  batchId: string;
  filePath: string;
  apply: boolean;
}

// 参数支持 --name value 和 --name=value 两种形式，便于 Windows 路径直接传入。
function optionValue(name: string): string {
  const args = process.argv.slice(2);
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1).trim();
  const index = args.indexOf(name);
  return index >= 0 ? String(args[index + 1] || "").trim() : "";
}

// 回填必须明确指定批次和原文件，避免依赖标题或文件名误匹配其他上传包。
function parseOptions(): BackfillOptions {
  const batchId = optionValue("--batch-id");
  const filePath = optionValue("--file");
  if (!batchId || !filePath) {
    throw new Error(
      "用法：npm run backfill:question-bank-order -- --batch-id <批次ID> --file <standard2.json> [--apply]",
    );
  }
  return {
    batchId,
    filePath: resolve(filePath),
    apply: process.argv.includes("--apply"),
  };
}

// 文件 code 与数据库题目必须一一对应，任何缺失或多余都在写库前中止。
async function main(): Promise<void> {
  const options = parseOptions();
  const content = await readFile(options.filePath, "utf8");
  const document = validateQuestionBankDocument(
    parseQuestionBankDocumentText(content),
  );
  const batch = await prisma.questionImportBatch.findUnique({
    where: { id: options.batchId },
    select: {
      id: true,
      title: true,
      questions: {
        where: { paperId: null },
        select: {
          id: true,
          uniqueCode: true,
          sourceQuestionCode: true,
          number: true,
        },
      },
    },
  });
  if (!batch) throw new Error(`上传包不存在：${options.batchId}`);

  const databaseByCode = new Map<string, (typeof batch.questions)[number]>();
  for (const question of batch.questions) {
    const code = question.sourceQuestionCode || question.uniqueCode;
    if (databaseByCode.has(code))
      throw new Error(`数据库批次存在重复题目 code：${code}`);
    databaseByCode.set(code, question);
  }
  const documentCodes = new Set(
    document.questions.map((question) => question.code),
  );
  const missingCodes = document.questions
    .map((question) => question.code)
    .filter((code) => !databaseByCode.has(code));
  const extraCodes = [...databaseByCode.keys()].filter(
    (code) => !documentCodes.has(code),
  );
  if (
    document.questions.length !== batch.questions.length ||
    missingCodes.length ||
    extraCodes.length
  ) {
    throw new Error(
      `文件与数据库题目不一致：文件 ${document.questions.length} 题，数据库 ${batch.questions.length} 题，` +
        `缺失 [${missingCodes.join(", ")}]，多余 [${extraCodes.join(", ")}]`,
    );
  }

  const orderedQuestions = document.questions.map((question, index) => ({
    id: databaseByCode.get(question.code)!.id,
    code: question.code,
    number: index + 1,
  }));
  console.log(
    JSON.stringify(
      {
        mode: options.apply ? "apply" : "dry-run",
        batchId: batch.id,
        batchTitle: batch.title,
        filePath: options.filePath,
        questionCount: orderedQuestions.length,
        firstQuestion: orderedQuestions[0],
        lastQuestion: orderedQuestions.at(-1),
      },
      null,
      2,
    ),
  );
  if (!options.apply) return;

  await prisma.$transaction(
    orderedQuestions.map((question) =>
      prisma.question.update({
        where: { id: question.id },
        data: { number: question.number },
      }),
    ),
  );
  console.log(
    `已按 standard2 原始数组顺序重建 ${orderedQuestions.length} 道题的题序`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
