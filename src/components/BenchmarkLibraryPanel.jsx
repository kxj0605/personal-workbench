import React from 'react';
import { BookOpen, Clapperboard, Copy, Download, Film, Globe2, Layers3, Music2, Pencil, Plus, Radio, Trash2, Tv, Upload, UsersRound, X, Youtube } from 'lucide-react';
import './BenchmarkLibraryPanel.css';
import { VideoCollectionPanel } from './VideoCollectionPanel';
import { TopicLibraryHome } from './TopicLibraryHome';
import { BENCHMARK_ACCOUNTS_KEY, loadBenchmarkAccounts, loadBenchmarkVideos, makeBenchmarkId } from '../utils/benchmarkLibrary';

const PLATFORM_OPTIONS = ['抖音', 'YouTube', '快手', 'B站', '小红书', '其他'];
const blankAccount = () => ({ name: '', platform: '抖音', url: '', niche: '', note: '' });
const PLATFORM_ICONS = { 抖音: Music2, YouTube: Youtube, 快手: Clapperboard, B站: Tv, 小红书: BookOpen, 其他: Globe2 };

function quoteCsv(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function makeAccountExport(accounts, exportFormat) {
  const timestamp = new Date().toISOString().slice(0, 10);
  if (exportFormat === 'txt') {
    const sections = accounts.map((account, index) => [`${index + 1}. 账号名称：${account.name || '未命名账号'}`, `平台：${account.platform || '其他'}`, `主页链接：${account.url || '未填写'}`, `赛道 / 定位：${account.niche || '未填写'}`, `对标说明：${account.note || '未填写'}`].join('\n'));
    return { content: [`对标账号导出`, `导出时间：${new Date().toLocaleString('zh-CN')}`, `账号数量：${accounts.length}`, '', ...sections].join('\n\n'), filename: `对标账号-${timestamp}.txt`, mimeType: 'text/plain;charset=utf-8', label: 'TXT' };
  }
  if (exportFormat === 'csv') {
    const columns = ['账号名称', '平台', '主页链接', '赛道 / 定位', '对标说明', '创建时间'];
    const rows = accounts.map((account) => [account.name, account.platform, account.url, account.niche, account.note, account.createdAt].map(quoteCsv).join(','));
    return { content: `\ufeff${[columns.join(','), ...rows].join('\n')}`, filename: `对标账号-${timestamp}.csv`, mimeType: 'text/csv;charset=utf-8', label: 'CSV' };
  }
  return { content: JSON.stringify({ format: 'benchmark-accounts-v1', exportedAt: new Date().toISOString(), accounts }, null, 2), filename: `对标账号-${timestamp}.json`, mimeType: 'application/json;charset=utf-8', label: 'JSON' };
}

function getAccountIdentity(account) {
  const url = typeof account.url === 'string' ? account.url.trim().replace(/\/+$/, '').toLowerCase() : '';
  if (url) return `url:${url}`;
  const name = typeof account.name === 'string' ? account.name.trim().toLowerCase() : '';
  const platform = typeof account.platform === 'string' ? account.platform.trim().toLowerCase() : '';
  return `profile:${platform}:${name}`;
}

function normalizeImportedAccount(account) {
  if (!account || typeof account !== 'object' || typeof account.name !== 'string' || !account.name.trim()) return null;
  return {
    id: makeBenchmarkId(),
    name: account.name.trim(),
    platform: PLATFORM_OPTIONS.includes(account.platform) ? account.platform : '其他',
    url: typeof account.url === 'string' ? account.url.trim() : '',
    niche: typeof account.niche === 'string' ? account.niche.trim() : '',
    note: typeof account.note === 'string' ? account.note.trim() : '',
    createdAt: typeof account.createdAt === 'string' ? account.createdAt : new Date().toISOString(),
  };
}

function PlatformIcon({ platform }) {
  const Icon = PLATFORM_ICONS[platform] || Globe2;
  return <span className={`benchmark-platform-icon platform-${platform || '其他'}`} aria-label={platform || '其他'} title={platform || '其他'}><Icon size={15} /></span>;
}

export function BenchmarkLibraryPanel({ onOpenBreakdown, onCreateProject }) {
  const [view, setView] = React.useState('topics');
  const [selectedTopicGroup, setSelectedTopicGroup] = React.useState('');
  const [videoTarget, setVideoTarget] = React.useState('');
  const [comparisonTarget, setComparisonTarget] = React.useState('');
  const [comparisonVideoIds, setComparisonVideoIds] = React.useState([]);
  const [addToTopic, setAddToTopic] = React.useState('');
  const [selectedAccountId, setSelectedAccountId] = React.useState('');
  const [accounts, setAccounts] = React.useState(loadBenchmarkAccounts);
  const [draft, setDraft] = React.useState(blankAccount);
  const [notice, setNotice] = React.useState('');
  const [isAccountFormOpen, setIsAccountFormOpen] = React.useState(false);
  const [editingAccountId, setEditingAccountId] = React.useState('');
  const [isExportPanelOpen, setIsExportPanelOpen] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState('json');
  const [exportDestination, setExportDestination] = React.useState('downloads');
  const accountImportInputRef = React.useRef(null);

  React.useEffect(() => { window.localStorage.setItem(BENCHMARK_ACCOUNTS_KEY, JSON.stringify(accounts)); }, [accounts]);
  React.useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const closeAccountForm = () => {
    setIsAccountFormOpen(false);
    setEditingAccountId('');
    setDraft(blankAccount());
  };

  const openNewAccountForm = () => {
    setEditingAccountId('');
    setDraft(blankAccount());
    setIsAccountFormOpen(true);
  };

  const openEditAccountForm = (account) => {
    setEditingAccountId(account.id);
    setDraft({ name: account.name || '', platform: PLATFORM_OPTIONS.includes(account.platform) ? account.platform : '其他', url: account.url || '', niche: account.niche || '', note: account.note || '' });
    setIsAccountFormOpen(true);
  };

  const saveAccount = (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setNotice('请先填写账号名称。');
      return;
    }
    if (editingAccountId) {
      setAccounts((current) => current.map((account) => account.id === editingAccountId ? { ...account, name, platform: draft.platform, url: draft.url.trim(), niche: draft.niche.trim(), note: draft.note.trim(), updatedAt: new Date().toISOString() } : account));
      closeAccountForm();
      setNotice(`已更新对标账号「${name}」。`);
      return;
    }
    setAccounts((current) => [{ id: makeBenchmarkId(), name, platform: draft.platform, url: draft.url.trim(), niche: draft.niche.trim(), note: draft.note.trim(), createdAt: new Date().toISOString() }, ...current]);
    closeAccountForm();
    setNotice(`已加入对标账号「${name}」。`);
  };

  const removeAccount = (account) => {
    if (!window.confirm(`确定删除对标账号「${account.name}」吗？其关联视频会保留为未归属账号。`)) return false;
    setAccounts((current) => current.filter((item) => item.id !== account.id));
    const videos = loadBenchmarkVideos();
    window.localStorage.setItem('video-collection-v1', JSON.stringify(videos.map((video) => video.accountId === account.id ? { ...video, accountId: '' } : video)));
    setNotice(`已删除账号「${account.name}」，关联视频已保留。`);
    return true;
  };

  const downloadExport = (exportFile) => {
    const blob = new Blob([exportFile.content], { type: exportFile.mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = exportFile.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
  };

  const exportAccounts = async () => {
    const exportFile = makeAccountExport(accounts, exportFormat);
    if (exportDestination === 'save-as' && typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: exportFile.filename,
          types: [{ description: `${exportFile.label} 文件`, accept: { [exportFile.mimeType.split(';')[0]]: [exportFile.filename.slice(exportFile.filename.lastIndexOf('.'))] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(exportFile.content);
        await writable.close();
        setIsExportPanelOpen(false);
        setNotice(`已另存 ${accounts.length} 个对标账号。`);
      } catch (error) {
        if (error?.name !== 'AbortError') setNotice('另存失败，请重试或改用默认下载位置。');
      }
      return;
    }
    downloadExport(exportFile);
    setIsExportPanelOpen(false);
    setNotice(exportDestination === 'save-as' ? `当前浏览器不支持另存为，已下载到默认位置。` : `已将 ${accounts.length} 个对标账号导出为 ${exportFile.label}。`);
  };

  const copyAccountExport = async () => {
    const exportFile = makeAccountExport(accounts, exportFormat);
    try {
      await navigator.clipboard.writeText(exportFile.content);
      setIsExportPanelOpen(false);
      setNotice(`已复制 ${accounts.length} 个对标账号的 ${exportFile.label} 内容。`);
    } catch {
      setNotice('复制失败，请允许浏览器访问剪贴板后重试。');
    }
  };

  const importAccounts = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setNotice('导入文件不能超过 1 MB。');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result || ''));
        const sourceAccounts = Array.isArray(payload) ? payload : payload?.accounts;
        if (!Array.isArray(sourceAccounts)) throw new Error('invalid-account-file');
        const identities = new Set(accounts.map(getAccountIdentity));
        const imported = sourceAccounts.map(normalizeImportedAccount).filter(Boolean);
        const additions = imported.filter((account) => {
          const identity = getAccountIdentity(account);
          if (identities.has(identity)) return false;
          identities.add(identity);
          return true;
        });
        if (!additions.length) {
          setNotice('没有可导入的新账号；重复账号已跳过。');
          return;
        }
        setAccounts((current) => [...additions, ...current]);
        setNotice(`已导入 ${additions.length} 个对标账号${sourceAccounts.length > additions.length ? '，重复或无效账号已跳过。' : '。'}`);
      } catch {
        setNotice('导入失败：请选择本工具导出的账号 JSON 文件。');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return <section className="benchmark-library" aria-label="对标库">
    <header className="benchmark-library-header">
      <div className="benchmark-library-toolbar">
        <nav className="benchmark-library-tabs" role="tablist" aria-label="对标库内容">
          <button type="button" role="tab" aria-selected={view === 'topics'} className={view === 'topics' ? 'active' : ''} onClick={() => setView('topics')}><Layers3 size={16} />母题库</button>
          <button type="button" role="tab" aria-selected={view === 'accounts'} className={view === 'accounts' ? 'active' : ''} onClick={() => setView('accounts')}><UsersRound size={16} />对标账号</button>
          <button type="button" role="tab" aria-selected={view === 'videos'} className={view === 'videos' ? 'active' : ''} onClick={() => { setSelectedAccountId(''); setVideoTarget(''); setComparisonTarget(''); setComparisonVideoIds([]); setAddToTopic(''); setView('videos'); }}><Film size={16} />对标视频</button>
        </nav>
        {view === 'accounts' && (
          <div className="benchmark-library-actions">
            <button className="benchmark-add-account-trigger" type="button" onClick={openNewAccountForm}><Plus size={17} />新增对标账号</button>
            <div className="benchmark-account-transfer">
              <button type="button" onClick={() => accountImportInputRef.current?.click()}><Upload size={16} />导入</button>
              <button type="button" onClick={() => setIsExportPanelOpen(true)}><Download size={16} />导出</button>
              <input ref={accountImportInputRef} type="file" accept="application/json,.json" onChange={importAccounts} tabIndex="-1" aria-label="导入对标账号 JSON 文件" />
            </div>
            {isExportPanelOpen && (
              <section className="benchmark-export-panel" role="dialog" aria-labelledby="benchmark-export-title">
                <header><div><h2 id="benchmark-export-title">导出对标账号</h2><p>选择文件格式和保存方式。</p></div><button type="button" aria-label="关闭导出设置" title="关闭" onClick={() => setIsExportPanelOpen(false)}><X size={18} /></button></header>
                <fieldset><legend>文件格式</legend><label><input type="radio" name="benchmark-export-format" value="json" checked={exportFormat === 'json'} onChange={() => setExportFormat('json')} />JSON <small>可再次导入本工具</small></label><label><input type="radio" name="benchmark-export-format" value="csv" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} />CSV <small>适合用表格软件查看</small></label><label><input type="radio" name="benchmark-export-format" value="txt" checked={exportFormat === 'txt'} onChange={() => setExportFormat('txt')} />TXT <small>适合直接阅读</small></label></fieldset>
                <fieldset><legend>导出位置</legend><label><input type="radio" name="benchmark-export-destination" value="downloads" checked={exportDestination === 'downloads'} onChange={() => setExportDestination('downloads')} />浏览器默认下载位置</label><label><input type="radio" name="benchmark-export-destination" value="save-as" checked={exportDestination === 'save-as'} onChange={() => setExportDestination('save-as')} />另存为…</label></fieldset>
                <p className="benchmark-export-hint">默认位置由浏览器的下载设置决定。</p>
                <footer>
                  <button className="benchmark-export-cancel" type="button" onClick={() => setIsExportPanelOpen(false)}>取消</button>
                  <button className="benchmark-export-copy" type="button" onClick={copyAccountExport}><Copy size={16} />复制到剪贴板</button>
                  <button className="benchmark-export-confirm" type="button" onClick={exportAccounts}><Download size={16} />导出 {exportFormat.toUpperCase()}</button>
                </footer>
              </section>
            )}
          </div>
        )}
      </div>
    </header>
    {notice && <p className="benchmark-library-notice" role="status">{notice}</p>}
    {view === 'topics' ? <TopicLibraryHome selectedGroup={selectedTopicGroup} onSelectGroup={setSelectedTopicGroup} onOpenVideo={(id) => { setSelectedAccountId(''); setVideoTarget(id); setComparisonTarget(''); setComparisonVideoIds([]); setAddToTopic(''); setView('videos'); }} onAddVideo={(name) => { setSelectedAccountId(''); setVideoTarget(''); setComparisonTarget(''); setComparisonVideoIds([]); setAddToTopic(name); setView('videos'); }} onOpenComparison={(name, ids = []) => { setSelectedAccountId(''); setVideoTarget(''); setComparisonTarget(name); setComparisonVideoIds(ids); setAddToTopic(''); setView('videos'); }} onOpenVideos={() => { setSelectedAccountId(''); setVideoTarget(''); setComparisonTarget(''); setComparisonVideoIds([]); setAddToTopic(''); setView('videos'); }} /> : view === 'accounts' ? <section className="benchmark-account-layout">
      <div className="benchmark-account-create">
      {isAccountFormOpen && <article className="benchmark-account-form-card">
        <div className="benchmark-account-form-heading"><div className="benchmark-section-heading"><span><Radio size={18} /></span><div><h2>{editingAccountId ? '修改对标账号' : '新增对标账号'}</h2><p>{editingAccountId ? '调整账号资料，或在此删除该账号。' : '建立长期观察对象，之后可在对标视频与拆解学习中选择。'}</p></div></div><button className="benchmark-account-form-close" type="button" aria-label="关闭账号表单" title="关闭" onClick={closeAccountForm}><X size={18} /></button></div>
        <form onSubmit={saveAccount} className="benchmark-account-form">
          <label>账号名称<input value={draft.name} onFocus={() => { if (!draft.name) setDraft({ ...draft, name: '@' }); }} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="例如：剧情研究所" maxLength="60" autoFocus /></label>
          <label>平台<select value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value })}>{PLATFORM_OPTIONS.map((platform) => <option value={platform} key={platform}>{platform}</option>)}</select></label>
          <label>主页链接（可选）<input type="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://…" /></label>
          <label>赛道 / 定位（可选）<input value={draft.niche} onChange={(event) => setDraft({ ...draft, niche: event.target.value })} placeholder="例如：反转剧情短视频" maxLength="60" /></label>
          <label className="full">为什么值得对标（可选）<textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="我想持续研究它的什么能力？" rows="1" maxLength="300" /></label>
          <div className="benchmark-account-form-actions">{editingAccountId && <button className="benchmark-account-delete-action" type="button" onClick={() => { const account = accounts.find((item) => item.id === editingAccountId); if (account && removeAccount(account)) closeAccountForm(); }}><Trash2 size={16} />删除账号</button>}<button type="submit">{editingAccountId ? <><Pencil size={16} />保存修改</> : <><Plus size={16} />加入对标账号</>}</button></div>
        </form>
      </article>}
      </div>
      {accounts.map((account) => <AccountCard account={account} key={account.id} onEdit={() => openEditAccountForm(account)} onViewVideos={(item) => { setSelectedAccountId(item.id); setVideoTarget(''); setComparisonTarget(''); setComparisonVideoIds([]); setAddToTopic(''); setView('videos'); }} />)}
    </section> : <VideoCollectionPanel initialAccountId={selectedAccountId} initialVideoId={videoTarget} initialTopicGroup={addToTopic} initialComparisonGroup={comparisonTarget} initialComparisonVideoIds={comparisonVideoIds} onOpenBreakdown={onOpenBreakdown} onCreateProject={onCreateProject} />}
  </section>;
}

function AccountCard({ account, onEdit, onViewVideos }) {
  const [videoCount, setVideoCount] = React.useState(0);
  React.useEffect(() => { setVideoCount(loadBenchmarkVideos().filter((video) => video.accountId === account.id).length); }, [account.id]);
  const summary = [account.niche, account.note].filter(Boolean).join(' · ');
  return <article className="benchmark-account-card">
    <div className="benchmark-account-copy"><header className="benchmark-account-card-heading"><div className="benchmark-account-identity"><PlatformIcon platform={account.platform} />{account.url ? <a className="benchmark-account-name-link" href={account.url} target="_blank" rel="noreferrer">{account.name}</a> : <h3>{account.name}</h3>}</div><button className="benchmark-account-edit" type="button" onClick={onEdit} aria-label={`修改${account.name}`} title="修改账号"><Pencil size={16} /></button></header><p className="benchmark-account-summary" aria-hidden={summary ? undefined : true}>{summary || '\u00a0'}</p><footer><b>{videoCount} 条作品</b><span className="benchmark-account-footer-divider" aria-hidden="true">·</span><button type="button" aria-label={`查看${account.name}已收录作品`} title="查看已收录作品" onClick={() => onViewVideos(account)}>查看</button></footer></div>
  </article>;
}
