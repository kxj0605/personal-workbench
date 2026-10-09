const POSITIVE_TERMS = ['好看', '精彩', '喜欢', '上头', '感人', '感动', '共鸣', '真实', '自然', '有趣', '好笑', '惊喜', '爽', '过瘾', '演技好', '节奏快', '反转精彩', '推荐', '期待', '不错'];
const NEGATIVE_TERMS = ['不好看', '不喜欢', '无聊', '尴尬', '拖沓', '烂尾', '狗血', '离谱', '降智', '失望', '难看', '没意思', '看不懂', '逻辑不通', '不合理', '太慢', '套路', '重复', '敷衍', '出戏'];
const CONTROVERSY_TOPICS = [
  { name: '剧情与逻辑', words: ['剧情', '情节', '故事', '逻辑', '合理', '降智'] },
  { name: '人物设定', words: ['人设', '人物', '角色', '主角', '女主', '男主'] },
  { name: '结局', words: ['结局', '收尾', '烂尾'] },
  { name: '节奏', words: ['节奏', '拖沓', '太慢'] },
  { name: '演技', words: ['演技', '表演', '演员', '出戏'] },
  { name: '改编方式', words: ['改编', '原著', '原版', '翻拍'] },
  { name: '台词', words: ['台词', '对白'] },
  { name: '画面', words: ['画面', '镜头', '特效'] },
];

const normalizeLines = (value) => String(value || '').replace(/\r\n?/g, '\n').split('\n')
  .map((line) => line.trim().replace(/^\d+[.、）)]\s*/, ''))
  .filter(Boolean);

function parseCsvRows(value) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"') {
      if (quoted && value[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && value[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((entry) => entry.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((entry) => entry.trim())) rows.push(row);
  return rows;
}

export function importCommentText(value, filename = '') {
  const text = String(value || '').replace(/^\uFEFF/, '');
  if (!/\.csv$/i.test(filename)) return normalizeLines(text).join('\n');
  const rows = parseCsvRows(text);
  if (!rows.length) return '';
  const column = rows[0].findIndex((entry) => /^(评论内容|评论|内容|comment|text)$/i.test(entry.trim()));
  if (column < 0) return '';
  return rows.slice(1).map((row) => row[column]?.replace(/\r\n?|\n/g, ' ').trim()).filter(Boolean).join('\n');
}

export function analyzeCommentFeedback(value) {
  const comments = normalizeLines(value).slice(0, 2000);
  const positiveCounts = new Map(POSITIVE_TERMS.map((word) => [word, 0]));
  const negativeCounts = new Map(NEGATIVE_TERMS.map((word) => [word, 0]));
  const scored = comments.map((comment) => {
    const lower = comment.toLocaleLowerCase('zh-CN');
    const negativeHits = NEGATIVE_TERMS.filter((word) => lower.includes(word));
    let positiveText = lower;
    negativeHits.forEach((word) => { positiveText = positiveText.replaceAll(word, ' '); });
    const positiveHits = POSITIVE_TERMS.filter((word) => positiveText.includes(word));
    positiveHits.forEach((word) => positiveCounts.set(word, positiveCounts.get(word) + 1));
    negativeHits.forEach((word) => negativeCounts.set(word, negativeCounts.get(word) + 1));
    return { text: comment, lower, tone: positiveHits.length > negativeHits.length ? 'positive' : negativeHits.length > positiveHits.length ? 'negative' : 'other' };
  });
  const topWords = (counts) => [...counts].filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .slice(0, 8).map(([word, count]) => ({ word, count }));
  const controversies = CONTROVERSY_TOPICS.map((topic) => {
    const related = scored.filter((comment) => topic.words.some((word) => comment.lower.includes(word)));
    const positive = related.filter((comment) => comment.tone === 'positive');
    const negative = related.filter((comment) => comment.tone === 'negative');
    if (!positive.length || !negative.length) return null;
    return { topic: topic.name, positiveCount: positive.length, negativeCount: negative.length, positiveExample: positive[0].text, negativeExample: negative[0].text };
  }).filter(Boolean).sort((a, b) => (b.positiveCount + b.negativeCount) - (a.positiveCount + a.negativeCount)).slice(0, 5);
  return {
    sourceText: value,
    commentCount: comments.length,
    positiveWords: topWords(positiveCounts),
    negativeWords: topWords(negativeCounts),
    controversies,
    analyzedAt: new Date().toISOString(),
  };
}
