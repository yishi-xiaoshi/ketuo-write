import * as fs from 'fs';

const filePath = new URL('./courseData.js', import.meta.url);
let content = fs.readFileSync(filePath, 'utf-8');

// 找到 SEVEN_KEYS 数组的范围
const startMarker = 'export const SEVEN_KEYS = [';
const endMarker = '];';

const startIdx = content.indexOf(startMarker);
const endIdx = content.lastIndexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('ERROR: Could not find SEVEN_KEYS section');
    process.exit(1);
}

// 提取 SEVEN_KEYS 内容部分
const keysContent = content.slice(startIdx + startMarker.length, endIdx);

// 找到并删除重复的 "建模成文" 对象（第二个 id:5，name:'建模成文'）
// 先找到所有 id:5 的位置
const id5Regex = /\{\s*\n\s*id:\s*5,\s*\n\s*name:\s*'建模成文'/g;
const matches = [...keysContent.matchAll(id5Regex)];

if (matches.length === 0) {
    console.log('No duplicate "建模成文" found, checking current state...');
    // 检查是否已经是正确的7把钥匙
    const idCounts = {};
    const idMatchRegex = /id:\s*(\d+)/g;
    let m;
    while ((m = idMatchRegex.exec(keysContent)) !== null) {
        idCounts[m[1]] = (idCounts[m[1]] || 0) + 1;
    }
    console.log('ID counts in SEVEN_KEYS:', idCounts);
} else {
    console.log(`Found ${matches.length} occurrence(s) of duplicate "建模成文"`);

    // 删除第二个 id:5 + name:'建模成文' 对象（从第二个匹配开始到下一个 },\n  } 之间）
    let modifiedKeys = keysContent;

    // 找到每个"建模成文"对象的完整范围
    for (const match of matches) {
        const matchStart = match.index;
        // 找到 { 开始的位置（往前找）
        let objStart = modifiedKeys.lastIndexOf('{', matchStart);
        // 找到 } 结束的位置（往后找，到 },\n  { 或 ] 结束）
        let objEnd = modifiedKeys.indexOf('}', matchStart);
        // 继续往后找确保完整匹配 },\n
        while (objEnd !== -1) {
            const after = modifiedKeys.slice(objEnd, objEnd + 4);
            if (after === '},\n  ' || after === '},\n]' || after === '},\n\n') {
                break;
            }
            objEnd = modifiedKeys.indexOf('}', objEnd + 1);
        }

        // 验证这个对象是不是 "建模成文"
        const objContent = modifiedKeys.slice(objStart, objEnd + 2);
        if (objContent.includes("name: '建模成文'")) {
            console.log(`Removing duplicate object at position ${objStart}`);
            modifiedKeys = modifiedKeys.slice(0, objStart) + modifiedKeys.slice(objEnd + 2);
            break; // 只删除第一个（实际是第二个）建模成文
        }
    }

    // 在末尾添加 Key 6 和 Key 7
    const newKeys = `
  {
    id: 6,
    name: '相关网',
    alias: '第六把钥匙',
    icon: '🕸️',
    color: '#34d399',
    shortDesc: '顺藤摸瓜，深度挖掘——找到事物之间的关联与连锁',
    detail: '相关网是可拓学中分析事物之间关联关系的重要方法。通过建立相关网，发现隐藏的联系：\n\n① 横向关联：同一层面的事物之间的联系\n  例：写"春天的校园"→ 花开→鸟鸣→同学→老师→上课\n\n② 纵向关联：原因与结果的链条\n  例：父亲加班→回家晚→饭凉了→母亲等待→家的温暖\n\n③ 网状发散：从一个点出发，联想所有相关事物\n  例：从"雨"出发→潮湿→寒冷→回忆→离别→思念\n\n核心口诀：一个事物不是孤岛，相关网里找关联。',
    example: {
      topic: '《一堂有趣的课》',
      analysis: '建立相关网：\n├─ 这堂课有趣在哪？\n│   ├─ 内容：课本外的知识\n│   ├─ 方式：动手实验/角色扮演\n│   └─ 老师：幽默/有感染力\n├─ 由此及彼的联想\n│   ├─ 这堂课→某本书\n│   ├─ 这堂课→某次经历\n│   └─ 这堂课→未来梦想',
    },
  },
  {
    id: 7,
    name: '蕴含系',
    alias: '第七把钥匙',
    icon: '🔮',
    color: '#818cf8',
    shortDesc: '追根溯源，层层深入——从表象到本质，触及文章的灵魂',
    detail: '蕴含系是可拓学深层分析方法，挖掘事物背后蕴含的本质：\n\n① 表层→深层：表面现象背后的本质\n  例："奶奶的唠叨" → 唠叨背后是关心、担心、不舍\n\n② 具象→抽象：从具体事物提炼抽象主题\n  例：写"老照片" → 照片背后是时光、亲情、传承\n\n③ 显性→隐性：表面看到什么？隐藏着什么？\n  例："母亲的背影" → 背影=离别/不舍/坚强/传承\n\n④ 蕴含链：一步步追问"这意味着什么"\n  例：父亲沉默 → 不善表达 → 深沉的爱 → 男人的责任\n\n核心口诀：好文章不只是写"是什么"，更要写"意味着什么"。',
    example: {
      topic: '《父亲的那双手》',
      analysis: '层层追问：\n表层：父亲的手很粗糙\n↓ 这意味着什么？\n深层1：父亲干了很重的活\n↓ 为什么干活？\n深层2：为了这个家付出\n↓ 这体现了什么？\n深层3：深沉而不善表达的爱\n\n最终立意：粗糙的手，细腻的爱。',
    },
  },`;

    // 在 ] 前添加新钥匙
    const insertPoint = modifiedKeys.lastIndexOf('},');
    const before = modifiedKeys.slice(0, insertPoint + 2);
    const after = modifiedKeys.slice(insertPoint + 2);

    const finalKeysContent = before + newKeys + after;

    // 重组完整文件
    content = content.slice(0, startIdx) + startMarker + finalKeysContent + endMarker + content.slice(endIdx + endMarker.length);

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Successfully updated courseData.js!');
}
