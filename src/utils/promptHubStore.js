import builtinData from '../data/promptHubBuiltins.json';

export const PROMPT_HUB_KEY = 'prompt-hub-workspace-v1';
const { legacy, preview } = builtinData;
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
};
export const makeId = () => `category-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const imageGroups = legacy.groups.map(group => ({ value: group.id, label: group.title,
  children: legacy.subcategories[group.id].filter(child => child.id !== 'all').map(child => ({ value: child.id, label: child.title })),
}));
const scriptChildren = preview.categories.find(category => category.name === '脚本').subCategories.map((label, i) => ({ value: `category-script-${i}`, label }));
const mappings = {
  background: ['scene-replacement', 'environment-condition', 'environment-condition', 'scene-layout', 'environment-condition', 'scene-replacement', 'scene-state'],
  composition: ['shot-format', 'focus-depth', 'camera-angle', 'subject-composition', 'shot-format', 'focus-depth', 'camera-angle'],
  style: ['art-medium', 'color-mood', 'color-mood', 'color-mood', 'art-medium', 'image-quality', 'lighting-exposure', 'lighting-exposure'],
};

function migrateImageCategoryName(state) {
  if (state.imageCategoryLabelVersion === 1) return state;
  return { ...state, imageCategoryLabelVersion: 1, categories: state.categories.map(category => category.value === 'image-edit' && category.label === '图片修改' ? { ...category, label: '图片' } : category) };
}

export function seedPromptHub() {
  const categories = [
    { value: 'image-edit', label: '图片', subcategories: structuredClone(imageGroups) },
    { value: 'script', label: '脚本', subcategories: structuredClone(scriptChildren) },
  ];
  const prompts = legacy.groups[0].methodIds.map((id, index) => {
    const method = legacy.methods.find(item => item.id === id);
    return { id: `legacy-${id}`, legacyId: id, code: `#IMG-${String(index + 1).padStart(3, '0')}`, title: method.title, description: method.description,
      body: method.prompt, materialType: 'image-edit', groupId: 'local-character', subcategoryId: method.subcategory, tags: [], isBuiltin: true };
  });
  imageGroups.slice(1).forEach(group => {
    preview.prompts.filter(item => item.category === '图片修改' && item.subCategory === group.label).forEach((item, index) => {
      prompts.push({ id: `preview-${item.id}`, code: `#IMG-${String(prompts.length + 1).padStart(3, '0')}`, title: item.title, description: item.desc, body: item.content,
        materialType: 'image-edit', groupId: group.value, subcategoryId: mappings[group.value][index], tags: item.tags, sourceCategory: item.source, isBuiltin: true });
    });
  });
  preview.prompts.filter(item => item.category === '脚本').forEach(item => prompts.push({ id: `preview-${item.id}`, code: item.code,
    title: item.title, description: item.desc, body: item.content, materialType: 'script', groupId: '', subcategoryId: scriptChildren.find(child => child.label === item.subCategory)?.value || '', tags: item.tags, sourceCategory: item.source, isBuiltin: true }));
  return { version: 1, categories, prompts };
}

