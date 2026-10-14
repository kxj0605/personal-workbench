import React from 'react';

const KEY = 'prompt-categories-v1';
const EVENT = 'prompt-categories-changed';
export const DEFAULT_PROMPT_CATEGORIES = [
  { value: 'personal', label: '我的提示词' },
  { value: 'image-edit', label: '图片修改' },
  { value: 'script', label: '脚本' },
];

export function loadPromptCategories() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    const valid = (item) => typeof item?.value === 'string' && (item.value.startsWith('category-') || DEFAULT_PROMPT_CATEGORIES.some(category => category.value === item.value)) && typeof item.label === 'string' && item.label.trim();
    if (saved?.version === 2 && Array.isArray(saved.categories)) {
      const categories = saved.categories.filter(valid).map(item => ({ ...item, subcategories: Array.isArray(item.subcategories) ? item.subcategories.filter(child => typeof child?.value === 'string' && child.value.startsWith('category-') && typeof child.label === 'string' && child.label.trim()) : [] }));
      return categories.length ? categories : DEFAULT_PROMPT_CATEGORIES;
    }
    const custom = Array.isArray(saved) ? saved.filter(item => valid(item) && item.value.startsWith('category-')) : [];
    return [...DEFAULT_PROMPT_CATEGORIES, ...custom];
  } catch { return DEFAULT_PROMPT_CATEGORIES; }
}

export function usePromptCategories() {
  const [categories, setCategories] = React.useState(loadPromptCategories);
  React.useEffect(() => {
    const refresh = () => setCategories(loadPromptCategories());
    window.addEventListener(EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const saveCategories = (next) => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 2, categories: next }));
    setCategories(next);
    window.dispatchEvent(new Event(EVENT));
  };
  return [categories, saveCategories];
}
