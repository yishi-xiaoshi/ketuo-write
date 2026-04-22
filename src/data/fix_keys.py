import re

with open('courseData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到并删除重复的 "建模成文" 对象（第二个 id:5）
# 使用正则匹配从 "  {\n    id: 5,\n    name: '建模成文'" 开始到 "],\n];" 结束的区域之前
old_pattern = r"  \{\n    id: 5,\n    name: '建模成文'.*?\n  \},\n\];"

# 找最后一个 ] 就是 SEVEN_KEYS 结尾
# 先把 SEVEN_KEYS 数组部分单独提出来处理
match = re.search(r"(export const SEVEN_KEYS = \[.*?)(\n\];)", content, re.DOTALL)
if match:
    keys_section = match.group(1)
    rest = match.group(2)

    # 删除 id:5 + name:'建模成文' 的那个对象
    keys_section = re.sub(
        r"  \{\n    id: 5,\n    name: '建模成文'.*?\n  \},\n",
        "",
        keys_section,
        flags=re.DOTALL
    )

    # 在 ] 前插入 Key 6 和 Key 7
    new_keys = '''  {
    id: 6,
    name: '相关网',
    alias: '第六把钥匙',
    icon: '🕸️',
    color: '#34d399',
    shortDesc: '顺藤摸瓜，深度挖掘——找到事物之间的关联与连锁',
    detail: '相关网是可拓学中分析事物之间关联关系的重要方法。通过建立相关网，发现隐藏的联系：\n\n① 横向关联：同一层面的事物之间的联系\n  例：写"春天的校园"→ 花开→鸟鸣→同学→老师→上课\n\n② 纵向关联：原因与结果的链条\n  例：父亲加班→回家晚→饭凉了→母亲等待→家的温暖\n\n③ 网状发散：从一个点出发，联想所有相关事物\n  例：从"雨"出发→潮湿→寒冷→回忆→离别→思念\n\n核心口诀：一个事物不是孤岛，相关网里找关联。''',
    example: {
      topic: '《一堂有趣的课》',
      analysis: '建立相关网：
├─ 这堂课有趣在哪？
│   ├─ 内容：课本外的知识
│   ├─ 方式：动手实验/角色扮演
│   └─ 老师：幽默/有感染力
├─ 由此及彼的联想
│   ├─ 这堂课→某本书
│   ├─ 这堂课→某次经历
│   └─ 这堂课→未来梦想''',
    },
  },
  {
    id: 7,
    name: '蕴含系',
    alias: '第七把钥匙',
    icon: '🔮',
    color: '#818cf8',
    shortDesc: '追根溯源，层层深入——从表象到本质，触及文章的灵魂',
    detail: '蕴含系是可拓学深层分析方法，挖掘事物背后蕴含的本质：\n\n① 表层→深层：表面现象背后的本质\n  例："奶奶的唠叨" → 唠叨背后是关心、担心、不舍\n\n② 具象→抽象：从具体事物提炼抽象主题\n  例：写"老照片" → 照片背后是时光、亲情、传承\n\n③ 显性→隐性：表面看到什么？隐藏着什么？\n  例："母亲的背影" → 背影=离别/不舍/坚强/传承\n\n④ 蕴含链：一步步追问"这意味着什么"\n  例：父亲沉默 → 不善表达 → 深沉的爱 → 男人的责任\n\n核心口诀：好文章不只是写"是什么"，更要写"意味着什么"。''',
    example: {
      topic: '《父亲的那双手》',
      analysis: '层层追问：
表层：父亲的手很粗糙
↓ 这意味着什么？
深层1：父亲干了很重的活
↓ 为什么干活？
深层2：为了这个家付出
↓ 这体现了什么？
深层3：深沉而不善表达的爱

最终立意：粗糙的手，细腻的爱。''',
    },
  },'''

    new_content = content[:match.start()] + "export const SEVEN_KEYS = [" + keys_section + new_keys + "\n];\n" + content[match.end():]

    with open('courseData.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated courseData.js!")
else:
    print("ERROR: Could not find SEVEN_KEYS section")