export function loadPromptHub() {
  const saved = read(PROMPT_HUB_KEY, null);
  if (saved?.version === 1 && Array.isArray(saved.prompts) && Array.isArray(saved.categories) && saved.categories.length) return migrateImageCategoryName(saved);
  const state = seedPromptHub();
  const addCategory = (value, label, subcategories = []) => {
    let category = state.categories.find(item => item.value === value);
    if (!category) { category = { value, label, subcategories }; state.categories.push(category); }
    return category;
  };
  const oldCategoryData = read('prompt-categories-v1', []);
  const oldCategories = Array.isArray(oldCategoryData) ? oldCategoryData : oldCategoryData.categories || [];
  oldCategories.forEach(category => {
    if (category.value === 'personal') return;
    const target = addCategory(category.value, category.label);
    target.label = category.label;
    (category.subcategories || []).forEach(child => {
      if (!target.subcategories.some(item => item.value === child.value)) target.subcategories.push({ ...child });
    });
  });
  const originalData = read('creator-growth-dashboard-v1', {});
  (Array.isArray(originalData.prompts) ? originalData.prompts : []).forEach((prompt, index) => {
    const materialType = prompt.materialType || 'personal';
    addCategory(materialType, oldCategories.find(item => item.value === materialType)?.label || (materialType === 'personal' ? '个人提示词' : prompt.customMaterialType || materialType));
    state.prompts.push({ ...prompt, id: `saved-${prompt.id || index}`, originalId: prompt.id, code: prompt.code || `#USR-${String(index + 1).padStart(3, '0')}`, materialType, groupId: prompt.groupId || '', subcategoryId: prompt.subcategoryId || '', title: prompt.title || '未命名提示词', description: prompt.description || '', tags: prompt.tags || [], isBuiltin: false });
  });
  const oldBodies = read('image-generation-edit-prompts-v1', {});
  const oldDetails = read('image-generation-edit-details-v1', {});
  legacy.groups.flatMap(group => group.methodIds).forEach(id => {
    const method = legacy.methods.find(item => item.id === id);
    const group = legacy.groups.find(item => item.methodIds.includes(id));
    let target = state.prompts.find(item => item.legacyId === id);
    const details = oldDetails[id];
    if (!target && ((typeof oldBodies[id] === 'string' && oldBodies[id] !== method.prompt) || details)) {
      target = { id: `legacy-${id}`, legacyId: id, code: '#OLD', title: method.title, description: method.description, body: method.prompt, materialType: 'image-edit', groupId: group.id, subcategoryId: method.subcategory, tags: [], isBuiltin: true };
      state.prompts.push(target);
    }
    if (!target) return;
    if (typeof oldBodies[id] === 'string') target.body = oldBodies[id];
    if (details) Object.assign(target, { title: details.title ?? target.title, description: details.description ?? target.description, tags: details.tags || [], sourceCategory: details.sourceCategory || '', groupId: details.materialType || target.groupId, subcategoryId: details.subcategoryId ?? target.subcategoryId });
  });
  // Import only actual edits/additions from the independent prototype; its untouched sample set is not duplicated.
  const prototype = read('PROMPTHUB_V1_STORE', null);
  if (Array.isArray(prototype?.prompts)) {
    const categoryForName = name => {
      const existing = state.categories.find(item => item.label === name);
      if (existing) return existing;
      const builtin = name === '图片修改' ? 'image-edit' : name === '脚本' ? 'script' : null;
      return builtin ? state.categories.find(item => item.value === builtin) : addCategory(`category-preview-${encodeURIComponent(name)}`, name);
    };
    const sameContent = (a, b) => ['title', 'desc', 'content', 'category', 'subCategory', 'source'].every(key => (a[key] || '') === (b[key] || '')) && JSON.stringify(a.tags || []) === JSON.stringify(b.tags || []);
    prototype.prompts.forEach(prompt => {
      const initial = preview.prompts.find(item => item.id === prompt.id);
      if (initial && sameContent(prompt, initial)) return;
      const category = categoryForName(prompt.category);
      let sub = category.subcategories.find(item => item.label === prompt.subCategory);
      if (!sub && prompt.subCategory) { sub = { value: `category-preview-${encodeURIComponent(prompt.subCategory)}`, label: prompt.subCategory }; category.subcategories.push(sub); }
      let target = state.prompts.find(item => item.id === `preview-${prompt.id}`);
      const patch = { title: prompt.title, description: prompt.desc || '', body: prompt.content || '', materialType: category.value, tags: prompt.tags || [], sourceCategory: prompt.source || '' };
      if (sub?.children) {
        patch.groupId = sub.value;
        patch.subcategoryId = target?.groupId === sub.value ? target.subcategoryId : '';
      } else { patch.groupId = ''; patch.subcategoryId = sub?.value || ''; }
      if (target) Object.assign(target, patch);
      else state.prompts.push({ id: `preview-${prompt.id}`, code: prompt.code || '#USR', isBuiltin: !!prompt.isBuiltin, ...patch });
    });
  }
  return migrateImageCategoryName(state);
}

export function promptLabels(prompt, categories) {
  const category = categories.find(item => item.value === prompt.materialType);
  const group = category?.subcategories?.find(item => item.value === prompt.groupId);
  const child = (group?.children || category?.subcategories || []).find(item => item.value === prompt.subcategoryId);
  return { category: category?.label || '未分类', group: group?.label, secondary: child?.label || '未分类' };
}
