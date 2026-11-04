// 修复本地 TMUA 年度真题原解析：限制题号、版本及原文，避免覆盖其他题目或并发修改。
import "dotenv/config";
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/services/prisma.js";

const options = new Set(process.argv.slice(2));
if (
  options.size !== 1 ||
  (!options.has("--dry-run") && !options.has("--apply"))
) {
  throw new Error("请指定 --dry-run 或 --apply");
}
const databaseUrl = new URL(process.env.DATABASE_URL || "");
if (!["localhost", "127.0.0.1"].includes(databaseUrl.hostname)) {
  throw new Error("此修复脚本仅可用于本地开发数据库");
}
const apply = options.has("--apply");
const descriptions = [
  {
    code: "TMUA_2023_P2_Q01",
    year: 2023,
    paper: "paper2",
    number: 1,
    answer: "H",
  },
  {
    code: "TMUA_2022_P1_Q13",
    year: 2022,
    paper: "paper1",
    number: 13,
    answer: "A",
  },
] as const;
const correctedChoices = String.raw`- A: 选项 \(x=2\sqrt{15}<36\)，代入通分后的原式得 \(12/(x-36)<0\)，不等于正数 \(3/11\)。
- B: 选项 \(x=4\sqrt{5}<36\)，原式左边 \(12/(x-36)<0\)，不等于正数 \(3/11\)。
- C: 选项 \(x=5\sqrt{2}<36\)，原式左边 \(12/(x-36)<0\)，不等于正数 \(3/11\)。
- D: 选项 \(x=\sqrt{58}<36\)，原式左边 \(12/(x-36)<0\)，不等于正数 \(3/11\)。
`;

// 根据唯一题源和原有错误片段精确变更解析；已修复或内容不符须明确区分。
function repair(
  code: string,
  raw: Prisma.JsonValue,
): { solution: Prisma.InputJsonObject; changed: boolean; fields: string[] } {
  assert(
    raw && typeof raw === "object" && !Array.isArray(raw),
    code + ": solution 格式不正确",
  );
  const original = raw as Record<string, unknown>;
  const next = structuredClone(original);
  const fields: string[] = [];
  if (code === "TMUA_2023_P2_Q01") {
    assert(typeof next.correctSolution === "string", code + ": 原解析缺失");
    if (!next.correctSolution.includes(correctedChoices)) {
      assert(
        next.correctSolution.includes(String.raw`选中 \(2/15\)`),
        code + ": 原 A 选项误文不匹配",
      );
      assert(
        next.correctSolution.includes(String.raw`选中 \(4/5\)`),
        code + ": 原 B 选项误文不匹配",
      );
      assert(
        next.correctSolution.includes(String.raw`小分数 \(5/2\)`),
        code + ": 原 C 选项误文不匹配",
      );
      assert(
        next.correctSolution.includes(String.raw`\(5/8\) 同量级`),
        code + ": 原 D 选项误文不匹配",
      );
      const matches = [
        ...next.correctSolution.matchAll(/^- A: [\s\S]*?(?=^- E: )/gm),
      ];
      assert.equal(matches.length, 1, code + ": A—D 解析区间不唯一");
      next.correctSolution = next.correctSolution.replace(
        matches[0]![0],
        correctedChoices,
      );
      fields.push("correctSolution");
    }
  } else {
    assert(typeof next.reviewGuidance === "string", code + ": 复习指导缺失");
    assert(typeof next.correctSolution === "string", code + ": 原解析缺失");
    const badTerm = String.raw`\sqrt{2t}`;
    const goodTerm = String.raw`\sqrt{2}t`;
    if (next.reviewGuidance.includes(badTerm)) {
      assert.equal(
        next.reviewGuidance.split(badTerm).length - 1,
        1,
        code + ": 错误项不唯一",
      );
      next.reviewGuidance = next.reviewGuidance.replace(badTerm, goodTerm);
    } else
      assert(
        next.reviewGuidance.includes(goodTerm),
        code + ": 原错误项与修复项均不存在",
      );
    // 各处使用标准上标分组，确保立方根对应的 1/6 在公式渲染时是完整指数。
    next.reviewGuidance = next.reviewGuidance.replaceAll("2^(1/6)", "2^{1/6}");
    next.correctSolution = next.correctSolution.replaceAll(
      "2^(1/6)",
      "2^{1/6}",
    );
    for (const field of ["reviewGuidance", "correctSolution"] as const) {
      if (next[field] !== original[field]) fields.push(field);
    }
  }
  return {
    solution: next as Prisma.InputJsonObject,
    changed: fields.length > 0,
    fields,
  };
}

// 在同一事务确认年度卷、选项与答案；采用更新时间保护任何并发人工修订。
async function main(): Promise<void> {
  const results = await prisma.$transaction(async (tx) => {
    const output = [];
    for (const item of descriptions) {
      const rows = await tx.question.findMany({
        where: {
          sourceQuestionCode: item.code,
          examType: "TMUA",
          moduleCode: item.paper,
          moduleQuestionNumber: item.number,
          paper: {
            examType: "TMUA",
            year: item.year,
            paperType: "realPaper",
            assemblyType: "annual_subjects",
            status: "published",
          },
        },
        select: { id: true, solution: true, content: true, updatedAt: true },
        take: 2,
      });
      assert.equal(rows.length, 1, item.code + ": 年度题不唯一或不可用");
      const row = rows[0]!;
      assert(
        row.solution &&
          typeof row.solution === "object" &&
          !Array.isArray(row.solution),
      );
      assert.deepEqual(
        (row.solution as Record<string, unknown>).answer,
        [item.answer],
        item.code + ": 官方答案发生变化",
      );
      const content = row.content as {
        options?: { label: string; text: string }[];
      };
      if (item.code === "TMUA_2023_P2_Q01") {
        assert.deepEqual(
          content.options?.slice(0, 4).map((option) => option.text),
          [
            String.raw`\(2\sqrt{15}\)`,
            String.raw`\(4\sqrt{5}\)`,
            String.raw`\(5\sqrt{2}\)`,
            String.raw`\(\sqrt{58}\)`,
          ],
          item.code + ": 选项文本不匹配",
        );
      }
      const fixed = repair(item.code, row.solution);
      if (apply && fixed.changed) {
        const result = await tx.question.updateMany({
          where: { id: row.id, updatedAt: row.updatedAt },
          data: { solution: fixed.solution },
        });
        assert.equal(
          result.count,
          1,
          item.code + ": 题目已并发变化，请重新核对",
        );
        const updated = await tx.question.findUniqueOrThrow({
          where: { id: row.id },
          select: { solution: true, content: true },
        });
        assert(
          isDeepStrictEqual(updated.solution, fixed.solution),
          item.code + ": 写后解析校验失败",
        );
        assert(
          isDeepStrictEqual(updated.content, row.content),
          item.code + ": 题干不应变化",
        );
      }
      output.push({
        code: item.code,
        changed: fixed.changed,
        fields: fixed.fields,
      });
    }
    return output;
  });
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", results }));
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
