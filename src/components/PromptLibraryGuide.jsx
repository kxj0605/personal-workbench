import React from 'react';
import { X } from 'lucide-react';

export function PromptLibraryGuide({ onClose }) {
  const dialogRef = React.useRef(null);
  React.useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  return <dialog ref={dialogRef} className="prompt-library-guide-dialog" aria-labelledby="prompt-library-guide-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="prompt-library-guide-body">
      <header><h2 id="prompt-library-guide-title">提示词库使用教程</h2><button type="button" onClick={onClose} aria-label="关闭使用教程"><X size={20} /></button></header>
      <p>这里有三个入口：我的提示词、图片修改，以及专门整理脚本相关提示词的脚本页。</p>
      <section><h3>我的提示词</h3><ol>
        <li>点击分类导航右侧的“提示词管理”，在弹窗中选择提示词类型（我的提示词、图片修改或脚本），填写提示词正文。</li>
        <li>填写标题和简介，选择大类及二级分类，再填写正文并点击“保存提示词”。大类和二级分类都能在管理窗口中新增、改名或删除。</li>
        <li>在“已保存的提示词”中找到对应卡片，点击“复制”，将正文粘贴到使用的 AI 工具。</li>
        <li>不再需要的提示词，可以通过卡片上的“删除”按钮移除。</li>
      </ol></section>
      <section><h3>图片修改</h3><ol>
        <li>自己保存的图片修改类提示词可在模板下方查看。按“局部与人物”“背景与环境”“构图与镜头”“风格与画面”选择改图需求。</li>
        <li>阅读卡片说明，选择适合当前图片的模板，点击复制图标。</li>
        <li>把模板中【方括号】里的内容替换成具体的人物、物品、位置或修改要求。</li>
        <li>把原图和填写好的提示词一起发送给支持图片编辑的 AI 工具。</li>
        <li>需要调整常用模板时，点击铅笔图标编辑，完成后保存；不保留修改可点击取消。</li>
      </ol></section>
      <section><h3>脚本</h3><p>保存用于脚本分析、骨架提取和改编创作的提示词。这里仅展示提示词类型为“脚本”的内容；已有脚本类提示词会自动出现在这里，也能在“我的提示词”中找到。</p></section>
      <section><h3>一个填写示例</h3><p>“将画面【位置】的【原人物 / 原物品】替换为【新人物 / 新物品】”，可以改成：“将画面左侧穿蓝衣的男子替换为穿灰衣的老人，其他人物和背景保持不变。”</p></section>
      <p className="prompt-library-guide-note">提示词与模板修改保存在当前浏览器中；换浏览器或清除网站数据前，请先保留重要内容。</p>
      <footer><button type="button" onClick={onClose}>知道了</button></footer>
    </div>
  </dialog>;
}
