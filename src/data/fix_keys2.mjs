import * as fs from 'fs';

const filePath = new URL('./courseData.js', import.meta.url);
let content = fs.readFileSync(filePath, 'utf-8');

// 找到 SEVEN_KEYS 数组开始
const startMarker = 'export const SEVEN_KEYS = [';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
    console.error('SEVEN_KEYS not found');
    process.exit(1);
}

// 从 startIdx 往后找，找到这个数组的结束 ]（不是第一个，是 SEVEN_KEYS 自己的那个）
// 用括号计数法找匹配
let braceCount = 0;
let inString = false;
let stringChar = '';
let foundStart = false;
let endIdx = -1;

for (let i = startIdx + startMarker.length - 1; i < content.length; i++) {
    const c = content[i];
    const prev = i > 0 ? content[i-1] : '';

    if (!inString) {
        if (c === '"' || c === "'" || c === '`') {
            inString = true;
            stringChar = c;
        } else if (c === '[' && !foundStart) {
            foundStart = true;
            braceCount++;
        } else if (c === ']') {
            braceCount--;
            if (foundStart && braceCount === 0) {
                endIdx = i;
                break;
            }
        }
    } else {
        if (c === stringChar && prev !== '\\') {
            inString = false;
        }
    }
}

if (endIdx === -1) {
    console.error('Could not find SEVEN_KEYS closing bracket');
    process.exit(1);
}

console.log(`SEVEN_KEYS found from ${startIdx} to ${endIdx}`);

// 提取 SEVEN_KEYS 内容
const keysBlock = content.slice(startIdx, endIdx + 1);
console.log(`Keys block length: ${keysBlock.length}`);

// 找到"建模成文"对象的起止位置
// 它在 keysBlock 中，应该在 id:5 之后，name 是'变换法'的那个 id:5 后面
// 所以要找第二个 id:5 且 name: '建模成文'

// 先找 keysBlock 中所有的 { id: 5
const entries = [];
let searchFrom = 0;
while (true) {
    const id5Match = keysBlock.indexOf('id: 5,', searchFrom);
    if (id5Match === -1) break;
    // 看看这个 id:5 后面紧跟的是哪个 name
    const afterId5 = keysBlock.slice(id5Match, id5Match + 100);
    const nameMatch = afterId5.match(/name:\s*'([^']+)'/);
    if (nameMatch) {
        entries.push({ pos: id5Match, name: nameMatch[1] });
    }
    searchFrom = id5Match + 1;
}

console.log('Entries with id:5:', entries.map(e => e.name));

// 找到 name:'建模成文' 的那个
const jianmoEntry = entries.find(e => e.name === '建模成文');
if (jianmoEntry) {
    // 在 keysBlock 中找到这个对象的完整范围
    // 从 { 往前找到这个 id:5 前的 {
    let objStart = keysBlock.lastIndexOf('{', jianmoEntry.pos);
    // 从这个位置往后，找到 },\n  或 },\n\n
    let objEnd = keysBlock.indexOf('}', jianmoEntry.pos);
    while (objEnd !== -1) {
        const after = keysBlock.slice(objEnd, objEnd + 4);
        if (after === '},\n  ' || after === '},\n\n' || after === '},\n]') {
            break;
        }
        objEnd = keysBlock.indexOf('}', objEnd + 1);
    }

    console.log(`Removing jianmo entry from ${objStart} to ${objEnd + 2}`);
    const before = keysBlock.slice(0, objStart);
    const after2 = keysBlock.slice(objEnd + 2);

    // 在末尾的 }, 前面插入新钥匙（在 before 中找到倒数第二个 },\n 的位置）
    const lastClose = before.lastIndexOf('},');
    const beforeInsert = before.slice(0, lastClose + 2);
    const afterInsert = before.slice(lastClose + 2);

    const newKeys = `
  {
    id: 6,
    name: '相关网',
    alias: '第六把钥匙',
    icon: '🕸️',
    color: '#34d399',
    shortDesc: '顺藤摸瓜，深度挖掘——找到事物之间的关联与连锁',
    detail: '相关网是可拓学中分析事物之间关联关系的重要方法。通过建立相关网，发现隐藏的联系：\n\n① 横向关联：同一层面的事物之间的联系\n  例：写"春天的校园" → 花开→鸟鸣→同学→老师→上课\n\n② 纵向关联：原因与结果的链条\n  例：父亲加班→回家晚→饭凉了→母亲等待→家的温暖\n\n③ 网状发散：从一个点出发，联想所有相关事物\n  例：从"雨"出发→潮湿→寒冷→回忆→离别→思念\n\n核心口诀：一个事物不是孤岛，相关网里找关联。',
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

    const newKeysBlock = beforeInsert + newKeys + afterInsert;

    // 重组
    const newContent = content.slice(0, startIdx) + newKeysBlock + content.slice(endIdx + 1);

    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('Successfully updated courseData.js!');
} else {
    console.log('No jianmo entry found, checking if already updated...');
}
