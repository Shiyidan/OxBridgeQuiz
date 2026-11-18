// ESAT 各科前两个知识点的免费资源；题目仅按服务端固定映射开放。
export const FREE_LEARNING_SECTION_CODES = [
  "110101",
  "110102",
  "120101",
  "120102",
  "130101",
  "130102",
  "140101",
  "140102",
  "150101",
  "150102",
] as const;

// 精确叶子范围，禁止父章节、空范围和其他考试获得免费练习资格。
export function isFreePracticeScope(examType: string, code: string): boolean {
  return (
    examType === "ESAT" &&
    FREE_LEARNING_SECTION_CODES.some((item) => item === code)
  );
}

// 例题与考法资源按科目路径分别授权，不能将免费题号用于其他科目接口。
const freeExampleCodes: Record<string, ReadonlySet<string>> = {
  mathematics1: new Set([
    "ESAT_LEGACY_2022_NSAA_Q012",
    "ESAT_LEGACY_2021_NSAA_Q019",
  ]),
  pattern: new Set([
    "ESAT_LEGACY_2022_NSAA_Q012",
    "NSAA_2023_S1-Q011",
    "ENGAA_2017_S1-Q027",
    "ESAT_LEGACY_2018_ENGAA_Q13",
    "ESAT_LEGACY_2021_NSAA_Q019",
    "ESAT_LEGACY_2021_NSAA_Q018",
    "ENGAA_2019_S1-Q025",
    "ESAT_LEGACY_2022_ENGAA_Q027",
    "ESAT_LEGACY_2021_ENGAA_Q037",
    "ESAT-2020-PHYSICS-002",
    "ESAT_LEGACY_2022_NSAA_Q033",
    "ENGAA_2016_S1-Q016",
    "ENGAA_2017_S1-Q020",
    "NSAA_2017_S1-Q022",
    "ESAT_LEGACY_2021_NSAA_Q021",
    "ESAT_LEGACY_2022_NSAA_Q024",
    "NSAA_2023_S1-Q023",
    "NSAA_2023_S1-Q038",
    "ENGAA_2016_S1-Q008",
    "NSAA_2016_S1-Q025",
    "NSAA_2017_S1-Q036",
    "ESAT_LEGACY_2018_ENGAA_Q04",
    "ESAT_LEGACY_2018_ENGAA_Q26",
    "NSAA_2019_S1-Q032",
    "ESAT_LEGACY_2021_NSAA_Q028",
    "ESAT_LEGACY_2022_NSAA_Q029",
    "NSAA_2023_S1-Q024",
    "ESAT_LEGACY_2018_NSAA_Q35",
    "NSAA_2019_S1-Q021",
    "ESAT-2020-PHYSICS-009",
    "ESAT_LEGACY_2021_NSAA_Q031",
    "ESAT_LEGACY_2022_NSAA_Q030",
    "ENGAA_2017_S1-Q012",
    "ESAT_LEGACY_2018_ENGAA_Q08",
    "ESAT_LEGACY_2018_ENGAA_Q10",
    "NSAA_2019_S1-Q026",
    "ESAT-2020-PHYSICS-007",
    "ESAT-2020-PHYSICS-008",
    "ESAT_LEGACY_2021_NSAA_Q023",
    "ESAT_LEGACY_2022_NSAA_Q021",
    "ESAT_LEGACY_2022_NSAA_Q028",
    "NSAA_2023_S1-Q034",
    "NSAA_2017_S1-Q054",
    "ESAT_LEGACY_2018_NSAA_Q37",
    "NSAA_2019_S1-Q042",
    "NSAA_2023_S1-Q048",
    "NSAA_2016_S1-Q037",
    "NSAA_2017_S1-Q037",
    "ESAT_LEGACY_2021_NSAA_Q042",
    "ESAT_LEGACY_2018_NSAA_Q44",
    "NSAA_2016_S1-Q042",
    "ESAT-2020-CHEMISTRY-015",
    "ESAT_LEGACY_2022_NSAA_Q053",
  ]),
  mathematics2: new Set([
    "ESAT-M2-DIRECT-006-LR3",
    "ENGAA_2019_S1-Q025",
    "ESAT_LEGACY_2022_ENGAA_Q027",
  ]),
  physics: new Set([
    "ESAT-PHY-MOCK-ADAPT-E03-008-R44",
    "ENGAA_2016_S1-Q008",
    "ENGAA_2017_S1-Q020",
  ]),
  chemistry: new Set(["NSAA_2017_S1-Q054", "NSAA_2016_S1-Q037"]),
  biology: new Set([
    "NSAA_2016_S1-Q057",
    "NSAA_2016_S1-Q062",
    "NSAA_2019_S1-Q055",
    "NSAA_2017_S1-Q062",
  ]),
};

// 自测只开放固定知识点，例题仅开放对应题干与解析的只读接口。
export function isFreeLearningResource(method: string, path: string): boolean {
  const parts = path.split("/").filter(Boolean);
  if (
    parts[0] === "esat" &&
    parts[1] === "self-check" &&
    isFreePracticeScope("ESAT", parts[2] || "")
  ) {
    return (
      (method === "GET" && parts.length === 3) ||
      (method === "POST" && parts.length === 4 && parts[3] === "answer")
    );
  }
  return (
    method === "GET" &&
    Object.hasOwn(freeExampleCodes, parts[0] || "") &&
    Boolean(freeExampleCodes[parts[0] || ""]?.has(parts[2] || "")) &&
    parts[1] === "examples" &&
    (parts.length === 3 || (parts.length === 4 && parts[3] === "analysis"))
  );
}
