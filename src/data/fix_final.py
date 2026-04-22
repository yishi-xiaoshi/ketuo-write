import re

with open('courseData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: Rename FIVE_KEYS to SEVEN_KEYS
content = content.replace('export const FIVE_KEYS = [', 'export const SEVEN_KEYS = [')

# Step 2: Replace the 建模范畴 object with 相关网 + 蕴含系
# Find the object with id:5, name:'建模成文'
old_key5 = '''  {
    id: 5,
    name: '建模成文',
    alias: '第五把钥匙',
    icon: '\Ud83d\Udcdd',
    color: '#c084fc',
    shortDesc: '装进格子，整合成篇——用物元、事元、关系元规范表达',
    detail: '建模是写作的收尾工作。把发散出来的素材，用可拓学的基元格式规范表达：\\n\\n① 物元 = （物名，特征，量值）\\n  例：父亲的手 = （手，触感，粗糙）\\n\\n② 事元 = （动作，支配对象，方式，时间，地点）\\n  例：父亲做饭 = （做，支配对象：早餐，方式：用心，时间：清晨）\\n\\n③ 关系元 = （关系名，前项，后项，维系方式）\\n  例：父爱 = （情感关系，前项：父亲，后项：我，维系方式：无声的行动）\\n\\n核心口诀：素材装进格子里，表达规范有逻辑。',
    example: {
      topic: '《我的父亲》',
      model: '物元：父亲 = （父亲，外貌，黝黑的脸+粗糙的手+微微弓起的背）\\n\\n事元：父亲的行动 = （做，施动对象：父亲，支配对象：早餐，方式：用心，时间：每天清晨）\\n\\n关系元：父亲与我 = （教导关系，前项：父亲，后项：我，维系方式：身教胜于言传）',
    },
  },'''

if old_key5 in content:
    print('Found exact match for 建模成文 block')
    content = content.replace(old_key5, '')
else:
    print('Exact match not found, trying regex...')
    # Use regex to find and remove the 建模成文 object
    # Pattern: starts with "  {\n    id: 5,\n    name: '建模成文'" and ends with "  },\n"
    pattern = r"  \{\n    id: 5,\n    name: '建模成文',\n    alias: '第五把钥匙',\n    icon: '📝',\n    color: '#c084fc',\n    shortDesc: '.*?',\n    detail: '.*?',\n    example: \{[^}]+\}[^}]+\},"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        print(f'Regex match: {match.group()[:50]}...')
        content = content[:match.start()] + content[match.end():]
        print('Removed via regex')
    else:
        print('No regex match either')

# Step 3: Insert new keys 6 and 7 before the closing ]; of SEVEN_KEYS
# Find where SEVEN_KEYS ends (before FIVE_STEPS)
sep_idx = content.find('// ─── 五步法分析流程')
if sep_idx == -1:
    print('Could not find separator, inserting at end of SEVEN_KEYS array')
    # Find the last "  },\n];" pattern
    sep_idx = content.rfind('  },\n];')

new_keys = '''  {
    id: 6,
    name: '相关网',
    alias: '第六把钥匙',
    icon: '🕸️',
    color: '#34d399',
    shortDesc: '顺藤摸瓜，深度挖掘——找到事物之间的关联与连锁',
    detail: '相关网是可拓学中分析事物之间关联关系的重要方法。通过建立相关网，发现隐藏的联系：\\n\\n① 横向关联：同一层面的事物之间的联系\\n  例：写"春天的校园" → 花开→鸟鸣→同学→老师→上课\\n\\n② 纵向关联：原因与结果的链条\\n  例：父亲加班→回家晚→饭凉了→母亲等待→家的温暖\\n\\n③ 网状发散：从一个点出发，联想所有相关事物\\n  例：从"雨"出发→潮湿→寒冷→回忆→离别→思念\\n\\n核心口诀：一个事物不是孤岛，相关网里找关联。',
    example: {
      topic: '《一堂有趣的课》',
      analysis: '建立相关网：\\n├─ 这堂课有趣在哪？\\n│   ├─ 内容：课本外的知识\\n│   ├─ 方式：动手实验/角色扮演\\n│   └─ 老师：幽默/有感染力\\n├─ 由此及彼的联想\\n│   ├─ 这堂课→某本书\\n│   ├─ 这堂课→某次经历\\n│   └─ 这堂课→未来梦想',
    },
  },
  {
    id: 7,
    name: '蕴含系',
    alias: '第七把钥匙',
    icon: '🔮',
    color: '#818cf8',
    shortDesc: '追根溯源，层层深入——从表象到本质，触及文章的灵魂',
    detail: '蕴含系是可拓学深层分析方法，挖掘事物背后蕴含的本质：\\n\\n① 表层→深层：表面现象背后的本质\\n  例："奶奶的唠叨" → 唠叨背后是关心、担心、不舍\\n\\n② 具象→抽象：从具体事物提炼抽象主题\\n  例：写"老照片" → 照片背后是时光、亲情、传承\\n\\n③ 显性→隐性：表面看到什么？隐藏着什么？\\n  例："母亲的背影" → 背影=离别/不舍/坚强/传承\\n\\n④ 蕴含链：一步步追问"这意味着什么"\\n  例：父亲沉默 → 不善表达 → 深沉的爱 → 男人的责任\\n\\n核心口诀：好文章不只是写"是什么"，更要写"意味着什么"。',
    example: {
      topic: '《父亲的那双手》',
      analysis: '层层追问：\\n表层：父亲的手很粗糙\\n↓ 这意味着什么？\\n深层1：父亲干了很重的活\\n↓ 为什么干活？\\n深层2：为了这个家付出\\n↓ 这体现了什么？\\n深层3：深沉而不善表达的爱\\n\\n最终立意：粗糙的手，细腻的爱。',
    },
  },
'''

# Insert new keys right before the FIVE_STEPS comment
content = content[:sep_idx] + new_keys + content[sep_idx:]

with open('courseData.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done! courseData.js updated successfully.')
