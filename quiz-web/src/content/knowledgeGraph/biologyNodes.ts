// 生物图谱轻量考纲：沿用 ESAT 编号与中英文名称，不导入完整讲义。
import type { KnowledgeGraphChapter, KnowledgeGraphNode } from './types'

export const biologyGraphChapters: readonly KnowledgeGraphChapter[] = [
  {
    code: '150100',
    title: '细胞',
    titleEn: 'Cells',
  },
  {
    code: '150200',
    title: '跨膜运输',
    titleEn: 'Movement across membranes',
  },
  {
    code: '150300',
    title: '细胞分裂与性别决定',
    titleEn: 'Cell division and sex determination',
  },
  {
    code: '150400',
    title: '遗传',
    titleEn: 'Inheritance',
  },
  {
    code: '150500',
    title: 'DNA',
    titleEn: 'DNA',
  },
  {
    code: '150600',
    title: '基因技术',
    titleEn: 'Gene technologies',
  },
  {
    code: '150700',
    title: '变异',
    titleEn: 'Variation',
  },
  {
    code: '150800',
    title: '酶',
    titleEn: 'Enzymes',
  },
  {
    code: '150900',
    title: '动物生理',
    titleEn: 'Animal physiology',
  },
  {
    code: '151000',
    title: '生态系统',
    titleEn: 'Ecosystems',
  },
  {
    code: '151100',
    title: '植物生理',
    titleEn: 'Plant physiology',
  },
]

export const biologyGraphNodes: readonly KnowledgeGraphNode[] = [
  {
    code: '150101',
    title: '真核细胞结构与功能',
    titleEn: 'Eukaryotic cell structure and function',
    chapterCode: '150100',
  },
  {
    code: '150102',
    title: '原核细胞结构与功能',
    titleEn: 'Prokaryotic cell structure and function',
    chapterCode: '150100',
  },
  {
    code: '150103',
    title: '生物体层级',
    titleEn: 'Levels of organisation',
    chapterCode: '150100',
  },
  {
    code: '150201',
    title: '扩散、渗透与主动运输',
    titleEn: 'Diffusion, osmosis and active transport',
    chapterCode: '150200',
  },
  {
    code: '150301',
    title: '有丝分裂与细胞周期',
    titleEn: 'Mitosis and the cell cycle',
    chapterCode: '150300',
  },
  {
    code: '150302',
    title: '减数分裂与细胞周期',
    titleEn: 'Meiosis and the cell cycle',
    chapterCode: '150300',
  },
  {
    code: '150303',
    title: '无性与有性繁殖',
    titleEn: 'Asexual and sexual reproduction',
    chapterCode: '150300',
  },
  {
    code: '150304',
    title: '性别决定',
    titleEn: 'Sex determination',
    chapterCode: '150300',
  },
  {
    code: '150401',
    title: '细胞核与遗传物质',
    titleEn: 'Nucleus as genetic material site',
    chapterCode: '150400',
  },
  {
    code: '150402',
    title: '遗传术语',
    titleEn: 'Genetic terms',
    chapterCode: '150400',
  },
  {
    code: '150403',
    title: '单基因杂交与家系图',
    titleEn: 'Monohybrid crosses and pedigrees',
    chapterCode: '150400',
  },
  {
    code: '150501',
    title: '基因组与染色体',
    titleEn: 'Genome and chromosomes',
    chapterCode: '150500',
  },
  {
    code: '150502',
    title: 'DNA结构',
    titleEn: 'DNA structure',
    chapterCode: '150500',
  },
  {
    code: '150503',
    title: '蛋白质合成',
    titleEn: 'Protein synthesis',
    chapterCode: '150500',
  },
  {
    code: '150504',
    title: '基因突变',
    titleEn: 'Gene mutations',
    chapterCode: '150500',
  },
  {
    code: '150601',
    title: '基因工程',
    titleEn: 'Genetic engineering',
    chapterCode: '150600',
  },
  {
    code: '150602',
    title: '干细胞',
    titleEn: 'Stem cells',
    chapterCode: '150600',
  },
  {
    code: '150603',
    title: '选择育种',
    titleEn: 'Selective breeding',
    chapterCode: '150600',
  },
  {
    code: '150701',
    title: '自然选择与进化',
    titleEn: 'Natural selection and evolution',
    chapterCode: '150700',
  },
  {
    code: '150702',
    title: '变异来源',
    titleEn: 'Sources of variation',
    chapterCode: '150700',
  },
  {
    code: '150801',
    title: '酶作为生物催化剂',
    titleEn: 'Enzymes as biological catalysts',
    chapterCode: '150800',
  },
  {
    code: '150802',
    title: '酶作用机制与专一性',
    titleEn: 'Enzyme action and specificity',
    chapterCode: '150800',
  },
  {
    code: '150803',
    title: '温度与pH影响',
    titleEn: 'Temperature and pH effects',
    chapterCode: '150800',
  },
  {
    code: '150804',
    title: '消化酶',
    titleEn: 'Digestive enzymes',
    chapterCode: '150800',
  },
  {
    code: '150901',
    title: '呼吸作用',
    titleEn: 'Respiration',
    chapterCode: '150900',
  },
  {
    code: '150902',
    title: '器官系统',
    titleEn: 'Organ systems',
    chapterCode: '150900',
  },
  {
    code: '150903',
    title: '稳态',
    titleEn: 'Homeostasis',
    chapterCode: '150900',
  },
  {
    code: '150904',
    title: '激素',
    titleEn: 'Hormones',
    chapterCode: '150900',
  },
  {
    code: '150905',
    title: '疾病与身体防御',
    titleEn: 'Disease and body defence',
    chapterCode: '150900',
  },
  {
    code: '151001',
    title: '生态系统层级',
    titleEn: 'Levels of organisation in ecosystems',
    chapterCode: '151000',
  },
  {
    code: '151002',
    title: '物质循环',
    titleEn: 'Material cycling',
    chapterCode: '151000',
  },
  {
    code: '151003',
    title: '生物多样性',
    titleEn: 'Biodiversity',
    chapterCode: '151000',
  },
  {
    code: '151101',
    title: '光合作用',
    titleEn: 'Photosynthesis',
    chapterCode: '151100',
  },
  {
    code: '151102',
    title: '植物运输系统',
    titleEn: 'Plant transport systems',
    chapterCode: '151100',
  },
]
