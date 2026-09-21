import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  ArrowUp,
  Bold,
  CalendarDays,
  Check,
  CheckCircle2,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Clock3,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  FileText,
  Film,
  Flag,
  Flame,
  Github,
  GripVertical,
  House,
  ListTodo,
  LibraryBig,
  List,
  ListOrdered,
  LayoutDashboard,
  Link2,
  LogIn,
  LogOut,
  MoreHorizontal,
  NotebookPen,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Pencil,
  Plus,
  Scissors,
  Save,
  Settings2,
  Smile,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserPlus,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { matrixOptions, pages, statusOptions, tabs, taskViews } from './config';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages';
import { LongTermTasksPanel } from './components/LongTermTasksPanel';
import { SubscriptionsPanel } from './components/SubscriptionsPanel';
import { CreatorDashboard } from './components/CreatorDashboard';
import { VideoCollectionPanel } from './components/VideoCollectionPanel';
import { WebsiteNavigationPanel, WebsiteQuickLinks } from './components/WebsiteNavigationPanel';
import { FocusTimerCard } from './components/FocusTimerCard';
import { getBenchmarkMetadataFields } from './components/BenchmarkVideoDetails';
import {
  formatDate,
  formatFullDate,
  formatTime,
  getGreeting,
  getMonthDays,
  getRelativeDate,
  getToday,
} from './utils/date';
import {
  filterTasks,
  getLabel,
  getTaskListEmptyText,
  getTaskTimingInfo,
  isTaskOverdue,
  sortTasks,
} from './utils/tasks';
import { isLongTermTask, parseLongTermTask, serializeLongTermTask } from './utils/longTermTasks';
import './styles.css';

const DEFAULT_TASK_CATEGORIES = [
  { id: 'default-life', name: '生活', color: '#247b55', sort_order: 0 },
  { id: 'default-work', name: '工作', color: '#3976d5', sort_order: 1 },
];

const TASK_CATEGORY_COLOR_PRESETS = [
  { name: '松绿', value: '#247b55' },
  { name: '信息蓝', value: '#3976d5' },
  { name: '柔橙', value: '#c97808' },
  { name: '创意紫', value: '#7647c8' },
];

function makeNickname(email = '') {
  const prefix = email.split('@')[0] || '用户';
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${number}`;
}

function getWorkspacePreviewTasks() {
  const today = getToday();
  return [
    {
      id: 'preview-long-term-account',
      user_id: 'preview-user',
      title: '每天进行直播',
      description: serializeLongTermTask({
        version: 1,
        type: 'account',
        lifecycle: 'active',
        startDate: today,
        endDate: null,
        resetTime: '00:00',
        schedule: { type: 'daily' },
        accounts: [
          { id: 'preview-a', name: '直播主账号', platform: '抖音', url: 'https://example.com', instructions: '进入直播间并完成直播', targetCount: 1, unlimited: false },
          { id: 'preview-b', name: '直播副账号 A', platform: '快手', url: 'https://example.com', instructions: '进入直播间并完成直播', targetCount: 1, unlimited: false },
          { id: 'preview-c', name: '直播副账号 B', platform: '视频号', url: 'https://example.com', instructions: '进入直播间并完成直播', targetCount: 1, unlimited: false },
        ],
        checkins: { [today]: { state: 'partial', accountCounts: { 'preview-a': 1, 'preview-b': 1 } } },
        currentStep: null,
        stepHistory: [],
      }),
      task_date: today,
      task_time: null,
      matrix_category: 'important_not_urgent',
      status: 'in_progress',
      created_at: new Date().toISOString(),
    },
    {
      id: 'preview-long-term-project',
      user_id: 'preview-user',
      title: '搭建个人知识库',
      description: serializeLongTermTask({
        version: 1,
        type: 'project',
        lifecycle: 'active',
        startDate: today,
        endDate: null,
        resetTime: '00:00',
        schedule: { type: 'daily' },
        accounts: [],
        checkins: {},
        currentStep: { id: 'preview-step', title: '整理首页的信息结构和栏目名称', notes: '', status: 'in_progress', startedAt: today },
        stepHistory: [],
      }),
      task_date: today,
      task_time: null,
      matrix_category: 'important_not_urgent',
      status: 'in_progress',
      created_at: new Date().toISOString(),
    },
    {
      id: 'preview-schedule-planning',
      user_id: 'preview-user',
      title: '整理本周内容方向',
      description: '',
      task_date: today,
      end_date: getRelativeDate(2),
      task_time: '09:30',
      end_time: '10:30',
      matrix_category: 'important_not_urgent',
      status: 'not_started',
      created_at: new Date().toISOString(),
    },
    {
      id: 'preview-schedule-cover',
      user_id: 'preview-user',
      title: '确认视频封面方案',
      description: '',
      task_date: today,
      task_time: '14:00',
      end_time: '15:00',
      matrix_category: 'important_urgent',
      status: 'in_progress',
      created_at: new Date().toISOString(),
    },
    {
      id: 'preview-schedule-review',
      user_id: 'preview-user',
      title: '复盘今天的素材收集',
      description: '',
      task_date: today,
      task_time: '19:30',
      end_time: '20:00',
      matrix_category: 'not_urgent_not_important',
      status: 'not_started',
      created_at: new Date().toISOString(),
    },
  ];
}

function App() {
  const isWorkspacePreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('workspace-preview');
  const isPasswordReset = new URLSearchParams(window.location.search).has('reset-password');
  const requestedPreviewTab = new URLSearchParams(window.location.search).get('workspace-tab');
  const [currentPage, setCurrentPage] = React.useState(
    isWorkspacePreview ? pages.workspace : isPasswordReset ? pages.resetPassword : pages.workspace,
  );
  const [passwordRecoveryEmail, setPasswordRecoveryEmail] = React.useState('');
  const [workspaceTab, setWorkspaceTab] = React.useState(
    isWorkspacePreview && Object.values(tabs).includes(requestedPreviewTab) ? requestedPreviewTab : tabs.dashboard,
  );
  const [session, setSession] = React.useState(isWorkspacePreview ? { user: { id: 'preview-user', email: 'preview@example.com' } } : null);
  const [profile, setProfile] = React.useState(isWorkspacePreview ? { id: 'preview-user', nickname: '预览账号' } : null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState('login');

  const openAuthModal = React.useCallback((mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  React.useEffect(() => {
    if (isWorkspacePreview) return undefined;
    if (!supabase) {
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setCurrentPage(pages.resetPassword);
        return;
      }
      if (nextSession) {
        setIsAuthModalOpen(false);
        setCurrentPage(pages.workspace);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [isWorkspacePreview]);

  React.useEffect(() => {
    async function loadProfile() {
      if (isWorkspacePreview) return;
      if (!session || !supabase) {
        setProfile(null);
        return;
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (data) {
        setProfile(data);
        return;
      }

      const nickname = makeNickname(session.user.email);
      const { data: createdProfile } = await supabase
        .from('profiles')
        .insert({ id: session.user.id, nickname })
        .select('*')
        .single();
      setProfile(createdProfile ?? { id: session.user.id, nickname });
    }

    loadProfile();
  }, [isWorkspacePreview, session]);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentPage(pages.workspace);
    setIsAuthModalOpen(false);
  }

  return (
    <main className={
      currentPage === pages.workspace
        ? 'app-shell workspace-app-shell'
      : currentPage === pages.publicNotes
          ? 'app-shell public-app-shell'
          : currentPage === pages.forgotPassword || currentPage === pages.resetPassword
            ? 'app-shell auth-app-shell'
          : 'app-shell'
    }>
      {currentPage !== pages.workspace && <nav className="top-nav" aria-label="主导航">
        <button className="brand" onClick={() => setCurrentPage(pages.workspace)}>
          <span className="brand-mark">
            <NotebookPen size={20} />
          </span>
          <span>日程笔记</span>
        </button>

        <div className="nav-actions">
          {currentPage === pages.publicNotes && session ? (
            <button
              className="text-button"
              onClick={() => {
                setWorkspaceTab(tabs.dashboard);
                setCurrentPage(pages.workspace);
              }}
            >
              返回私人工作台
            </button>
          ) : (
            <button className="text-button" onClick={() => setCurrentPage(pages.publicNotes)}>
              公开笔记
            </button>
          )}
          {currentPage !== pages.home && (
            <a
              className="icon-button"
              href="https://github.com/kxj0605/image-notes-starter"
              aria-label="GitHub 代码"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={18} />
            </a>
          )}

          {session ? (
            <>
              <button
                className="text-button user-pill"
                onClick={() => {
                  setWorkspaceTab(tabs.profile);
                  setCurrentPage(pages.workspace);
                }}
              >
                {profile?.nickname ?? session.user.email}
              </button>
              <button className="primary-button" onClick={handleSignOut}>
                <LogOut size={17} />
                退出
              </button>
            </>
          ) : (
            <>
              <button className="text-button" onClick={() => openAuthModal('login')}>
                <LogIn size={17} />
                登录
              </button>
              {currentPage !== pages.home && (
                <button className="primary-button" onClick={() => openAuthModal('register')}>
                  <UserPlus size={17} />
                  注册
                </button>
              )}
            </>
          )}
        </div>
      </nav>}

      {currentPage === pages.forgotPassword && (
        <ForgotPasswordPage
          initialEmail={passwordRecoveryEmail}
          onLogin={() => {
            setCurrentPage(pages.workspace);
            openAuthModal('login');
          }}
        />
      )}
      {currentPage === pages.resetPassword && (
        <ResetPasswordPage
          onLogin={() => {
            setCurrentPage(pages.workspace);
            openAuthModal('login');
          }}
          onDone={() => {
            setWorkspaceTab(tabs.dashboard);
            setCurrentPage(pages.workspace);
          }}
        />
      )}
      {currentPage === pages.publicNotes && <PublicNotesPage session={session} profile={profile} onLogin={() => openAuthModal('login')} />}
      {currentPage === pages.workspace && (
        <WorkspacePage
          session={session}
          profile={profile}
          initialTab={workspaceTab}
          onProfileChange={setProfile}
          onLogin={() => openAuthModal('login')}
          onSignOut={handleSignOut}
        />
      )}
      {isAuthModalOpen && (
        <div className="auth-modal" role="dialog" aria-modal="true" aria-label={authModalMode === 'login' ? '登录' : '注册'} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsAuthModalOpen(false);
        }}>
          <div className="auth-modal-panel">
            <button className="auth-modal-close" type="button" onClick={() => setIsAuthModalOpen(false)} aria-label="关闭登录窗口" title="关闭">
              <X size={18} />
            </button>
            {authModalMode === 'login' ? (
              <LoginPage
                onRegister={() => setAuthModalMode('register')}
                onForgotPassword={(email) => {
                  setPasswordRecoveryEmail(email);
                  setIsAuthModalOpen(false);
                  setCurrentPage(pages.forgotPassword);
                }}
                onDone={() => {
                  setWorkspaceTab(tabs.dashboard);
                  setIsAuthModalOpen(false);
                  setCurrentPage(pages.workspace);
                }}
              />
            ) : (
              <RegisterPage
                onLogin={() => setAuthModalMode('login')}
                onDone={() => {
                  setWorkspaceTab(tabs.dashboard);
                  setIsAuthModalOpen(false);
                  setCurrentPage(pages.workspace);
                }}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function WorkspacePage({ session, profile, initialTab, onProfileChange, onLogin, onSignOut }) {
  const [activeTab, setActiveTab] = React.useState(
    initialTab === tabs.calendar || initialTab === tabs.matrix ? tabs.tasks : initialTab,
  );
  const [selectedCollectionVideo, setSelectedCollectionVideo] = React.useState(null);
  const [notes, setNotes] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [theme, setTheme] = React.useState(() => window.localStorage.getItem('workspace-theme') || 'default');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [taskViewRequest, setTaskViewRequest] = React.useState(null);
  const [isWebsiteCreateRequested, setIsWebsiteCreateRequested] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!session || !supabase) return;

    if (session.user.id === 'preview-user') {
      setNotes([]);
      setTasks(getWorkspacePreviewTasks());
      return;
    }

    setIsLoading(true);
    const [{ data: noteData, error: noteError }, { data: taskData, error: taskError }] = await Promise.all([
      supabase.from('notes').select('*').order('created_at', {
        ascending: false,
      }),
      supabase.from('tasks').select('*').order('task_date', { ascending: true }).order('created_at', { ascending: true }),
    ]);
    setIsLoading(false);

    if (noteError || taskError) {
      setMessage(`读取数据失败：${noteError?.message ?? taskError?.message}`);
      return;
    }

    setNotes(noteData ?? []);
    setTasks((taskData ?? []).sort(sortTasks));
  }, [session]);

  React.useEffect(() => {
    setActiveTab(initialTab === tabs.calendar || initialTab === tabs.matrix ? tabs.tasks : initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    window.localStorage.setItem('workspace-theme', theme);
  }, [theme]);

  const isGuest = !session;
  const today = getToday();
  const todayTasks = tasks.filter((task) => !isLongTermTask(task) && task.task_date === today);
  const importantTodayTasks = todayTasks.filter(
    (task) => task.status !== 'completed' && task.matrix_category.startsWith('important_'),
  );
  const creatorTabs = [tabs.creator, tabs.creatorProjects, tabs.creatorCollection, tabs.breakdown, tabs.creatorMaterials, tabs.creatorReview];
  const isCreatorTab = creatorTabs.includes(activeTab);
  const workspaceTitle = {
    [tabs.creator]: '创作概览',
    [tabs.creatorProjects]: '项目',
    [tabs.creatorCollection]: '灵感视频',
    [tabs.breakdown]: '拆解学习',
    [tabs.creatorMaterials]: '素材库',
    [tabs.creatorReview]: '复盘',
    [tabs.notes]: '笔记',
    [tabs.tasks]: '事件',
    [tabs.subscriptions]: '订阅',
    [tabs.websites]: '常用网址',
    [tabs.publicNotes]: '公开笔记',
    [tabs.profile]: '设置',
  }[activeTab];
  const workspaceDescription = {
    [tabs.creator]: '查看当前创作节奏，并回到最需要推进的一步。',
    [tabs.creatorProjects]: '管理每支视频的制作步骤；本阶段不与个人任务合并。',
    [tabs.creatorCollection]: '收集灵感视频，在同一张卡中补全对标资料并开始拆解。',
    [tabs.breakdown]: '按故事、情绪和传播维度，拆解对标视频的脚本结构。',
    [tabs.creatorMaterials]: '沉淀并复用创作中常用的提示词与参考资料。',
    [tabs.creatorReview]: '回看创作过程中的阶段记录与学习沉淀。',
    [tabs.notes]: `共 ${notes.length} 篇笔记，记录想法并决定内容是否公开。`,
    [tabs.tasks]: `今天有 ${todayTasks.length} 项任务，单次任务、日历、四象限与长期追踪都集中在这里。`,
    [tabs.websites]: '按分类整理常用网站，随时用搜索和两种视图快速找到它。',
  }[activeTab];
  const displayName = isGuest ? '访客' : profile?.nickname ?? session.user.email?.split('@')[0] ?? '用户';
  const accountEmail = isGuest ? '登录后开始使用' : session.user.email ?? '';
  const profileAvatarUrl = profile?.avatar_url;
  const navigateTo = (tab) => {
    if (isGuest && tab !== tabs.dashboard && tab !== tabs.publicNotes) {
      onLogin();
      return;
    }
    setTaskViewRequest(tab === tabs.tasks ? taskViews.list : null);
    setActiveTab(tab);
    setIsUserMenuOpen(false);
  };

  const openScheduleManager = () => {
    if (isGuest) {
      onLogin();
      return;
    }
    setTaskViewRequest(taskViews.calendar);
    setActiveTab(tabs.tasks);
  };

  const openWebsiteLibrary = (openCreate = false) => {
    if (isGuest) {
      onLogin();
      return;
    }
    setIsWebsiteCreateRequested(openCreate);
    navigateTo(tabs.websites);
  };

  return (
    <section className={`workspace-frame workspace-theme-${theme}${isGuest ? ' workspace-guest' : ''}${isSidebarCollapsed ? ' sidebar-collapsed' : ''}${isSidebarHidden ? ' sidebar-hidden' : ''}`}>
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar-top">
          <button className="workspace-brand" type="button" onClick={() => isGuest ? setActiveTab(tabs.dashboard) : navigateTo(tabs.dashboard)} title="日程笔记">
            <span className="workspace-brand-mark" aria-hidden="true"><Sparkles size={18} /></span>
            <span className="workspace-brand-text">日程笔记</span>
          </button>
          <button
            className="sidebar-collapse-button"
            type="button"
            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
            title={isSidebarCollapsed ? '展开菜单' : '收起菜单'}
            aria-label={isSidebarCollapsed ? '展开菜单' : '收起菜单'}
          >
            {isSidebarCollapsed ? '»' : '«'}
          </button>
          <button
            className="sidebar-hide-button"
            type="button"
            onClick={() => {
              setIsSidebarHidden(true);
              setIsSidebarCollapsed(false);
              setIsUserMenuOpen(false);
            }}
            title="隐藏菜单"
            aria-label="隐藏菜单"
          >
            <PanelLeftClose size={19} />
          </button>
        </div>

        <p className="sidebar-section-label">工作模块</p>
        <div className="workspace-module-group">
          <button className={`sidebar-module-button ${!isCreatorTab ? 'active' : ''}`} type="button" onClick={() => navigateTo(tabs.dashboard)} aria-label="个人" title="个人" aria-expanded={!isCreatorTab}>
            <House size={23} strokeWidth={2.4} />
            <span>个人</span>
            {!isCreatorTab ? <ChevronDown size={16} className="sidebar-module-chevron" /> : <ChevronRight size={16} className="sidebar-module-chevron" />}
          </button>
          {!isCreatorTab && (
            <nav className="workspace-nav sidebar-child-list" aria-label="个人导航">
              <SidebarButton icon={LayoutDashboard} label="首页" active={activeTab === tabs.dashboard} onClick={() => navigateTo(tabs.dashboard)} />
              <SidebarButton icon={CheckCircle2} label="待办" active={activeTab === tabs.tasks} onClick={() => navigateTo(tabs.tasks)} />
              <SidebarButton icon={NotebookPen} label="笔记" active={activeTab === tabs.notes} onClick={() => navigateTo(tabs.notes)} />
              <SidebarButton icon={Wifi} label="订阅" active={activeTab === tabs.subscriptions} onClick={() => navigateTo(tabs.subscriptions)} />
              <SidebarButton icon={Link2} label="常用网址" active={activeTab === tabs.websites} onClick={() => navigateTo(tabs.websites)} />
            </nav>
          )}
        </div>

        <div className="workspace-module-group">
          <button className={`sidebar-module-button ${isCreatorTab ? 'active' : ''}`} type="button" onClick={() => navigateTo(tabs.creator)} aria-label="工作台" title="工作台" aria-expanded={isCreatorTab}>
            <RoundedFolderIcon size={23} strokeWidth={2.4} />
            <span>工作台</span>
            {isCreatorTab ? <ChevronDown size={16} className="sidebar-module-chevron" /> : <ChevronRight size={16} className="sidebar-module-chevron" />}
          </button>
          {isCreatorTab && (
            <nav className="workspace-nav sidebar-child-list" aria-label="工作台导航">
              <SidebarButton icon={ChartNoAxesColumnIncreasing} label="创作概览" active={activeTab === tabs.creator} onClick={() => navigateTo(tabs.creator)} />
              <SidebarButton icon={Flag} label="项目" active={activeTab === tabs.creatorProjects} onClick={() => navigateTo(tabs.creatorProjects)} />
              <SidebarButton icon={Film} label="灵感视频" active={activeTab === tabs.creatorCollection} onClick={() => navigateTo(tabs.creatorCollection)} />
              <SidebarButton icon={PanelsTopLeft} label="拆解学习" active={activeTab === tabs.breakdown} onClick={() => navigateTo(tabs.breakdown)} />
              <SidebarButton icon={LibraryBig} label="素材库" active={activeTab === tabs.creatorMaterials} onClick={() => navigateTo(tabs.creatorMaterials)} />
              <SidebarButton icon={Clock3} label="复盘" active={activeTab === tabs.creatorReview} onClick={() => navigateTo(tabs.creatorReview)} />
            </nav>
          )}
        </div>

        <div className="workspace-global-actions">
          <div className="sidebar-divider" />
          <p className="sidebar-section-label">全局操作</p>
          <button className={activeTab === tabs.publicNotes ? 'sidebar-global-button active' : 'sidebar-global-button'} type="button" onClick={() => navigateTo(tabs.publicNotes)} aria-label="公开笔记" title="公开笔记">
            <FileText size={20} />
            <span>公开笔记</span>
          </button>
          <button className={activeTab === tabs.profile ? 'sidebar-global-button active' : 'sidebar-global-button'} type="button" onClick={() => navigateTo(tabs.profile)} aria-label="设置" title="设置">
            <Settings2 size={20} />
            <span>设置</span>
          </button>
        </div>

        <div className="workspace-sidebar-footer">
          <div className="sidebar-user-area">
            <button className="profile-entry" type="button" onClick={() => isGuest ? onLogin() : setIsUserMenuOpen((open) => !open)} aria-expanded={isGuest ? false : isUserMenuOpen} aria-haspopup={isGuest ? undefined : 'menu'} aria-label={isGuest ? '登录或注册' : '打开用户菜单'}>
              <span className="profile-avatar">
                {profileAvatarUrl ? <img src={profileAvatarUrl} alt="" /> : displayName.slice(0, 1)}
              </span>
              <span className="profile-entry-copy"><span>{displayName}</span><small>{accountEmail}</small></span>
              <ChevronDown size={15} className="profile-menu-chevron" aria-hidden="true" />
            </button>
            {!isGuest && isUserMenuOpen && (
              <div className="sidebar-user-menu" role="menu" aria-label="用户菜单">
                <button type="button" role="menuitem" onClick={() => navigateTo(tabs.profile)}>个人资料</button>
                <button type="button" role="menuitem" onClick={() => navigateTo(tabs.profile)}>账号设置</button>
                <button type="button" role="menuitem" className="sidebar-user-signout" onClick={onSignOut}>退出</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="workspace-content">
        {isSidebarHidden && (
          <button
            className="sidebar-show-button"
            type="button"
            onClick={() => setIsSidebarHidden(false)}
            title="显示菜单"
            aria-label="显示菜单"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        {activeTab === tabs.dashboard && (
          <header className="workspace-heading dashboard-heading">
            <div>
              {isGuest ? (
                <>
                  <h1 className="dashboard-greeting">个人工作台</h1>
                  <p className="auth-state dashboard-date-line">登录后即可记录任务、笔记与创作内容。</p>
                </>
              ) : (
                <>
                  <h1 className="dashboard-greeting">
                    <span>{getGreeting()}</span>
                    <span className="greeting-wave" aria-hidden="true">👋</span>
                  </h1>
                  <p className="auth-state dashboard-date-line">
                    今天是 {formatFullDate()}。你今天有 <strong>{importantTodayTasks.length} 个重要任务</strong> 待办。
                  </p>
                </>
              )}
            </div>
          </header>
        )}

        {activeTab !== tabs.dashboard && activeTab !== tabs.creator && activeTab !== tabs.creatorCollection && (
          <header className="workspace-heading compact-heading">
            <div>
              <h1>{workspaceTitle}</h1>
              {workspaceDescription && <p className="auth-state">{workspaceDescription}</p>}
            </div>
          </header>
        )}

        {message && <p className="form-message global-message">{message}</p>}
        {isLoading && <p className="form-message global-message">正在读取数据...</p>}

        {activeTab === tabs.dashboard && (
          <Dashboard notes={notes} tasks={tasks} onOpenTasks={() => navigateTo(tabs.tasks)} onOpenSchedule={openScheduleManager} onOpenNotes={() => navigateTo(tabs.notes)} onOpenWebsites={() => openWebsiteLibrary(false)} onAddWebsite={() => openWebsiteLibrary(true)} onToggleScheduleTask={(task) => {
            if (isGuest) {
              onLogin();
              return;
            }
            updateTaskStatus(task, task.status === 'completed' ? 'in_progress' : 'completed', setTasks, setMessage);
          }} />
        )}
        {activeTab === tabs.creator && <CreatorDashboard view="overview" />}
        {activeTab === tabs.creatorProjects && <CreatorDashboard view="projects" />}
        {activeTab === tabs.creatorCollection && <VideoCollectionPanel onOpenBreakdown={(video) => { setSelectedCollectionVideo(video); setActiveTab(tabs.breakdown); }} />}
        {activeTab === tabs.creatorMaterials && <CreatorDashboard view="materials" />}
        {activeTab === tabs.creatorReview && <CreatorDashboard view="review" />}
        {activeTab === tabs.notes && (
          <NotesPanel session={session} notes={notes} setNotes={setNotes} setMessage={setMessage} />
        )}
        {activeTab === tabs.tasks && (
          <TasksPanel initialTaskView={taskViewRequest ?? taskViews.list} session={session} tasks={tasks} setTasks={setTasks} setMessage={setMessage} />
        )}
        {activeTab === tabs.breakdown && <ScriptBreakdownPanel collectionVideo={selectedCollectionVideo} />}
        {activeTab === tabs.subscriptions && (
          <SubscriptionsPanel session={session} setMessage={setMessage} />
        )}
        {activeTab === tabs.websites && <WebsiteNavigationPanel openCreateOnMount={isWebsiteCreateRequested} onCreateRequestHandled={() => setIsWebsiteCreateRequested(false)} />}
        {activeTab === tabs.publicNotes && (
          <PublicNotesPage session={session} profile={profile} onLogin={onLogin} embedded />
        )}
        {activeTab === tabs.profile && (
          <ProfilePanel
            session={session}
            profile={profile}
            onProfileChange={onProfileChange}
            setMessage={setMessage}
            theme={theme}
            setTheme={setTheme}
            onSignOut={onSignOut}
          />
        )}
      </div>
      <ScrollToTopButton />
    </section>
  );
}

function ScrollToTopButton() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const updateProgress = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(documentHeight > 0 ? Math.round((window.scrollY / documentHeight) * 100) : 0);
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  if (progress <= 50) return null;

  return (
    <button
      className="scroll-top-button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={`回到顶部，当前浏览进度 ${progress}%`}
      title={`回到顶部 · ${progress}%`}
      style={{ '--scroll-progress': `${progress * 3.6}deg` }}
    >
      <span className="scroll-top-button-surface">
        <ArrowUp size={18} aria-hidden="true" />
      </span>
    </button>
  );
}

function RoundedFolderIcon({ size = 20, strokeWidth = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8.25A2.25 2.25 0 0 1 6.25 6h4.15l1.7 1.9h5.65A2.25 2.25 0 0 1 20 10.15v7.6A2.25 2.25 0 0 1 17.75 20H6.25A2.25 2.25 0 0 1 4 17.75z" />
    </svg>
  );
}

function SidebarButton({ icon: Icon, label, active = false, onClick }) {
  return (
    <button className={active ? 'sidebar-nav-button active' : 'sidebar-nav-button'} type="button" onClick={onClick} aria-label={label} title={label}>
      <Icon size={22} strokeWidth={1.7} />
      <span>{label}</span>
    </button>
  );
}

function parseDouyinAuthorProfile(value) {
  const match = typeof value === 'string'
    ? value.trim().match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/)
    : null;
  if (!match) return null;

  try {
    const url = new URL(match[2]);
    const isDouyinProfile = url.protocol === 'https:'
      && ['douyin.com', 'www.douyin.com'].includes(url.hostname)
      && url.pathname.startsWith('/user/');
    return isDouyinProfile ? { label: match[1].trim(), href: url.href } : null;
  } catch {
    return null;
  }
}

const scriptBreakdownNavItems = [
  { id: 'script-breakdown-timeline', label: '视频拆解时间轴' },
  { id: 'script-breakdown-video-type', label: '视频类型' },
  { id: 'script-breakdown-universal', label: '通用传播维度' },
  { id: 'script-breakdown-structure', label: '剧情结构' },
  { id: 'script-breakdown-extra', label: '补充维度' },
  { id: 'script-breakdown-ai', label: 'AI 独立拆解' },
  { id: 'script-breakdown-compare', label: '颜色对照' },
];

const breakdownStylePreviewOptions = [
  { id: 'blueprint', label: '方案 A · 专注蓝图', summary: '更清晰的编辑层级与蓝色工作流提示' },
  { id: 'paper', label: '方案 B · 轻纸研究', summary: '留白更多，阅读与思考更安静' },
  { id: 'timeline', label: '方案 C · 剪辑轨道', summary: '用柔紫轨道强调叙事步骤与进度' },
];

const VIDEO_TIMELINE_DEFAULT_TYPES = [
  { id: 'camera-wide', group: '镜头类', label: '全景', color: '#3976d5' },
  { id: 'camera-close', group: '镜头类', label: '特写', color: '#3976d5' },
  { id: 'camera-medium', group: '镜头类', label: '中景', color: '#3976d5' },
  { id: 'camera-push', group: '镜头类', label: '推镜', color: '#3976d5' },
  { id: 'camera-pull', group: '镜头类', label: '拉镜', color: '#3976d5' },
  { id: 'camera-transition', group: '镜头类', label: '转场', color: '#3976d5' },
  { id: 'camera-turn', group: '镜头类', label: '转折镜头', color: '#3976d5' },
  { id: 'story-hook', group: '叙事类', label: '钩子', color: '#7647c8' },
  { id: 'story-setup', group: '叙事类', label: '铺垫', color: '#7647c8' },
  { id: 'story-reversal', group: '叙事类', label: '反转', color: '#7647c8' },
  { id: 'story-climax', group: '叙事类', label: '高潮', color: '#7647c8' },
  { id: 'story-ending', group: '叙事类', label: '收尾', color: '#7647c8' },
  { id: 'story-foreshadowing', group: '叙事类', label: '伏笔', color: '#7647c8' },
  { id: 'sound-dialogue', group: '声音类', label: '台词点', color: '#c97808' },
  { id: 'sound-bgm', group: '声音类', label: 'BGM 切入', color: '#c97808' },
  { id: 'sound-effect', group: '声音类', label: '音效', color: '#c97808' },
  { id: 'sound-silence', group: '声音类', label: '静音点', color: '#c97808' },
  { id: 'text-subtitle', group: '文本类', label: '字幕', color: '#247b55' },
  { id: 'text-styled', group: '文本类', label: '花字', color: '#247b55' },
  { id: 'text-card', group: '文本类', label: '信息卡片', color: '#247b55' },
];

const createVideoTimelineId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const VIDEO_TIMELINE_DRAG_STEP_SECONDS = 1;
const VIDEO_TIMELINE_RULER_INTERVAL_SECONDS = 30;
const VIDEO_TIMELINE_MIN_VISIBLE_SECONDS = 60;
const clampVideoTimelineTime = (value, duration) => Math.max(0, Math.min(duration, value));
const snapVideoTimelineTime = (value) => Math.round(value / VIDEO_TIMELINE_DRAG_STEP_SECONDS) * VIDEO_TIMELINE_DRAG_STEP_SECONDS;
const formatVideoTimelineTime = (value = 0) => {
  const seconds = Math.max(0, snapVideoTimelineTime(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - (minutes * 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
};
const formatVideoTimelineRange = (start, end) => end !== null && end > start
  ? `${formatVideoTimelineTime(start)} ~ ${formatVideoTimelineTime(end)}`
  : formatVideoTimelineTime(start);
const parseVideoTimelineTime = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const timecodeMatch = normalized.match(/^(\d+):(\d{1,2})$/);
  if (timecodeMatch) return (Number(timecodeMatch[1]) * 60) + Number(timecodeMatch[2]);
  const decimalMinutes = Number(normalized);
  return Number.isFinite(decimalMinutes) && decimalMinutes >= 0 ? decimalMinutes * 60 : null;
};

function ScriptBreakdownPanel({ collectionVideo = null }) {
  const breakdownStylePreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('style-preview');
  const requestedBreakdownStyle = new URLSearchParams(window.location.search).get('breakdown-style');
  const activeBreakdownStyle = breakdownStylePreview && breakdownStylePreviewOptions.some((option) => option.id === requestedBreakdownStyle)
    ? requestedBreakdownStyle
    : 'blueprint';
  const formRef = React.useRef(null);
  const emotionCurveGraphRef = React.useRef(null);
  const draftSaveTimerRef = React.useRef(null);
  const [minimapState, setMinimapState] = React.useState({ visible: false, activeIndex: 0 });
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [exportLocation, setExportLocation] = React.useState('picker');
  const [exportFormat, setExportFormat] = React.useState('md');
  const [exportFileName, setExportFileName] = React.useState('脚本拆解');
  const [notice, setNotice] = React.useState('');
  const [comparison, setComparison] = React.useState(null);
  const defaultBenchmarkPrompts = {
    youtube: '请根据 YouTube / YouTube Shorts 视频链接，提取公开资料，并严格按以下格式逐行输出。不要添加表格、序号、解释或代码块。\n\n视频标题：仅保留标题正文，不包含任何 # 标签\n视频标签：去掉 #；剔除与频道名称相同的标签；多项用 、 分隔\n视频链接：原始视频链接\n背景音乐：歌曲或音乐名称；无法确认请写不可用\n视频时长：\n频道名称：使用 @频道 Handle\n频道主页链接：https://www.youtube.com/@频道Handle\n播放量：\n点赞量：\n评论量：\n\n无法可靠获取的字段请写“不可用”，不要猜测。\n\n视频链接：{{视频链接}}',
    douyin: '我会提供一条抖音视频链接和一张视频详情截图。请结合链接与截图提取公开资料，并严格按以下格式逐行输出。不要添加表格、序号、解释或代码块。\n\n截图优先用于识别背景音乐、点赞量、评论量、收藏量和转发量；请只读取截图中清晰可见的数据。\n\n视频标题：优先读取作者昵称下方的视频发布文案第一句，去掉后续 # 标签；不要把封面、暂停画面、视频内容里的字幕或大字当作标题。若发布文案只有一句，视频标题和视频简介可以相同\n视频简介：\n视频标签：去掉 #；如果标签与频道名称相同则剔除\n视频链接：{{视频链接}}\n发布者：严格使用 Markdown 链接格式 [@昵称](https://www.douyin.com/user/...)\n背景音乐：\n点赞量：\n评论量：\n收藏量：\n转发量：\n\n无法可靠获取或截图中看不清的字段请写“不可用”，不要猜测。',
  };
  const [benchmarkPromptTemplates, setBenchmarkPromptTemplates] = React.useState(defaultBenchmarkPrompts);
  const [isBenchmarkPromptSettingsOpen, setIsBenchmarkPromptSettingsOpen] = React.useState(false);
  const [promptSettingsPlatform, setPromptSettingsPlatform] = React.useState('youtube');
  const [isBenchmarkMetadataPasteOpen, setIsBenchmarkMetadataPasteOpen] = React.useState(false);
  const [benchmarkMetadataPasteText, setBenchmarkMetadataPasteText] = React.useState('');
  const [benchmarkVideoUrl, setBenchmarkVideoUrl] = React.useState('');
  const [benchmarkPlatform, setBenchmarkPlatform] = React.useState('youtube');
  const [selectedVideoType, setSelectedVideoType] = React.useState('');
  const [videoTypeValues, setVideoTypeValues] = React.useState({});
  const [structureMode, setStructureMode] = React.useState('shots');
  const createEmotionCurveNode = (id, level = 0) => ({
    id,
    startTime: id === 1 ? '00:00' : '',
    endTime: '',
    phase: '',
    range: '',
    idea: '',
    level,
  });
  const createDefaultEmotionCurveNodes = () => [
    createEmotionCurveNode(1, 2),
    createEmotionCurveNode(2, -2),
    createEmotionCurveNode(3, 3),
    createEmotionCurveNode(4, 0),
  ];
  const [emotionCurveNodes, setEmotionCurveNodes] = React.useState(createDefaultEmotionCurveNodes);
  const [selectedEmotionCurveNodeId, setSelectedEmotionCurveNodeId] = React.useState(1);
  const [hasEditedEmotionCurve, setHasEditedEmotionCurve] = React.useState(false);
  const [emotionCurvePointer, setEmotionCurvePointer] = React.useState(null);
  const [draggingEmotionCurveNodeId, setDraggingEmotionCurveNodeId] = React.useState(null);
  const emotionCurveLevelLimit = 5;
  const [videoTimelineEntries, setVideoTimelineEntries] = React.useState([]);
  const [videoTimelineTypes, setVideoTimelineTypes] = React.useState(VIDEO_TIMELINE_DEFAULT_TYPES);
  const [videoTimelineDuration, setVideoTimelineDuration] = React.useState(60);
  const createCoreEventChainRow = (id) => ({
    id,
    startName: `core-event-chain-${id}-start`,
    endName: `core-event-chain-${id}-end`,
    startPlaceholder: '',
    endPlaceholder: '',
    timeStartName: `core-event-chain-${id}-time-start`,
    timeEndName: `core-event-chain-${id}-time-end`,
    timeStartPlaceholder: '',
    timeEndPlaceholder: '',
    contentName: `core-event-chain-${id}-content`,
    taskName: `core-event-chain-${id}-task`,
    psychologyName: `core-event-chain-${id}-psychology`,
  });
  const [coreEventChainRows, setCoreEventChainRows] = React.useState(() => [1, 2, 3].map(createCoreEventChainRow));
  const [aiBreakdownValues, setAiBreakdownValues] = React.useState({});
  const [aiDistributionSummary, setAiDistributionSummary] = React.useState(null);
  const [draftRevision, setDraftRevision] = React.useState(0);
  const [isDraftReady, setIsDraftReady] = React.useState(false);

  const getEmotionLabel = (level) => {
    if (level >= 5) return '兴奋';
    if (level >= 3) return '喜悦';
    if (level >= 1) return '紧张';
    if (level === 0) return '平淡';
    if (level >= -2) return '压抑';
    if (level >= -4) return '悲伤';
    return '恐惧';
  };

  const getEmotionEmoji = (level) => ['😭', '😨', '😢', '😞', '😔', '😐', '😬', '🙂', '😄', '😆', '🤩'][level + emotionCurveLevelLimit] || '😐';

  const getEmotionTimeRange = (node, index) => ({
    start: node.startTime || (index === 0 ? '00:00' : (emotionCurveNodes[index - 1]?.endTime || '')),
    end: node.endTime || '',
  });

  const formatEmotionTimeInput = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
  };

  const getEmotionCurveText = () => emotionCurveNodes.map((node, index) => {
    const timeRange = getEmotionTimeRange(node, index);
    return `时间段：${timeRange.start || '未填写'} ~ ${timeRange.end || '未填写'}${node.range.trim() ? `（${node.range.trim()}）` : ''}\n想法：${node.idea.trim() || '（未填写）'}\n情绪：${getEmotionLabel(node.level)}`;
  }).join('\n\n');

  const updateEmotionCurveNode = (id, changes) => {
    setHasEditedEmotionCurve(true);
    setEmotionCurveNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, ...changes } : node)));
  };

  const addEmotionCurveNode = () => {
    const nextId = Math.max(...emotionCurveNodes.map((node) => node.id), 0) + 1;
    const selectedIndex = emotionCurveNodes.findIndex((node) => node.id === selectedEmotionCurveNodeId);
    const nextNode = createEmotionCurveNode(nextId, 0);
    setHasEditedEmotionCurve(true);
    setEmotionCurveNodes((nodes) => {
      const insertionIndex = selectedIndex >= 0 ? selectedIndex + 1 : nodes.length;
      return [...nodes.slice(0, insertionIndex), nextNode, ...nodes.slice(insertionIndex)];
    });
    setSelectedEmotionCurveNodeId(nextId);
  };

  const removeEmotionCurveNode = () => {
    if (emotionCurveNodes.length <= 2) return;
    const selectedIndex = emotionCurveNodes.findIndex((node) => node.id === selectedEmotionCurveNodeId);
    const fallbackNode = emotionCurveNodes[Math.max(0, selectedIndex - 1)] || emotionCurveNodes[0];
    setHasEditedEmotionCurve(true);
    setEmotionCurveNodes((nodes) => nodes.filter((node) => node.id !== selectedEmotionCurveNodeId));
    setSelectedEmotionCurveNodeId(fallbackNode.id === selectedEmotionCurveNodeId
      ? emotionCurveNodes[Math.min(emotionCurveNodes.length - 1, selectedIndex + 1)].id
      : fallbackNode.id);
  };

  const moveEmotionCurveNode = (direction) => {
    const selectedIndex = emotionCurveNodes.findIndex((node) => node.id === selectedEmotionCurveNodeId);
    const targetIndex = selectedIndex + direction;
    if (selectedIndex < 0 || targetIndex < 0 || targetIndex >= emotionCurveNodes.length) return;
    setHasEditedEmotionCurve(true);
    setEmotionCurveNodes((nodes) => {
      const nextNodes = [...nodes];
      [nextNodes[selectedIndex], nextNodes[targetIndex]] = [nextNodes[targetIndex], nextNodes[selectedIndex]];
      return nextNodes;
    });
  };

  const renderEmotionCurveEditor = (position) => {
    const activeNode = emotionCurveNodes.find((node) => node.id === selectedEmotionCurveNodeId) || emotionCurveNodes[0];
    const activeNodeIndex = emotionCurveNodes.findIndex((node) => node.id === activeNode?.id);
    const activeNodeTimeRange = getEmotionTimeRange(activeNode, activeNodeIndex);
    const draggedEmotionCurveNode = emotionCurveNodes.find((node) => node.id === draggingEmotionCurveNodeId);
    const draggedEmotionLevel = draggedEmotionCurveNode?.level;
    const emotionCurveLevels = Array.from({ length: (emotionCurveLevelLimit * 2) + 1 }, (_, index) => emotionCurveLevelLimit - index);
    const emotionCurveColumnWidth = emotionCurveNodes.length <= 5 ? 164 : emotionCurveNodes.length <= 8 ? 120 : 104;
    const chartWidth = Math.max(640, emotionCurveNodes.length * emotionCurveColumnWidth);
    const getLevelY = (level) => 150 - (level * 24);
    const getPoint = (node, index) => {
      const x = ((index + 0.5) / emotionCurveNodes.length) * 1000;
      const y = getLevelY(node.level);
      return { x, y };
    };
    const curvePath = emotionCurveNodes.map(getPoint).reduce((path, point, index, points) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const distance = point.x - previous.x;
      return `${path} C ${previous.x + (distance * 0.45)} ${previous.y}, ${point.x - (distance * 0.45)} ${point.y}, ${point.x} ${point.y}`;
    }, '');
    const updateLevelFromPointer = (id, clientY) => {
      const rect = emotionCurveGraphRef.current?.getBoundingClientRect();
      if (!rect) return;
      const percent = Math.max(10, Math.min(90, ((clientY - rect.top) / rect.height) * 100));
      const level = Math.max(-emotionCurveLevelLimit, Math.min(emotionCurveLevelLimit, Math.round((50 - percent) / 8)));
      updateEmotionCurveNode(id, { level });
    };
    const startDrag = (event, id) => {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setSelectedEmotionCurveNodeId(id);
      setDraggingEmotionCurveNodeId(id);
      setEmotionCurvePointer(null);
      updateLevelFromPointer(id, event.clientY);
    };

    const stopDrag = () => setDraggingEmotionCurveNodeId(null);
    const updateEmotionCurvePointer = (event) => {
      if (event.target.closest('.emotion-curve-node')) {
        setEmotionCurvePointer(null);
        return;
      }
      const rect = emotionCurveGraphRef.current?.getBoundingClientRect();
      if (!rect) return;
      setEmotionCurvePointer({
        x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
      });
    };

    return (
      <section className="emotion-curve-editor" aria-labelledby="emotion-curve-title">
        <div className="emotion-curve-heading">
          <div>
            <strong id="emotion-curve-title">{position}. 观众情绪曲线 <span className="script-breakdown-priority-star" role="img" aria-label="重点维度">⭐</span></strong>
            <span>用节点标记时间戳、想法和观众情绪；拖动 Emoji 上下调整强弱。</span>
            <span className="emotion-curve-axis-key">纵轴：+5 正向（兴奋、喜悦、紧张） · 0 平淡 · -5 负向（压抑、悲伤、恐惧）</span>
          </div>
          <span className="emotion-curve-current" aria-live="polite">当前：{activeNodeTimeRange.start || activeNodeTimeRange.end ? `${activeNodeTimeRange.start || '--:--'} ~ ${activeNodeTimeRange.end || '--:--'}` : `节点 ${activeNodeIndex + 1}`} · {getEmotionLabel(activeNode?.level || 0)}</span>
        </div>
        <div className="emotion-curve-actions" aria-label="情绪曲线节点操作">
          <button type="button" className="emotion-curve-add" onClick={addEmotionCurveNode}>＋ 新增节点</button>
          <button type="button" onClick={removeEmotionCurveNode} disabled={emotionCurveNodes.length <= 2}>删除节点</button>
          <button type="button" onClick={() => moveEmotionCurveNode(-1)} disabled={emotionCurveNodes.findIndex((node) => node.id === selectedEmotionCurveNodeId) <= 0}>← 左移</button>
          <button type="button" onClick={() => moveEmotionCurveNode(1)} disabled={emotionCurveNodes.findIndex((node) => node.id === selectedEmotionCurveNodeId) >= emotionCurveNodes.length - 1}>右移 →</button>
        </div>
        <div className="emotion-curve-scroll">
          <div className="emotion-curve-canvas" style={{ minWidth: `${chartWidth}px` }}>
            <div
              className="emotion-curve-graph"
              ref={emotionCurveGraphRef}
              onPointerMove={updateEmotionCurvePointer}
              onPointerLeave={() => setEmotionCurvePointer(null)}
            >
              {emotionCurveLevels.map((level) => (
                <div className={`emotion-curve-axis-label emotion-curve-axis-tick${draggingEmotionCurveNodeId && draggedEmotionLevel === level ? ' active' : ''}`} style={{ top: `${(getLevelY(level) / 300) * 100}%` }} key={level}>{level > 0 ? `+${level}` : level}</div>
              ))}
              {emotionCurvePointer ? (
                <div className="emotion-curve-crosshair" aria-hidden="true">
                  <span className="emotion-curve-crosshair-vertical" style={{ left: `${emotionCurvePointer.x}%` }} />
                  <span className="emotion-curve-crosshair-horizontal" style={{ top: `${emotionCurvePointer.y}%` }} />
                </div>
              ) : null}
              <svg className="emotion-curve-svg" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
                {emotionCurveLevels.map((level) => <path className={`emotion-curve-grid-line${level === 0 ? ' zero' : ''}${draggingEmotionCurveNodeId && draggedEmotionLevel === level ? ' active' : ''}`} d={`M 0 ${getLevelY(level)} H 1000`} key={level} />)}
                <path className="emotion-curve-path" d={curvePath} />
              </svg>
              {emotionCurveNodes.map((node, index) => {
                const point = getPoint(node, index);
                const timeRange = getEmotionTimeRange(node, index);
                const isDragging = node.id === draggingEmotionCurveNodeId;
                return (
                  <button
                    className={`emotion-curve-node${node.id === selectedEmotionCurveNodeId ? ' selected' : ''}${isDragging ? ' is-dragging' : ''}${index / emotionCurveNodes.length > 0.72 ? ' value-left' : ''}`}
                    key={node.id}
                    type="button"
                    style={{ left: `${(point.x / 1000) * 100}%`, top: `${(point.y / 300) * 100}%` }}
                    aria-label={`${timeRange.start || timeRange.end ? `${timeRange.start || '--:--'} 到 ${timeRange.end || '--:--'}` : `节点 ${index + 1}`}，${getEmotionLabel(node.level)}。上下拖动调整情绪强弱。`}
                    onPointerEnter={() => setEmotionCurvePointer(null)}
                    onPointerDown={(event) => startDrag(event, node.id)}
                    onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture?.(event.pointerId)) updateLevelFromPointer(node.id, event.clientY); }}
                    onPointerUp={stopDrag}
                    onPointerCancel={stopDrag}
                    onLostPointerCapture={stopDrag}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        updateEmotionCurveNode(node.id, { level: Math.max(-emotionCurveLevelLimit, Math.min(emotionCurveLevelLimit, node.level + (event.key === 'ArrowUp' ? 1 : -1))) });
                      }
                    }}
                  >
                    <span aria-hidden="true">{getEmotionEmoji(node.level)}</span>
                    {isDragging ? <span className="emotion-curve-node-value" aria-live="polite">{node.level > 0 ? `+${node.level}` : node.level}</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="emotion-curve-x-axis" style={{ gridTemplateColumns: `repeat(${emotionCurveNodes.length}, minmax(${emotionCurveColumnWidth}px, 1fr))` }}>
              {emotionCurveNodes.map((node, index) => {
                const timeRange = getEmotionTimeRange(node, index);
                return <button type="button" className={node.id === selectedEmotionCurveNodeId ? 'selected' : undefined} key={node.id} onClick={() => setSelectedEmotionCurveNodeId(node.id)}>{timeRange.start || timeRange.end ? `${timeRange.start || '--:--'} ~ ${timeRange.end || '--:--'}` : `节点 ${index + 1}`}{node.range.trim() ? <small>{node.range}</small> : null}</button>;
              })}
            </div>
            <div className="emotion-curve-ideas" style={{ gridTemplateColumns: `repeat(${emotionCurveNodes.length}, minmax(${emotionCurveColumnWidth}px, 1fr))` }}>
              {emotionCurveNodes.map((node, index) => (
                <label className={node.id === selectedEmotionCurveNodeId ? 'emotion-curve-idea selected' : 'emotion-curve-idea'} key={node.id}>
                  <span>想法 · 节点 {index + 1}</span>
                  <div className="emotion-curve-time-range" aria-label={`节点 ${index + 1} 的时间段`}>
                    <input value={node.startTime || (index === 0 ? '00:00' : (emotionCurveNodes[index - 1]?.endTime || ''))} placeholder={index === 0 ? '00:00' : '承接'} inputMode="numeric" maxLength={5} aria-label={`节点 ${index + 1} 的开始时间${index === 0 ? '' : '，默认承接上一节点的结束时间'}`} title={node.startTime || index === 0 ? '只输入数字，例如 0000 会显示为 00:00' : '默认承接上一节点的结束时间'} readOnly={index > 0 && !node.startTime} onFocus={() => setSelectedEmotionCurveNodeId(node.id)} onChange={(event) => updateEmotionCurveNode(node.id, { startTime: formatEmotionTimeInput(event.target.value) })} />
                    <span aria-hidden="true">~</span>
                    <input value={node.endTime} placeholder="0330" inputMode="numeric" maxLength={5} aria-label={`节点 ${index + 1} 的结束时间`} title="只输入数字，例如 0330 会自动显示为 03:30" onFocus={() => setSelectedEmotionCurveNodeId(node.id)} onChange={(event) => updateEmotionCurveNode(node.id, { endTime: formatEmotionTimeInput(event.target.value) })} />
                  </div>
                  <input value={node.range} placeholder="镜头范围（可选）" aria-label={`节点 ${index + 1} 的镜头范围`} onFocus={() => setSelectedEmotionCurveNodeId(node.id)} onChange={(event) => updateEmotionCurveNode(node.id, { range: event.target.value })} />
                  <textarea value={node.idea} rows={2} placeholder="这一步让观众感到什么？" aria-label={`节点 ${index + 1} 的想法`} onFocus={() => setSelectedEmotionCurveNodeId(node.id)} onChange={(event) => updateEmotionCurveNode(node.id, { idea: event.target.value })} />
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  React.useEffect(() => {
    const updateMinimap = () => {
      const panel = formRef.current?.closest('.script-breakdown-panel');
      if (!panel) return;

      const viewportAnchor = window.innerHeight * 0.5;
      const activeIndex = scriptBreakdownNavItems.reduce((currentIndex, item, index) => {
        const target = document.getElementById(item.id);
        return target && target.getBoundingClientRect().top <= viewportAnchor ? index : currentIndex;
      }, 0);
      const nextState = {
        visible: true,
        activeIndex,
      };

      setMinimapState((current) => (
        current.visible === nextState.visible
        && current.activeIndex === nextState.activeIndex
          ? current
          : nextState
      ));
    };

    updateMinimap();
    window.addEventListener('scroll', updateMinimap, { passive: true });
    window.addEventListener('resize', updateMinimap);
    return () => {
      window.removeEventListener('scroll', updateMinimap);
      window.removeEventListener('resize', updateMinimap);
    };
  }, [comparison, coreEventChainRows.length, draftRevision, isExportOpen, selectedVideoType, structureMode]);

  const resizeTextareaElement = (textarea) => {
    if (!textarea.value.trim()) {
      textarea.style.height = '';
      return;
    }

    textarea.style.height = 'auto';
    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 21;
    textarea.style.height = `${textarea.scrollHeight + lineHeight}px`;
  };

  const resizeTextarea = (event) => resizeTextareaElement(event.currentTarget);

  const scrollToBreakdownSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateTextareaValue = (textarea, nextValue, selectionStart, selectionEnd = selectionStart) => {
    const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeValueSetter) nativeValueSetter.call(textarea, nextValue);
    else textarea.value = nextValue;

    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    resizeTextareaElement(textarea);
    textarea.focus();
    textarea.setSelectionRange(selectionStart, selectionEnd);
  };

  const TextFormattingToolbar = () => {
    const getTextarea = (event) => event.currentTarget.closest('.script-breakdown-field')?.querySelector('textarea');
    const keepTextareaFocused = (event) => event.preventDefault();
    const insertText = (event, text) => {
      const textarea = getTextarea(event);
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
      updateTextareaValue(textarea, nextValue, start + text.length);
    };
    const insertNextNumber = (event) => {
      const textarea = getTextarea(event);
      if (!textarea) return;

      const start = textarea.selectionStart;
      const currentLineStart = textarea.value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const previousNumbers = [...textarea.value.slice(0, currentLineStart).matchAll(/(?:^|\n)(\d+)\.\s/g)].map((match) => Number(match[1]));
      const number = previousNumbers.length ? Math.max(...previousNumbers) + 1 : 1;
      insertText(event, `${number}. `);
    };
    const wrapSelectionWithBold = (event) => {
      const textarea = getTextarea(event);
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.slice(start, end);
      const nextValue = `${textarea.value.slice(0, start)}**${selectedText}**${textarea.value.slice(end)}`;
      const nextCursor = start + 2;
      updateTextareaValue(textarea, nextValue, nextCursor, selectedText ? end + 2 : nextCursor);
    };

    return (
      <div className="text-format-toolbar" role="toolbar" aria-label="快捷输入工具栏">
        <span className="text-format-toolbar-label">快捷输入</span>
        <button type="button" onMouseDown={keepTextareaFocused} onClick={insertNextNumber} title="插入下一序号">1.</button>
        <button type="button" className="text-format-toolbar-bold" onMouseDown={keepTextareaFocused} onClick={wrapSelectionWithBold} title="给选中文字加粗">B</button>
        <span className="text-format-toolbar-emojis" aria-label="常用表情">
          {['⭐', '➡️', '💡', '✅', '❌', '⁉️', '❤️'].map((emoji) => (
            <button type="button" key={emoji} onMouseDown={keepTextareaFocused} onClick={(event) => insertText(event, emoji)} aria-label={`插入 ${emoji}`}>{emoji}</button>
          ))}
        </span>
      </div>
    );
  };

  const detectBenchmarkPlatform = (value) => {
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) return 'youtube';

    try {
      const hostname = new URL(normalizedValue).hostname.replace(/^www\./, '');
      if (hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) return 'youtube';
      if (hostname === 'douyin.com' || hostname.endsWith('.douyin.com') || hostname.endsWith('iesdouyin.com')) return 'douyin';
    } catch {
      if (/(^|\.)youtu\.be\b|(^|\.)youtube\.com\b/.test(normalizedValue)) return 'youtube';
      if (/douyin\.com\b|iesdouyin\.com\b/.test(normalizedValue)) return 'douyin';
    }

    return 'youtube';
  };

  const normalizeDouyinVideoUrl = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return '';

    try {
      const url = new URL(trimmedValue);
      const isDouyinUrl = url.protocol === 'https:'
        && (url.hostname === 'douyin.com' || url.hostname.endsWith('.douyin.com'));
      if (!isDouyinUrl) return trimmedValue;

      const detailVideoId = url.searchParams.get('modal_id')
        || url.pathname.match(/^\/video\/(\d+)/)?.[1];
      return detailVideoId ? `https://www.douyin.com/video/${detailVideoId}` : trimmedValue;
    } catch {
      return trimmedValue;
    }
  };

  const benchmarkPlatformOptions = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'douyin', label: '抖音' },
  ];

  const videoTypeOptions = [
    {
      value: 'reversal',
      label: '爽剧 / 反转打脸',
      description: '看受虐、逆袭与爽感落点',
      fields: [
        { name: 'video-type-reversal-setback', title: '受虐 / 憋屈点', hint: '主角受到了什么不公、嘲笑或陷害？', placeholder: '写下让观众产生同情和愤怒的起点。' },
        { name: 'video-type-reversal-turn', title: '反转爆发点', hint: '主角如何瞬间逆袭？', placeholder: '写下出人意料的证据、身份或武力。' },
        { name: 'video-type-reversal-villain', title: '反派反应', hint: '真相揭开后，对方有什么变化？', placeholder: '写下尴尬、惊恐或失语等爽感落点。' },
        { name: 'video-type-reversal-highlight', title: '金句 / 高光动作', hint: '哪句台词或哪个动作最有记忆点？', placeholder: '写下帅气台词或绝杀动作。' },
      ],
    },
    {
      value: 'comedy',
      label: '搞笑 / 整蛊剧情',
      description: '看冲突、包袱与递进节奏',
      fields: [
        { name: 'video-type-comedy-conflict', title: '荒诞规则 / 冲突', hint: '发生了什么日常中不会如此极端的事？', placeholder: '写下故事的反常规则或冲突。' },
        { name: 'video-type-comedy-response', title: '主角的脑洞对策', hint: '为了应付检查或难题，主角用了什么歪招？', placeholder: '写下聪明或愚蠢却出人意料的对策。' },
        { name: 'video-type-comedy-punchline', title: '抓包 / 打脸包袱', hint: '笑点是如何抖出来的？', placeholder: '写下被识破、反差或翻车的瞬间。' },
        { name: 'video-type-comedy-escalation', title: '重复与递进', hint: '是否重复 2—3 次，并且一次更夸张？', placeholder: '写下“三翻四抖”的节奏变化。' },
      ],
    },
    {
      value: 'emotion',
      label: '情感 / 共鸣 / 微小说',
      description: '看现实痛点、情绪爆发与升华',
      fields: [
        { name: 'video-type-emotion-pain-point', title: '故事内核/选题', hint: '梳理完整剧情，总结视频传递的深层内涵和创作立意', placeholder: '重点不是照搬原作品，而是找到其中已经被验证过的情绪母题\n例如：陌生人的善意；亲情与遗憾；小人物的坚持；身份反差；误解与反转；熟悉人物遇到现代问题。' },
      ],
    },
    {
      value: 'other',
      label: '其他',
      description: '按自己的观察重点自由拆解',
      fields: [
        { name: 'video-type-other-dimensions', title: '自定义拆解维度', hint: '你最想从哪些角度看这个视频？', placeholder: '如：节奏设计、镜头语言、知识点安排。' },
        { name: 'video-type-other-analysis', title: '拆解内容', hint: '围绕上面的维度写下你的观察。', placeholder: '填写你的拆解内容。' },
      ],
    },
  ];
  const activeVideoType = videoTypeOptions.find((option) => option.value === selectedVideoType);

  const universalFields = [
    {
      title: '黄金开头',
      placeholder: '记录前 3 秒给出的钩子：冲突、意外、危险、损失、反常结果；再补一句“观众为什么会继续看”。',
      accent: true,
    },
    {
      title: '节奏与留存',
      placeholder: '记录信息/情绪如何推进：哪里抛出新问题、哪里给小回报、哪里可能拖沓，以及中段如何避免观众划走。',
      accent: true,
    },
    {
      title: '互动点',
      placeholder: '记录最容易引发评论的位置：争议判断、代入式提问、站队、开放结局或反常观点；可补充是否明确引导评论。',
      accent: true,
    },
  ];

  const fields = [
    {
      title: '核心事件链',
      hint: '一段完整梗概，简述事件顺序是什么。',
      placeholder: '一句话故事\n一段简述事件顺序的梗概',
      accent: true,
    },
    {
      title: '可复刻的结构公式',
      placeholder: '这个视频的结构公式是什么？对叙事结构进行抽象化提取\n一个反常请求→ 被人误解 →揭示隐藏原因 →陌生人的善意回应\n危险场景 →反常回答 → 逐层揭示身世 →陌生人提供帮助 →一句话释放情绪',
    },
    {
      title: '观众情绪曲线',
      hint: '状态怎么变化？',
      placeholder: '观众的感觉，情绪曲线\n感觉可以是紧张、感动、快乐、心疼、好笑或震惊，如：建立期待 → 制造冲突→推高情绪→反转或释放',
    },
    {
      title: '角色',
      hint: '写下主要角色、身份和关系。',
      placeholder: '角色为什么讨喜？有无反差？\n角色有没有清晰的身份、愿望和性格？\n观众是否知道“他是谁”“他想做什么”“为什么值得关心”？',
    },
    {
      title: '其他',
      placeholder: '补充其他观察或想法。',
    },
  ];

  const structureModeOptions = [
    { value: 'shots', label: '分镜' },
    { value: 'time', label: '时间' },
    { value: 'both', label: '分镜＋时间' },
  ];
  const activeStructureModeLabel = structureModeOptions.find((option) => option.value === structureMode)?.label || '分镜';

  const updateNextCoreEventStart = (rowIndex, event) => {
    const nextRow = coreEventChainRows[rowIndex + 1];
    const endShot = Number(event.currentTarget.value);
    if (!nextRow || !Number.isInteger(endShot) || endShot < 1) return;

    const nextStartInput = formRef.current?.elements.namedItem(nextRow.startName);
    if (nextStartInput && typeof nextStartInput.value === 'string') {
      nextStartInput.value = String(endShot + 1);
    }
  };

  const normalizeShortTime = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return '';

    const colonMatch = trimmedValue.match(/^(\d+):(\d{1,2})$/);
    const digits = colonMatch ? null : trimmedValue.replace(/\D/g, '');
    if (!colonMatch && !digits) return '';

    const minutes = colonMatch
      ? Number(colonMatch[1])
      : digits.length > 2
        ? Number(digits.slice(0, -2))
        : 0;
    const seconds = colonMatch
      ? Number(colonMatch[2])
      : Number(digits.slice(-2));
    const totalSeconds = (minutes * 60) + seconds;
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
  };

  const updateNextCoreEventTime = (rowIndex, event) => {
    const endTime = normalizeShortTime(event.currentTarget.value);
    if (!endTime) return;

    event.currentTarget.value = endTime;
    const nextRow = coreEventChainRows[rowIndex + 1];
    if (!nextRow) return;
    const nextStartInput = formRef.current?.elements.namedItem(nextRow.timeStartName);
    if (nextStartInput && typeof nextStartInput.value === 'string' && (!nextStartInput.value || nextStartInput.dataset.autoFilled === 'true')) {
      nextStartInput.value = endTime;
      nextStartInput.dataset.autoFilled = 'true';
    }
  };

  const formatCoreEventTime = (event) => {
    const normalizedTime = normalizeShortTime(event.currentTarget.value);
    if (normalizedTime) event.currentTarget.value = normalizedTime;
  };

  const addCoreEventChainRow = () => {
    const lastRow = coreEventChainRows.at(-1);
    const nextRow = createCoreEventChainRow(Math.max(...coreEventChainRows.map((row) => row.id)) + 1);
    const lastEndShot = Number(formRef.current?.elements.namedItem(lastRow?.endName)?.value);
    const lastEndTime = normalizeShortTime(formRef.current?.elements.namedItem(lastRow?.timeEndName)?.value || '');

    setCoreEventChainRows((rows) => [...rows, nextRow]);
    setComparison(null);

    window.requestAnimationFrame(() => {
      const nextStartShot = formRef.current?.elements.namedItem(nextRow.startName);
      const nextStartTime = formRef.current?.elements.namedItem(nextRow.timeStartName);
      if (nextStartShot && Number.isInteger(lastEndShot) && lastEndShot > 0) nextStartShot.value = String(lastEndShot + 1);
      if (nextStartTime && lastEndTime) {
        nextStartTime.value = lastEndTime;
        nextStartTime.dataset.autoFilled = 'true';
      }
    });
  };

  const removeLastCoreEventChainRow = () => {
    if (coreEventChainRows.length === 1) return;
    setCoreEventChainRows((rows) => rows.slice(0, -1));
    setComparison(null);
  };

  const getCoreEventRangeText = (row, formData, separator = '<br>') => {
    const shotRange = `${formData.get(row.startName)?.trim() || '（未填写）'} ~ ${formData.get(row.endName)?.trim() || '（未填写）'}`;
    const timeRange = `${formData.get(row.timeStartName)?.trim() || '（未填写）'} ~ ${formData.get(row.timeEndName)?.trim() || '（未填写）'}`;
    if (structureMode === 'time') return timeRange;
    if (structureMode === 'both') return `分镜：${shotRange}${separator}时间：${timeRange}`;
    return shotRange;
  };

  const getCoreEventRangeNames = (row) => {
    if (structureMode === 'time') return [row.timeStartName, row.timeEndName];
    if (structureMode === 'both') return [row.startName, row.endName, row.timeStartName, row.timeEndName];
    return [row.startName, row.endName];
  };

  const getCoreEventChainDetails = (formData) => coreEventChainRows
    .map((row) => `${activeStructureModeLabel}：${getCoreEventRangeText(row, formData, '\n')}\n内容：${formData.get(row.contentName)?.trim() || '（未填写）'}\n结构任务/镜头功能：${formData.get(row.taskName)?.trim() || '（未填写）'}\n观众心理：${formData.get(row.psychologyName)?.trim() || '（未填写）'}`)
    .join('\n\n');

  const getAiBreakdownSectionDefinitions = () => [
    ...(activeVideoType
      ? activeVideoType.fields.map((field, index) => ({
        id: `video-type-${field.name}`,
        label: `1.${index + 1} ${field.title}`,
        getOwn: (formData) => formData.get(field.name)?.trim() || '（未填写）',
      }))
      : []),
    ...universalFields.map((field, index) => ({
      id: `universal-${index + 1}`,
      label: `2.${index + 1} ${field.title}`,
      getOwn: (formData) => formData.get(field.title)?.trim() || '（未填写）',
    })),
    {
      id: 'story-structure',
      label: '3. 剧情结构',
      getOwn: getCoreEventChainDetails,
    },
    ...fields.map((field, index) => ({
      id: `field-${index + 5}`,
      label: `${index + 4}. ${field.title}`,
      getOwn: (formData) => formData.get(field.title)?.trim() || '（未填写）',
    })),
  ];

  const getAiBreakdownInputName = (id) => `ai-breakdown-${id}`;

  const getAiBreakdownSections = (formData) => getAiBreakdownSectionDefinitions().map((section) => ({
    ...section,
    own: section.getOwn(formData),
    ai: formData.get(getAiBreakdownInputName(section.id))?.trim() || '',
  }));

  const splitComparisonPoints = (value) => value
    .replace(/（未填写）/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  const normalizeComparisonPoint = (value) => value
    .replace(/^\s*(?:[-+*•]|\d+[.、)）])\s*/, '')
    .replace(/[\s，,。！？!?；;：:“”"'‘’（）()【】\[\]]/g, '')
    .toLowerCase();

  const pointsMatch = (first, second) => {
    const normalizedFirst = normalizeComparisonPoint(first);
    const normalizedSecond = normalizeComparisonPoint(second);
    if (!normalizedFirst || !normalizedSecond) return false;
    return normalizedFirst === normalizedSecond
      || (Math.min(normalizedFirst.length, normalizedSecond.length) >= 8
        && (normalizedFirst.includes(normalizedSecond) || normalizedSecond.includes(normalizedFirst)));
  };

  const getColoredComparison = (section) => {
    const ownPoints = splitComparisonPoints(section.own);
    const aiPoints = splitComparisonPoints(section.ai);
    const ownExtra = ownPoints.filter((point) => !aiPoints.some((aiPoint) => pointsMatch(point, aiPoint)));
    const aiPointsWithStatus = aiPoints.map((point) => ({
      text: point,
      status: ownPoints.some((ownPoint) => pointsMatch(point, ownPoint)) ? 'same' : 'missing',
    }));

    return { ownExtra, aiPoints: aiPointsWithStatus };
  };

  const splitAiBreakdownIntoSections = (rawText, definitions) => {
    const lines = rawText.replace(/\r\n?/g, '\n').split('\n');
    const matchedHeadings = [];

    lines.forEach((line, lineIndex) => {
      const normalizedLine = line
        .replace(/^\s*(?:#{1,6}\s*)?(?:[-+*]\s*)?/, '')
        .replace(/\*\*|__/g, '')
        .trim();
      const section = definitions.find((item) => {
        if (!normalizedLine.startsWith(item.label)) return false;
        const followingCharacter = normalizedLine.charAt(item.label.length);
        return !followingCharacter || /[\s:：(（]/.test(followingCharacter);
      });
      if (!section || matchedHeadings.some((item) => item.section.id === section.id)) return;

      const remainder = normalizedLine.slice(section.label.length).trim();
      matchedHeadings.push({
        section,
        lineIndex,
        inlineContent: /^[：:]/.test(remainder) ? remainder.slice(1).trim() : '',
      });
    });

    return matchedHeadings.reduce((values, heading, index) => {
      const nextHeading = matchedHeadings[index + 1];
      const blockLines = lines.slice(heading.lineIndex + 1, nextHeading?.lineIndex);
      const content = [heading.inlineContent, ...blockLines].filter(Boolean).join('\n').trim();
      if (content) values[heading.section.id] = content;
      return values;
    }, {});
  };

  const renderInlineAiBreakdown = (id, label) => {
    const coloredComparison = comparison?.sections.find((section) => section.id === id)?.colored;

    return (
    <details className="inline-ai-breakdown">
      <summary>
        <strong>{coloredComparison ? 'AI 对照版' : 'AI 拆解'}</strong>
        <span>{coloredComparison ? '红色待补、灰色一致、蓝色是你的额外拆解' : '自动整理后显示在这里，也可手动补充'}</span>
      </summary>
      {coloredComparison ? (
        <div className="inline-ai-comparison" aria-label={`AI 对${label}的颜色对照`}>
          <p className="inline-ai-comparison-note">按换行和相同词句自动对照；颜色是提示，仍可回看或编辑 AI 原文。</p>
          {coloredComparison.aiPoints.length ? coloredComparison.aiPoints.map((point, index) => (
            <p className={`inline-ai-comparison-point is-${point.status}`} key={`${point.status}-${index}`}>
              <span>{point.status === 'missing' ? '待补' : '一致'}</span>
              {point.text}
            </p>
          )) : <p className="inline-ai-comparison-empty">AI 尚未整理到这一项。</p>}
          {coloredComparison.ownExtra.map((point, index) => (
            <p className="inline-ai-comparison-point is-extra" key={`extra-${index}`}>
              <span>你的额外拆解</span>
              {point}
            </p>
          ))}
          <details className="inline-ai-source">
            <summary>编辑 AI 原文</summary>
            <textarea
              name={getAiBreakdownInputName(id)}
              value={aiBreakdownValues[id] || ''}
              rows={3}
              placeholder={`AI 对“${label}”的拆解会显示在这里`}
              aria-label={`AI 对${label}的拆解`}
              onChange={(event) => {
                setAiBreakdownValues((values) => ({ ...values, [id]: event.target.value }));
                setComparison(null);
              }}
              onInput={resizeTextarea}
            />
          </details>
        </div>
      ) : (
        <textarea
          name={getAiBreakdownInputName(id)}
          value={aiBreakdownValues[id] || ''}
          rows={3}
          placeholder={`AI 对“${label}”的拆解会显示在这里`}
          aria-label={`AI 对${label}的拆解`}
          onChange={(event) => setAiBreakdownValues((values) => ({ ...values, [id]: event.target.value }))}
          onInput={resizeTextarea}
        />
      )}
    </details>
    );
  };

  const benchmarkMetadataFieldsByPlatform = {
    youtube: [
      { label: '视频标题', name: 'benchmark-video-title', placeholder: '不包含 # 标签', column: 'content' },
      { label: '视频标签', name: 'benchmark-video-tags', placeholder: '多个标签用 、 分隔', column: 'content' },
      { label: '视频链接', name: 'benchmark-video-url', placeholder: 'YouTube 视频链接', column: 'content' },
      { label: '背景音乐', name: 'benchmark-background-music', placeholder: '歌曲或音乐名称', column: 'content' },
      { label: '频道名称', name: 'benchmark-channel-name', placeholder: '如：@频道 Handle', column: 'content' },
      { label: '视频时长', name: 'benchmark-video-duration', placeholder: '如：00:32', column: 'metrics' },
      { label: '播放量', name: 'benchmark-view-count', placeholder: '如：12.3万', column: 'metrics' },
      { label: '点赞量', name: 'benchmark-like-count', placeholder: '如：8,420', column: 'metrics' },
      { label: '评论量', name: 'benchmark-comment-count', placeholder: '如：325', column: 'metrics' },
      { label: '频道主页链接', name: 'benchmark-channel-url', placeholder: 'https://www.youtube.com/@频道Handle', column: 'metrics' },
    ],
    douyin: [
      { label: '视频标题', name: 'benchmark-video-title', placeholder: '不包含 # 标签', column: 'content' },
      { label: '视频简介', name: 'benchmark-video-description', placeholder: '视频简介正文', column: 'content' },
      { label: '视频标签', name: 'benchmark-video-tags', placeholder: '多个标签用 、 分隔', column: 'content' },
      { label: '视频链接', name: 'benchmark-video-url', placeholder: '抖音视频链接', column: 'content' },
      { label: '发布者', name: 'benchmark-author', placeholder: '[@某某某](https://www.douyin.com/user/...)', column: 'metrics' },
      { label: '背景音乐', name: 'benchmark-background-music', placeholder: '歌曲或音乐名称', column: 'content' },
      { label: '点赞量', name: 'benchmark-like-count', placeholder: '如：8,420', column: 'metrics' },
      { label: '评论量', name: 'benchmark-comment-count', placeholder: '如：325', column: 'metrics' },
      { label: '收藏量', name: 'benchmark-favorite-count', placeholder: '如：1,260', column: 'metrics' },
      { label: '转发量', name: 'benchmark-share-count', placeholder: '如：320', column: 'metrics' },
    ],
  };
  const benchmarkMetadataFields = benchmarkMetadataFieldsByPlatform[benchmarkPlatform];
  const benchmarkMetadataColumns = [
    benchmarkMetadataFields.filter((field) => field.column === 'content'),
    benchmarkMetadataFields.filter((field) => field.column === 'metrics'),
  ];
  const activeBenchmarkPlatform = benchmarkPlatformOptions.find((option) => option.value === benchmarkPlatform) || benchmarkPlatformOptions[0];
  const activePromptSettingsPlatform = benchmarkPlatformOptions.find((option) => option.value === promptSettingsPlatform) || benchmarkPlatformOptions[0];
  const activePromptTemplate = benchmarkPromptTemplates[benchmarkPlatform] || defaultBenchmarkPrompts[benchmarkPlatform];
  const promptSettingsTemplate = benchmarkPromptTemplates[promptSettingsPlatform] || defaultBenchmarkPrompts[promptSettingsPlatform];
  const benchmarkAuthorProfile = parseDouyinAuthorProfile(formRef.current?.elements.namedItem('benchmark-author')?.value);

  React.useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem('script-breakdown-draft-v1');
      if (savedDraft && formRef.current) {
        const draft = JSON.parse(savedDraft);
        const restoredRowIds = Array.isArray(draft['core-event-chain-row-ids'])
          ? draft['core-event-chain-row-ids'].filter((id) => Number.isInteger(id) && id > 0)
          : [];
        if (restoredRowIds.length) setCoreEventChainRows(restoredRowIds.map(createCoreEventChainRow));
        Object.entries(draft).forEach(([name, value]) => {
          const control = formRef.current.elements.namedItem(name);
          if (control && typeof control.value === 'string') control.value = value;
        });
        if (restoredRowIds.length) {
          window.requestAnimationFrame(() => {
            Object.entries(draft).forEach(([name, value]) => {
              const control = formRef.current?.elements.namedItem(name);
              if (control && typeof control.value === 'string') control.value = value;
            });
          });
        }
        const restoredVideoType = videoTypeOptions.find((option) => option.value === draft['video-type']);
        if (restoredVideoType) setSelectedVideoType(restoredVideoType.value);
        if (structureModeOptions.some((option) => option.value === draft['structure-mode'])) {
          setStructureMode(draft['structure-mode']);
        }
        if (typeof draft['emotion-curve-nodes'] === 'string') {
          try {
            const restoredEmotionNodes = JSON.parse(draft['emotion-curve-nodes']);
            if (Array.isArray(restoredEmotionNodes) && restoredEmotionNodes.length >= 2) {
              const safeNodes = restoredEmotionNodes
                .filter((node) => Number.isInteger(node?.id))
                .map((node, index) => ({
                  id: node.id,
                  startTime: typeof node.startTime === 'string' ? node.startTime : (index === 0 ? '00:00' : ''),
                  endTime: typeof node.endTime === 'string' ? node.endTime : (typeof node.phase === 'string' ? node.phase : ''),
                  phase: typeof node.phase === 'string' ? node.phase : '',
                  range: typeof node.range === 'string' ? node.range : '',
                  idea: typeof node.idea === 'string' ? node.idea : '',
                  level: Math.max(-emotionCurveLevelLimit, Math.min(emotionCurveLevelLimit, Number.isFinite(node.level) ? node.level : 0)),
                }));
              if (safeNodes.length >= 2) {
                setEmotionCurveNodes(safeNodes);
                setSelectedEmotionCurveNodeId(safeNodes[0].id);
                setHasEditedEmotionCurve(true);
              }
            }
          } catch {
            // 情绪曲线草稿损坏时保留可编辑的默认节点。
          }
        }
        if (typeof draft['video-timeline-entries'] === 'string') {
          try {
            const restoredTimelineEntries = JSON.parse(draft['video-timeline-entries']);
            if (Array.isArray(restoredTimelineEntries)) {
              setVideoTimelineEntries(restoredTimelineEntries
                .filter((entry) => typeof entry?.id === 'string' || Number.isInteger(entry?.id))
                .map((entry) => ({
                  id: String(entry.id),
                  typeId: typeof entry.typeId === 'string' ? entry.typeId : 'story-hook',
                  start: Math.max(0, snapVideoTimelineTime(Number(entry.start) || 0)),
                  end: Number.isFinite(entry.end) ? Math.max(0, snapVideoTimelineTime(entry.end)) : null,
                  title: typeof entry.title === 'string' ? entry.title : '',
                  description: typeof entry.description === 'string' ? entry.description : '',
                  tags: typeof entry.tags === 'string' ? entry.tags : '',
                  takeaway: typeof entry.takeaway === 'string' ? entry.takeaway : '',
                  color: typeof entry.color === 'string' ? entry.color : '',
                })));
            }
          } catch {
            // 时间轴草稿损坏时保留空白时间轴。
          }
        }
        if (typeof draft['video-timeline-types'] === 'string') {
          try {
            const restoredTimelineTypes = JSON.parse(draft['video-timeline-types']);
            if (Array.isArray(restoredTimelineTypes) && restoredTimelineTypes.length) {
              const safeTypes = restoredTimelineTypes
                .filter((item) => typeof item?.id === 'string' && typeof item?.label === 'string')
                .map((item) => ({
                  id: item.id,
                  group: typeof item.group === 'string' ? item.group : '自定义类型',
                  label: item.label,
                  color: typeof item.color === 'string' ? item.color : '#3976d5',
                }));
              if (safeTypes.length) setVideoTimelineTypes(safeTypes);
            }
          } catch {
            // 类型草稿损坏时使用默认类型。
          }
        }
        if (typeof draft['video-timeline-duration'] === 'string') {
          const restoredDuration = Number(draft['video-timeline-duration']);
          if (Number.isFinite(restoredDuration) && restoredDuration > 0) setVideoTimelineDuration(restoredDuration);
        }
        const restoredBenchmarkVideoUrl = typeof draft['benchmark-video'] === 'string' ? draft['benchmark-video'] : '';
        setBenchmarkVideoUrl(restoredBenchmarkVideoUrl);
        setBenchmarkPlatform(detectBenchmarkPlatform(restoredBenchmarkVideoUrl));
        const restoredVideoTypeValues = Object.fromEntries(
          videoTypeOptions
            .flatMap((option) => option.fields)
            .filter((field) => typeof draft[field.name] === 'string')
            .map((field) => [field.name, draft[field.name]]),
        );
        setVideoTypeValues(restoredVideoTypeValues);
        const restoredAiBreakdownValues = Object.fromEntries(
          Object.entries(draft)
            .filter(([name, value]) => name.startsWith('ai-breakdown-') && typeof value === 'string')
            .map(([name, value]) => [name.replace(/^ai-breakdown-/, ''), value]),
        );
        setAiBreakdownValues(restoredAiBreakdownValues);
        setNotice('已恢复上次保存的练习');
      }

      const savedYouTubePrompt = window.localStorage.getItem('benchmark-video-prompt-youtube-v1') || window.localStorage.getItem('benchmark-video-prompt-v1');
      const savedDouyinPrompt = window.localStorage.getItem('benchmark-video-prompt-douyin-v1');
      if (savedYouTubePrompt || savedDouyinPrompt) {
        setBenchmarkPromptTemplates((templates) => ({
          ...templates,
          ...(savedYouTubePrompt ? { youtube: savedYouTubePrompt } : {}),
          ...(savedDouyinPrompt ? { douyin: savedDouyinPrompt } : {}),
        }));
      }
    } catch {
      // 本地草稿读取失败时仍保持空白练习表单。
    } finally {
      setIsDraftReady(true);
    }
  }, []);

  React.useEffect(() => {
    if (!collectionVideo || !isDraftReady || !formRef.current) return;
    const platform = detectBenchmarkPlatform(collectionVideo.url);
    const displayVideoUrl = platform === 'douyin' ? normalizeDouyinVideoUrl(collectionVideo.url) : collectionVideo.url;
    const collectionCategoryToVideoType = {
      '情绪': 'emotion',
      '反转打脸爽剧': 'reversal',
      '搞笑整蛊': 'comedy',
    };
    const carriedVideoType = collectionCategoryToVideoType[collectionVideo.category] || '';
    const benchmarkControl = formRef.current.elements.namedItem('benchmark-video');
    const titleControl = formRef.current.elements.namedItem('title');
    if (benchmarkControl && typeof benchmarkControl.value === 'string') benchmarkControl.value = displayVideoUrl;
    if (titleControl && typeof titleControl.value === 'string' && !titleControl.value.trim()) titleControl.value = collectionVideo.title;
    setBenchmarkVideoUrl(displayVideoUrl);
    setBenchmarkPlatform(platform);
    setSelectedVideoType(carriedVideoType);
    setDraftRevision((revision) => revision + 1);
    setNotice(carriedVideoType
      ? `已带入「${collectionVideo.title}」，并自动选中对应的视频类型。`
      : `已带入「${collectionVideo.title}」，请按内容选择视频类型。`);
  }, [collectionVideo, isDraftReady]);

  React.useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  React.useEffect(() => {
    if (!isDraftReady) return undefined;

    const frame = window.requestAnimationFrame(() => {
      formRef.current?.querySelectorAll('.core-event-chain-table textarea').forEach(resizeTextareaElement);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [coreEventChainRows, isDraftReady]);

  const getScriptFormData = () => {
    const formData = new FormData(formRef.current);
    formData.set('video-type', selectedVideoType);
    formData.set('structure-mode', structureMode);
    Object.entries(videoTypeValues).forEach(([name, value]) => formData.set(name, value));
    Object.entries(aiBreakdownValues).forEach(([id, value]) => formData.set(`ai-breakdown-${id}`, value));
    if (hasEditedEmotionCurve) {
      formData.set('观众情绪曲线', getEmotionCurveText());
      formData.set('emotion-curve-nodes', JSON.stringify(emotionCurveNodes));
    }
    formData.set('video-timeline-entries', JSON.stringify(videoTimelineEntries));
    formData.set('video-timeline-types', JSON.stringify(videoTimelineTypes));
    formData.set('video-timeline-duration', String(videoTimelineDuration));
    return formData;
  };

  const buildExportContent = () => {
    const formData = getScriptFormData();
    const title = formData.get('title')?.trim() || '脚本拆解';
    const collectionMetadata = collectionVideo?.details?.metadata || {};
    const benchmarkDetails = getBenchmarkMetadataFields(benchmarkVideoUrl)
      .map((field) => `${field.label}：${collectionMetadata[field.name]?.trim() || '（未填写）'}`)
      .join('\n');
    const videoTypeDetails = activeVideoType
      ? activeVideoType.fields.map((field) => `#### ${field.title}\n\n${formData.get(field.name)?.trim() || '（未填写）'}`).join('\n\n')
      : '';
    const universalDetails = universalFields
      .map((field) => `### ${field.title}\n\n${formData.get(field.title)?.trim() || '（未填写）'}`)
      .join('\n\n');
    const coreEventChainTable = [
      `${activeStructureModeLabel} | 内容 | 结构任务/镜头功能 | 观众心理`,
      '--- | --- | --- | ---',
      ...coreEventChainRows.map((row) => [
        getCoreEventRangeText(row, formData),
        formData.get(row.contentName)?.trim() || '（未填写）',
        formData.get(row.taskName)?.trim() || '（未填写）',
        formData.get(row.psychologyName)?.trim() || '（未填写）',
      ].map((value) => String(value).replaceAll('|', '\\|')).join(' | ')),
    ].map((row) => `| ${row} |`).join('\n');
    const timelineTypeById = new Map(videoTimelineTypes.map((type) => [type.id, type]));
    const videoTimelineTable = videoTimelineEntries.length ? [
      '时间 | 类型 | 事件 | 说明 | 可借鉴做法',
      '--- | --- | --- | --- | ---',
      ...[...videoTimelineEntries].sort((first, second) => first.start - second.start).map((entry) => {
        const type = timelineTypeById.get(entry.typeId);
        const timeRange = entry.end !== null && entry.end > entry.start
          ? formatVideoTimelineRange(entry.start, entry.end)
          : formatVideoTimelineTime(entry.start);
        return [
          timeRange,
          type?.label || '未分类',
          entry.title || '（未命名事件）',
          entry.description || '（未填写）',
          entry.takeaway || '（未填写）',
        ].map((value) => String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>')).join(' | ');
      }),
    ].map((row) => `| ${row} |`).join('\n') : '（暂无时间轴事件）';
    const sections = fields.map((field, index) => `## ${index + 4}. ${field.title}\n\n${formData.get(field.title)?.trim() || '（未填写）'}`);
    const markdown = [
      `# ${title}`,
      '',
      '## 1. 对标视频',
      '',
      formData.get('benchmark-video')?.trim() || '（未填写）',
      '',
      '### 视频资料',
      '',
      benchmarkDetails || '（未填写）',
      '',
      '## 视频拆解时间轴',
      '',
      videoTimelineTable,
      '',
      '## 1. 视频类型',
      '',
      activeVideoType?.label || '（未选择）',
      ...(videoTypeDetails ? ['', '### 拆解维度', '', videoTypeDetails] : []),
      '',
      '## 2. 通用传播维度',
      '',
      universalDetails,
      '',
      '## 3. 剧情结构',
      '',
      coreEventChainTable,
      '',
      ...sections,
      '',
    ].join('\n');
    return { markdown, title };
  };

  const getFormValues = () => ({
    ...Object.fromEntries(getScriptFormData().entries()),
    'core-event-chain-row-ids': coreEventChainRows.map((row) => row.id),
  });

  const persistDraft = (showNotice = false) => {
    try {
      const formValues = getFormValues();
      const hasDraftContent = selectedVideoType || videoTimelineEntries.length > 0 || Object.entries(formValues).some(([name, value]) => (
        name !== 'video-type'
        && name !== 'structure-mode'
        && name !== 'core-event-chain-row-ids'
        && name !== 'video-timeline-entries'
        && name !== 'video-timeline-types'
        && name !== 'video-timeline-duration'
        && typeof value === 'string'
        && value.trim()
      ));

      if (!hasDraftContent) {
        window.localStorage.removeItem('script-breakdown-draft-v1');
        if (showNotice) setNotice('当前练习为空，无需保存');
        return;
      }

      window.localStorage.setItem('script-breakdown-draft-v1', JSON.stringify(formValues));
      if (showNotice) setNotice('当前练习已保存在此浏览器');
    } catch {
      if (showNotice) setNotice('保存失败，请检查浏览器存储权限');
    }
  };

  React.useEffect(() => {
    if (!isDraftReady) return undefined;

    window.clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = window.setTimeout(() => persistDraft(), 800);
    return () => window.clearTimeout(draftSaveTimerRef.current);
  }, [
    aiBreakdownValues,
    benchmarkVideoUrl,
    coreEventChainRows,
    draftRevision,
    emotionCurveNodes,
    hasEditedEmotionCurve,
    isDraftReady,
    videoTimelineDuration,
    videoTimelineEntries,
    videoTimelineTypes,
    selectedVideoType,
    structureMode,
    videoTypeValues,
  ]);

  React.useEffect(() => {
    if (!isDraftReady) return undefined;

    const saveBeforeLeaving = () => persistDraft();
    window.addEventListener('pagehide', saveBeforeLeaving);
    return () => window.removeEventListener('pagehide', saveBeforeLeaving);
  }, [aiBreakdownValues, benchmarkVideoUrl, coreEventChainRows, emotionCurveNodes, hasEditedEmotionCurve, isDraftReady, selectedVideoType, structureMode, videoTimelineDuration, videoTimelineEntries, videoTimelineTypes, videoTypeValues]);

  const fillBenchmarkMetadata = (pastedText) => {
    if (!formRef.current) return 0;
    const parsedValues = new Map();
    pastedText.split(/\r?\n/).forEach((line) => {
      const normalizedLine = line
        .replace(/^\s*(?:[-+•]\s+|\d+[.)]\s+)?/, '')
        .replace(/[*_`]/g, '')
        .trim();
      const separatorIndex = normalizedLine.indexOf('：') >= 0 ? normalizedLine.indexOf('：') : normalizedLine.indexOf(':');
      if (separatorIndex < 0) return;

      const label = normalizedLine.slice(0, separatorIndex).trim();
      const value = normalizedLine.slice(separatorIndex + 1).trim();
      const matchingField = benchmarkMetadataFields.find((field) => field.label === label);
      if (matchingField) parsedValues.set(matchingField.name, value);
    });

    parsedValues.forEach((value, name) => {
      const control = formRef.current.elements.namedItem(name);
      const shouldNormalizeDouyinVideo = name === 'benchmark-video-url'
        && detectBenchmarkPlatform(value) === 'douyin';
      if (control && typeof control.value === 'string') {
        control.value = shouldNormalizeDouyinVideo ? normalizeDouyinVideoUrl(value) : value;
      }
    });
    return parsedValues.size;
  };

  const pasteBenchmarkMetadata = (event) => {
    const filledCount = fillBenchmarkMetadata(event.clipboardData.getData('text/plain'));
    if (!filledCount) return;
    event.preventDefault();
    setNotice(`已填入 ${filledCount} 项视频资料`);
  };

  const applyBenchmarkMetadataPasteText = (text) => {
    setBenchmarkMetadataPasteText(text);
    const filledCount = fillBenchmarkMetadata(text);
    if (!filledCount) return;

    setBenchmarkMetadataPasteText('');
    setIsBenchmarkMetadataPasteOpen(false);
    setNotice(`已填入 ${filledCount} 项视频资料`);
  };

  const handleBenchmarkMetadataPasteText = (event) => {
    event.preventDefault();
    applyBenchmarkMetadataPasteText(event.clipboardData.getData('text/plain'));
  };

  const copyBenchmarkMetadata = async () => {
    const formData = new FormData(formRef.current);
    const metadataText = benchmarkMetadataFields
      .map((field) => `${field.label}：${formData.get(field.name)?.trim() || ''}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(metadataText);
      setNotice('视频资料已复制');
    } catch {
      setNotice('复制失败，请允许浏览器访问剪贴板');
    }
  };

  const copyBenchmarkMetadataPrompt = async () => {
    const benchmarkVideo = new FormData(formRef.current).get('benchmark-video')?.trim();
    const prompt = activePromptTemplate.includes('{{视频链接}}')
      ? activePromptTemplate.replaceAll('{{视频链接}}', benchmarkVideo || '')
      : benchmarkVideo
        ? `视频链接：${benchmarkVideo}\n\n${activePromptTemplate}`
        : activePromptTemplate;

    try {
      await navigator.clipboard.writeText(prompt);
      setNotice(benchmarkVideo ? `${activeBenchmarkPlatform.label} 视频资料提示词已复制，已附视频链接` : `${activeBenchmarkPlatform.label} 视频资料提示词已复制`);
    } catch {
      setNotice('复制失败，请允许浏览器访问剪贴板');
    }
  };

  const saveBenchmarkPromptSettings = () => {
    try {
      window.localStorage.setItem(
        `benchmark-video-prompt-${promptSettingsPlatform}-v1`,
        promptSettingsTemplate.trim() || defaultBenchmarkPrompts[promptSettingsPlatform],
      );
      setIsBenchmarkPromptSettingsOpen(false);
      setNotice('视频资料提示词已保存');
    } catch {
      setNotice('保存失败，请检查浏览器存储权限');
    }
  };

  const resetBenchmarkPrompt = () => {
    setBenchmarkPromptTemplates((templates) => ({
      ...templates,
      [promptSettingsPlatform]: defaultBenchmarkPrompts[promptSettingsPlatform],
    }));
    window.localStorage.removeItem(`benchmark-video-prompt-${promptSettingsPlatform}-v1`);
    if (promptSettingsPlatform === 'youtube') window.localStorage.removeItem('benchmark-video-prompt-v1');
    setNotice('已恢复默认提示词');
  };

  const buildAiPrompt = () => {
    const formData = formRef.current ? getScriptFormData() : new FormData();
    const benchmarkVideo = formData.get('benchmark-video')?.trim();
    if (!benchmarkVideo) return '';

    const sectionList = [
      `1. 视频类型：${activeVideoType?.label || '未选择'}`,
      ...getAiBreakdownSectionDefinitions().map((section) => section.label),
    ].join('\n');
    return `请独立拆解下面这个对标视频的脚本，不要参考或复述我的答案。\n\n对标视频：${benchmarkVideo}\n\n请严格按以下编号和标题作答：每个标题必须单独占一行，标题文字和编号不要改写；标题下面再写内容。无法判断的项目写“（未分析）”。不要用表格，不要合并项目。\n\n${sectionList}\n\n重点说明故事如何展开、冲突在哪里出现、转折如何解决，以及声音与动作怎样分工。`;
  };

  const saveDraft = () => {
    persistDraft(true);
  };

  const archiveBreakdown = () => {
    const formValues = getFormValues();
    const title = formValues.title?.trim() || '未命名脚本拆解';
    const hasContent = selectedVideoType || videoTimelineEntries.length > 0 || Object.entries(formValues).some(([name, value]) => (
      name !== 'video-type'
      && name !== 'structure-mode'
      && name !== 'core-event-chain-row-ids'
      && name !== 'video-timeline-entries'
      && name !== 'video-timeline-types'
      && name !== 'video-timeline-duration'
      && typeof value === 'string'
      && value.trim()
    ));
    if (!hasContent) {
      setNotice('先填写一些拆解内容，再完成归档');
      return;
    }

    try {
      const archiveKey = 'script-breakdown-archives-v1';
      const existing = JSON.parse(window.localStorage.getItem(archiveKey) || '[]');
      const archivedAt = new Date().toISOString();
      const archive = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        title,
        archivedAt,
        videoType: activeVideoType?.label || '未标记',
        structureMode: activeStructureModeLabel,
        shotRows: coreEventChainRows.length,
        values: formValues,
      };
      window.localStorage.setItem(archiveKey, JSON.stringify([archive, ...(Array.isArray(existing) ? existing : [])]));
      if (collectionVideo?.id) {
        const collectionKey = 'video-collection-v1';
        const collectionVideos = JSON.parse(window.localStorage.getItem(collectionKey) || '[]');
        if (Array.isArray(collectionVideos)) {
          window.localStorage.setItem(collectionKey, JSON.stringify(collectionVideos.map((video) => video.id === collectionVideo.id ? { ...video, status: 'archived', archivedAt } : video)));
        }
      }
      persistDraft();
      setNotice(`已完成并归档「${title}」，创作数据页会自动计入这条拆解`);
    } catch {
      setNotice('归档失败，请检查浏览器存储权限');
    }
  };

  const clearScriptBreakdown = () => {
    if (!window.confirm('确定清空当前脚本拆解的所有内容吗？此操作无法撤销。')) return;

    window.clearTimeout(draftSaveTimerRef.current);
    formRef.current?.reset();
    setIsExportOpen(false);
    setComparison(null);
    setSelectedVideoType('');
    setVideoTypeValues({});
    setStructureMode('shots');
    setCoreEventChainRows([1, 2, 3].map(createCoreEventChainRow));
    setEmotionCurveNodes(createDefaultEmotionCurveNodes());
    setSelectedEmotionCurveNodeId(1);
    setHasEditedEmotionCurve(false);
    setVideoTimelineEntries([]);
    setVideoTimelineTypes(VIDEO_TIMELINE_DEFAULT_TYPES);
    setVideoTimelineDuration(60);
    setAiBreakdownValues({});
    setAiDistributionSummary(null);
    setBenchmarkVideoUrl('');
    setBenchmarkPlatform('youtube');
    setIsBenchmarkMetadataPasteOpen(false);
    setBenchmarkMetadataPasteText('');
    setDraftRevision((revision) => revision + 1);
    window.localStorage.removeItem('script-breakdown-draft-v1');
    setNotice('已清空当前脚本拆解');
  };

  const copyAiPrompt = async () => {
    const prompt = buildAiPrompt();
    if (!prompt) {
      setNotice('请先粘贴对标视频链接');
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      setNotice('AI 拆解提示词已复制');
    } catch {
      setNotice('复制失败，请允许浏览器访问剪贴板');
    }
  };

  const distributeAiBreakdown = () => {
    const formData = getScriptFormData();
    const rawAiBreakdown = formData.get('ai-analysis')?.trim();
    if (!rawAiBreakdown) {
      setNotice('请先粘贴 AI 的完整拆解结果');
      return;
    }

    const definitions = getAiBreakdownSectionDefinitions();
    const distributedValues = splitAiBreakdownIntoSections(rawAiBreakdown, definitions);
    const matchedCount = Object.keys(distributedValues).length;

    if (!matchedCount) {
      setAiDistributionSummary({ matched: 0, total: definitions.length });
      setNotice('没有识别到对应标题；请让 AI 保留提示词中的编号和标题');
      return;
    }

    setAiBreakdownValues((values) => ({ ...values, ...distributedValues }));
    setAiDistributionSummary({ matched: matchedCount, total: definitions.length });
    setComparison(null);
    setNotice(`已整理 ${matchedCount}/${definitions.length} 项；其余原文仍保留在上方，可手动补充`);
  };

  const showComparison = () => {
    const formData = getScriptFormData();
    const hasCoreEventChain = coreEventChainRows.some((row) => [...getCoreEventRangeNames(row), row.contentName, row.taskName, row.psychologyName]
      .some((name) => formData.get(name)?.trim()));
    const hasOwnBreakdown = [...universalFields, ...fields].some((field) => formData.get(field.title)?.trim())
      || activeVideoType?.fields.some((field) => formData.get(field.name)?.trim())
      || hasCoreEventChain;
    const aiAnalysis = formData.get('ai-analysis')?.trim();

    if (!hasOwnBreakdown || !aiAnalysis) {
      setNotice('完成自己的拆解并粘贴 AI 结果后，才可以对比');
      return;
    }

    const sections = getAiBreakdownSections(formData);
    if (!sections.some((section) => section.ai)) {
      setNotice('请先点击“整理到各项”，或在对应项目下手动补充 AI 拆解');
      return;
    }

    const coloredSections = sections.filter((section) => section.ai).map((section) => ({
      ...section,
      colored: getColoredComparison(section),
    }));
    const summary = coloredSections.reduce((total, section) => ({
      same: total.same + section.colored.aiPoints.filter((point) => point.status === 'same').length,
      missing: total.missing + section.colored.aiPoints.filter((point) => point.status === 'missing').length,
      extra: total.extra + section.colored.ownExtra.length,
    }), { same: 0, missing: 0, extra: 0 });

    setComparison({
      title: formData.get('title')?.trim() || '本次脚本拆解',
      sections: coloredSections,
      summary,
    });
  };

  const openExportDialog = () => {
    const formData = new FormData(formRef.current);
    setExportFileName(formData.get('title')?.trim() || '脚本拆解');
    setIsExportOpen(true);
  };

  const downloadExport = (content, fileName, mimeType) => {
    const file = new Blob([content], { type: mimeType });
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  const exportDocument = async () => {
    const { markdown } = buildExportContent();
    const extension = exportFormat === 'txt' ? 'txt' : 'md';
    const mimeType = extension === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8';
    const baseName = exportFileName.replace(/\.(md|txt)$/i, '').replace(/[\\/:*?"<>|]/g, '-').trim() || '脚本拆解';
    const fileName = `${baseName}.${extension}`;

    if (exportLocation === 'picker' && 'showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: extension === 'md' ? 'Markdown' : '纯文本', accept: { [mimeType.split(';')[0]]: [`.${extension}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(markdown);
        await writable.close();
        setIsExportOpen(false);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    downloadExport(markdown, fileName, mimeType);
    setIsExportOpen(false);
  };

  const getTimelineSourceEntries = () => {
    const formData = formRef.current ? new FormData(formRef.current) : null;
    const emotionEntries = emotionCurveNodes.map((node, index) => {
      const range = getEmotionTimeRange(node, index);
      const start = parseVideoTimelineTime(range.start);
      const end = parseVideoTimelineTime(range.end);
      return start === null ? null : {
        id: `emotion-${node.id}`,
        kind: 'emotion',
        start,
        end: end !== null && end > start ? end : null,
        label: node.idea?.trim() || `情绪节点 ${index + 1}`,
      };
    }).filter(Boolean);
    const coreEntries = coreEventChainRows.map((row, index) => {
      const start = parseVideoTimelineTime(formData?.get(row.timeStartName));
      const end = parseVideoTimelineTime(formData?.get(row.timeEndName));
      const label = formData?.get(row.contentName)?.trim() || `核心事件 ${index + 1}`;
      return start === null ? null : {
        id: `core-${row.id}`,
        kind: 'core',
        start,
        end: end !== null && end > start ? end : null,
        label,
      };
    }).filter(Boolean);
    return [...emotionEntries, ...coreEntries];
  };

  const importTimelineEntryToEmotionCurve = (entry) => {
    const nextId = Math.max(...emotionCurveNodes.map((node) => node.id), 0) + 1;
    setHasEditedEmotionCurve(true);
    setEmotionCurveNodes((nodes) => [...nodes, {
      ...createEmotionCurveNode(nextId, 0),
      startTime: formatVideoTimelineTime(entry.start),
      endTime: entry.end !== null ? formatVideoTimelineTime(entry.end) : '',
      range: '来自视频拆解时间轴',
      idea: entry.title?.trim() || '时间轴事件',
    }]);
    setSelectedEmotionCurveNodeId(nextId);
    setNotice(`已将「${entry.title?.trim() || '时间轴事件'}」导入情绪曲线`);
  };

  return (
    <section className={`script-breakdown-panel${breakdownStylePreview ? ` breakdown-style-preview preview-${activeBreakdownStyle}` : ''}`} aria-label="脚本拆解">
      {breakdownStylePreview && (
        <section className="breakdown-style-switcher" aria-label="拆解学习局部风格预览">
          <div>
            <strong>局部风格预览</strong>
            <span>仅本地开发环境可见；不影响字段、数据或正式页面。</span>
          </div>
          <div className="breakdown-style-options" role="group" aria-label="选择局部风格方案">
            {breakdownStylePreviewOptions.map((option) => (
              <button
                className={activeBreakdownStyle === option.id ? 'active' : undefined}
                type="button"
                key={option.id}
                aria-pressed={activeBreakdownStyle === option.id}
                title={option.summary}
                onClick={() => {
                  const nextUrl = new URL(window.location.href);
                  nextUrl.searchParams.set('style-preview', '1');
                  nextUrl.searchParams.set('breakdown-style', option.id);
                  window.location.assign(nextUrl.toString());
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )}
      <aside
        className={minimapState.visible ? 'script-breakdown-minimap is-visible' : 'script-breakdown-minimap'}
        aria-label="脚本拆解导航"
      >
        {scriptBreakdownNavItems.map((item, index) => (
          <button
            className={index === minimapState.activeIndex ? 'is-active' : undefined}
            type="button"
            key={item.id}
            title={item.label}
            aria-label={`跳转至${item.label}`}
            aria-current={index === minimapState.activeIndex ? 'location' : undefined}
            onClick={() => scrollToBreakdownSection(item.id)}
          />
        ))}
      </aside>
      <div className="form-card-heading">
        <span className="section-icon section-icon-blue"><Scissors size={18} /></span>
        <div>
          <h2>脚本拆解</h2>
          <p>先自己拆解，再邀请 AI 独立作答，最后对照答案。</p>
        </div>
        <div className="script-breakdown-actions">
          <button className="script-breakdown-save" type="button" onClick={saveDraft}>
            <Save size={17} /> 保存
          </button>
          <button className="script-breakdown-export" type="button" onClick={archiveBreakdown}>
            <Database size={17} /> 完成并归档
          </button>
          <button className="script-breakdown-export" type="button" onClick={openExportDialog} aria-label="导出" title="导出">
            <Download size={18} /> 导出
          </button>
          <span className="script-breakdown-action-separator" aria-hidden="true" />
          <button className="script-breakdown-clear" type="button" onClick={clearScriptBreakdown}>
            <Trash2 size={17} /> 清空全部
          </button>
        </div>
      </div>
      {notice && <p className="script-breakdown-notice" role="status">{notice}</p>}
      {isExportOpen && (
        <section className="script-export-popover" aria-label="导出选项">
          <h3>导出</h3>
          <label>
            导出位置
            <select value={exportLocation} onChange={(event) => setExportLocation(event.target.value)}>
              <option value="picker">选择保存位置</option>
              <option value="download">浏览器默认下载位置</option>
            </select>
          </label>
          <label>
            导出格式
            <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
              <option value="md">Markdown (.md)</option>
              <option value="txt">纯文本 (.txt)</option>
            </select>
          </label>
          <label>
            导出文件名
            <input value={exportFileName} onChange={(event) => setExportFileName(event.target.value)} />
          </label>
          <div className="script-export-actions">
            <button type="button" className="text-button" onClick={() => setIsExportOpen(false)}>取消</button>
            <button type="button" className="primary-button" onClick={exportDocument}>导出</button>
          </div>
        </section>
      )}
      <form
        className="form-stack script-breakdown-form"
        ref={formRef}
        onInput={() => setDraftRevision((revision) => revision + 1)}
        onSubmit={(event) => event.preventDefault()}
      >
        <input type="hidden" name="benchmark-video" value={benchmarkVideoUrl} readOnly />
        <label className="script-breakdown-title-field">
          <span>标题</span>
          <input name="title" placeholder="x月x日 脚本拆解v1" />
        </label>
        <VideoBreakdownTimeline
          entries={videoTimelineEntries}
          types={videoTimelineTypes}
          duration={videoTimelineDuration}
          sourceEntries={getTimelineSourceEntries()}
          onEntriesChange={setVideoTimelineEntries}
          onTypesChange={setVideoTimelineTypes}
          onDurationChange={setVideoTimelineDuration}
          onImportToEmotionCurve={importTimelineEntryToEmotionCurve}
          onOpenSource={(kind) => scrollToBreakdownSection(kind === 'emotion' ? 'emotion-curve-title' : 'script-breakdown-structure')}
        />
        <section className="video-type-section" id="script-breakdown-video-type" aria-labelledby="video-type-title">
          <div className="video-type-heading">
            <div>
              <strong id="video-type-title">1. 视频类型</strong>
              <span>选择后展示对应的拆解维度</span>
            </div>
            {activeVideoType && <em>{activeVideoType.label}</em>}
          </div>
          <div className="video-type-options" role="group" aria-label="选择视频类型">
            {videoTypeOptions.map((option) => {
              const isSelected = option.value === selectedVideoType;
              return (
                <button
                  className={isSelected ? 'video-type-option selected' : 'video-type-option'}
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedVideoType(option.value);
                    setNotice(`已选择“${option.label}”，已填写内容会保留`);
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              );
            })}
          </div>
          {activeVideoType && (
            <div className="video-type-breakdown" aria-live="polite">
              <div className="video-type-breakdown-heading">
                <strong>拆解维度</strong>
                <span>{activeVideoType.description}</span>
              </div>
              {activeVideoType.fields.map((field, index) => (
                <div className="script-breakdown-field video-type-field" key={field.name}>
                  <label>
                    <span className="script-breakdown-label">
                      <strong>
                        2.{index + 1} {field.title}
                        {field.name === 'video-type-emotion-pain-point' && <span className="script-breakdown-priority-star" role="img" aria-label="重点维度">⭐</span>}
                      </strong>
                      <em>{field.hint}</em>
                    </span>
                    <textarea
                      name={field.name}
                      value={videoTypeValues[field.name] || ''}
                      rows={3}
                      placeholder={field.placeholder}
                      onChange={(event) => setVideoTypeValues((values) => ({ ...values, [field.name]: event.target.value }))}
                      onInput={resizeTextarea}
                    />
                  </label>
                  <TextFormattingToolbar />
                  {renderInlineAiBreakdown(`video-type-${field.name}`, `1.${index + 1} ${field.title}`)}
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="video-type-section universal-dimensions-section" id="script-breakdown-universal" aria-labelledby="universal-dimensions-title">
          <div className="video-type-heading">
            <div>
              <strong id="universal-dimensions-title">2. 通用传播维度</strong>
              <span>适用于所有视频类型的传播拆解</span>
            </div>
          </div>
          <div className="video-type-breakdown">
            {universalFields.map((field, index) => (
              <div className="script-breakdown-field video-type-field" key={field.title}>
                <label>
                  <span className="script-breakdown-label">
                    <strong className="script-breakdown-accent">
                      2.{index + 1} {field.title}
                      {index === 0 && <span className="script-breakdown-priority-star" role="img" aria-label="重点维度">⭐</span>}
                    </strong>
                  </span>
                  <textarea name={field.title} rows={3} placeholder={field.placeholder} onInput={resizeTextarea} />
                </label>
                <TextFormattingToolbar />
                {renderInlineAiBreakdown(`universal-${index + 1}`, `2.${index + 1} ${field.title}`)}
              </div>
            ))}
          </div>
        </section>
        <section className="core-event-chain-structure" id="script-breakdown-structure" aria-labelledby="core-event-chain-structure-title">
          <h3 id="core-event-chain-structure-title">3. 剧情结构 <span className="script-breakdown-priority-star" role="img" aria-label="重点维度">⭐</span></h3>
          <div className="core-event-chain-mode-switcher" role="group" aria-label="剧情结构填写方式">
            {structureModeOptions.map((option) => (
              <button
                className={structureMode === option.value ? 'active' : undefined}
                type="button"
                key={option.value}
                aria-pressed={structureMode === option.value}
                onClick={() => setStructureMode(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className={`core-event-chain-table mode-${structureMode}`}>
            <table>
            <colgroup>
              <col className="core-event-chain-range-column" />
              <col className="core-event-chain-content-column" />
              <col className="core-event-chain-task-column" />
              <col className="core-event-chain-psychology-column" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">分镜／时间</th>
                <th scope="col">内容</th>
                <th scope="col">结构任务/镜头功能</th>
                <th scope="col">观众心理</th>
              </tr>
            </thead>
            <tbody>
              {coreEventChainRows.map((row, rowIndex) => (
                <tr key={row.id}>
                  <th scope="row">
                    <span className="core-event-chain-ranges">
                      <span className="core-event-chain-range core-event-chain-shot-range">
                        <input type="number" min="1" inputMode="numeric" name={row.startName} placeholder={row.startPlaceholder} aria-label={`分镜起始编号，第 ${rowIndex + 1} 行`} />
                        <span>~</span>
                        <input type="number" min="1" inputMode="numeric" name={row.endName} placeholder={row.endPlaceholder} aria-label={`分镜结束编号，第 ${rowIndex + 1} 行`} onChange={(event) => updateNextCoreEventStart(rowIndex, event)} />
                      </span>
                      <span className="core-event-chain-range core-event-chain-time-range">
                        <input type="text" inputMode="numeric" name={row.timeStartName} placeholder={row.timeStartPlaceholder} aria-label={`时间起始，第 ${rowIndex + 1} 行`} onInput={(event) => { delete event.currentTarget.dataset.autoFilled; }} onBlur={formatCoreEventTime} />
                        <span>~</span>
                        <input type="text" inputMode="numeric" name={row.timeEndName} placeholder={row.timeEndPlaceholder} aria-label={`时间结束，第 ${rowIndex + 1} 行`} onBlur={(event) => updateNextCoreEventTime(rowIndex, event)} />
                      </span>
                    </span>
                  </th>
                  <td><textarea name={row.contentName} rows={1} aria-label={`内容，第 ${rowIndex + 1} 行`} onInput={resizeTextarea} /></td>
                  <td><textarea name={row.taskName} rows={1} aria-label={`结构任务/镜头功能，第 ${rowIndex + 1} 行`} onInput={resizeTextarea} /></td>
                  <td><textarea name={row.psychologyName} rows={1} aria-label={`观众心理，第 ${rowIndex + 1} 行`} onInput={resizeTextarea} /></td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          <div className="core-event-chain-actions">
            <button className="core-event-chain-add-row" type="button" onClick={addCoreEventChainRow}>＋ 新增一行</button>
            <button className="core-event-chain-remove-row" type="button" onClick={removeLastCoreEventChainRow} disabled={coreEventChainRows.length === 1}>删除底行</button>
          </div>
          {renderInlineAiBreakdown('story-structure', '3. 剧情结构')}
        </section>
        {fields.map((field, index) => field.title === '观众情绪曲线' ? (
          <React.Fragment key={field.title}>
            {renderEmotionCurveEditor(index + 4)}
            {renderInlineAiBreakdown(`field-${index + 5}`, `${index + 4}. ${field.title}`)}
          </React.Fragment>
        ) : (
          <div className="script-breakdown-field" id={index === 0 ? 'script-breakdown-extra' : undefined} key={field.title}>
            <label>
              <span className="script-breakdown-label">
                <strong className={field.accent ? 'script-breakdown-accent' : undefined}>
                  {index + 4}. {field.title}
                  <span className="script-breakdown-priority-star" role="img" aria-label="重点维度">⭐</span>
                </strong>
                {field.hint && <em>{field.hint}</em>}
              </span>
              <textarea name={field.title} rows={3} placeholder={field.placeholder} onInput={resizeTextarea} />
            </label>
            <TextFormattingToolbar />
            {renderInlineAiBreakdown(`field-${index + 5}`, `${index + 4}. ${field.title}`)}
          </div>
        ))}
        <section className="ai-breakdown-step" id="script-breakdown-ai" aria-labelledby="ai-breakdown-title">
          <div className="ai-breakdown-step-heading">
            <div>
              <span className="script-breakdown-step-number">2</span>
              <h3 id="ai-breakdown-title">让 AI 独立拆解</h3>
            </div>
            <p>将 AI 的完整回答粘贴在这里，点击“整理到各项”后，系统会按对应维度放入各项下方的 AI 拆解框。原始回答会保留，方便随时回看。</p>
          </div>
          <div className="ai-prompt-control-row">
            <details className="ai-prompt-preview">
              <summary>AI 拆解提示词</summary>
              <textarea
                readOnly
                rows={8}
                value={buildAiPrompt()}
                placeholder="填写对标视频链接后，这里会生成 AI 拆解提示词"
                aria-label="AI 拆解提示词"
              />
            </details>
            <button className="script-breakdown-copy" type="button" onClick={copyAiPrompt}>
              <Copy size={17} /> 复制 AI 拆解提示词
            </button>
          </div>
          <label className="script-breakdown-field ai-result-field">
            <span className="script-breakdown-label ai-result-label">
              <span>
                <strong>AI 拆解结果</strong>
                <em>粘贴后点“整理到各项”；原始回答会始终保留。</em>
              </span>
              <button className="script-breakdown-distribute" type="button" onClick={distributeAiBreakdown}>
                <ClipboardPaste size={17} /> 整理到各项
              </button>
            </span>
            <textarea
              name="ai-analysis"
              rows={8}
              placeholder="在这里粘贴 AI 的脚本拆解回答"
              onInput={(event) => {
                resizeTextarea(event);
                setAiDistributionSummary(null);
                setComparison(null);
              }}
            />
          </label>
          {aiDistributionSummary && (
            <p className="ai-distribution-summary">
              已识别 {aiDistributionSummary.matched}/{aiDistributionSummary.total} 项；未识别内容仍保留在原始回答中。
            </p>
          )}
        </section>
        <section className="script-comparison-action" id="script-breakdown-compare" aria-label="对比答案">
          <div>
            <span className="script-breakdown-step-number">3</span>
            <h3>生成颜色对照</h3>
            <p>根据你的拆解与 AI 拆解，自动生成逐项对照：红色提示待补要点，灰色表示内容一致，蓝色标出你的额外拆解。结果直接显示在各项下方的“AI 对照版”中。</p>
          </div>
          <button className="primary-button script-compare-button" type="button" onClick={showComparison}>
            <Sparkles size={17} /> 生成颜色对照
          </button>
        </section>
      </form>
      {comparison && (
        <section className="script-comparison-panel" aria-labelledby="script-comparison-title">
          <div className="script-comparison-heading">
            <div>
              <span className="section-icon section-icon-purple"><Sparkles size={18} /></span>
              <h3 id="script-comparison-title">{comparison.title} · 对照已生成</h3>
            </div>
            <button className="text-button" type="button" onClick={() => setComparison(null)}>收起</button>
          </div>
          <p className="script-comparison-summary">颜色已放回每个项目下方的 AI 对照版，不再重复展示左右两栏。</p>
          <div className="script-comparison-totals" aria-label="本次颜色对照汇总">
            <span className="is-missing">红色待补 {comparison.summary.missing} 条</span>
            <span className="is-same">灰色一致 {comparison.summary.same} 条</span>
            <span className="is-extra">蓝色额外 {comparison.summary.extra} 条</span>
          </div>
        </section>
      )}
    </section>
  );
}

function VideoBreakdownTimeline({ entries, types, duration, sourceEntries, onEntriesChange, onTypesChange, onDurationChange, onImportToEmotionCurve, onOpenSource }) {
  const railRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [selectedEntryId, setSelectedEntryId] = React.useState(null);
  const [draggingEntryId, setDraggingEntryId] = React.useState(null);
  const [timelinePointer, setTimelinePointer] = React.useState(null);
  const [customTypeName, setCustomTypeName] = React.useState('');
  const [customTypeColor, setCustomTypeColor] = React.useState('#3976d5');
  const safeDuration = Math.max(1, Number(duration) || 60);
  const typeById = new Map(types.map((type) => [type.id, type]));
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) || null;
  const typeGroups = types.reduce((groups, type) => {
    groups[type.group] = groups[type.group] || [];
    groups[type.group].push(type);
    return groups;
  }, {});
  const sortedEntries = [...entries].sort((first, second) => first.start - second.start);
  const latestContentTime = [...entries, ...sourceEntries].reduce((latest, entry) => Math.max(latest, entry.end ?? entry.start ?? 0), 0);
  const minimumVisibleDuration = Math.min(safeDuration, VIDEO_TIMELINE_MIN_VISIBLE_SECONDS);
  const visibleDuration = Math.min(
    safeDuration,
    Math.max(minimumVisibleDuration, Math.ceil((latestContentTime + 1) / VIDEO_TIMELINE_RULER_INTERVAL_SECONDS) * VIDEO_TIMELINE_RULER_INTERVAL_SECONDS),
  );
  const rulerInterval = visibleDuration <= 5 * 60
    ? VIDEO_TIMELINE_RULER_INTERVAL_SECONDS
    : visibleDuration <= 15 * 60
      ? 60
      : 5 * 60;
  const rulerMarks = Array.from(
    { length: Math.floor(visibleDuration / rulerInterval) + 1 },
    (_, index) => index * rulerInterval,
  );
  if (rulerMarks[rulerMarks.length - 1] !== visibleDuration) rulerMarks.push(visibleDuration);

  React.useEffect(() => {
    if (selectedEntryId && entries.some((entry) => entry.id === selectedEntryId)) return;
    setSelectedEntryId(entries[0]?.id || null);
  }, [entries, selectedEntryId]);

  const updateEntry = (id, changes) => onEntriesChange(entries.map((entry) => entry.id === id ? { ...entry, ...changes } : entry));

  const updateTimeFromInput = (entry, field, rawValue, input) => {
    const parsed = parseVideoTimelineTime(rawValue);
    if (parsed === null) {
      input.value = field === 'start' ? formatVideoTimelineTime(entry.start) : formatVideoTimelineTime(entry.end);
      return;
    }
    const snappedValue = snapVideoTimelineTime(parsed);
    const nextValue = clampVideoTimelineTime(snappedValue, safeDuration);
    if (field === 'start') {
      updateEntry(entry.id, { start: entry.end !== null ? Math.min(nextValue, entry.end - VIDEO_TIMELINE_DRAG_STEP_SECONDS) : nextValue });
      return;
    }
    updateEntry(entry.id, { end: Math.max(nextValue, entry.start + VIDEO_TIMELINE_DRAG_STEP_SECONDS) });
  };

  const createEntry = () => {
    const defaultType = typeById.get('story-hook') || types[0];
    const latestStart = entries.length ? Math.max(...entries.map((entry) => entry.end ?? entry.start)) : 0;
    const start = snapVideoTimelineTime(Math.min(safeDuration, latestStart));
    const nextEntry = {
      id: createVideoTimelineId(),
      typeId: defaultType?.id || '',
      start,
      end: null,
      title: '',
      description: '',
      tags: '',
      takeaway: '',
      color: defaultType?.color || '#7647c8',
    };
    onEntriesChange([...entries, nextEntry]);
    setSelectedEntryId(nextEntry.id);
  };

  const removeEntry = () => {
    if (!selectedEntry) return;
    onEntriesChange(entries.filter((entry) => entry.id !== selectedEntry.id));
  };

  const addCustomType = () => {
    const label = customTypeName.trim();
    if (!label || types.some((type) => type.label === label)) return;
    const nextType = { id: `custom-${createVideoTimelineId()}`, group: '自定义类型', label, color: customTypeColor };
    onTypesChange([...types, nextType]);
    setCustomTypeName('');
    if (selectedEntry) updateEntry(selectedEntry.id, { typeId: nextType.id, color: nextType.color });
  };

  const updateDuration = (value) => {
    const nextDuration = Math.max(VIDEO_TIMELINE_DRAG_STEP_SECONDS, snapVideoTimelineTime((Number(value) || 0.5) * 60));
    onDurationChange(nextDuration);
    onEntriesChange(entries.map((entry) => ({
      ...entry,
      start: clampVideoTimelineTime(entry.start, nextDuration),
      end: entry.end === null ? null : Math.max(clampVideoTimelineTime(entry.end, nextDuration), Math.min(nextDuration, entry.start + VIDEO_TIMELINE_DRAG_STEP_SECONDS)),
    })));
  };

  const moveEntryWithKeyboard = (event, entry) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? VIDEO_TIMELINE_DRAG_STEP_SECONDS : -VIDEO_TIMELINE_DRAG_STEP_SECONDS;
    const span = entry.end !== null ? entry.end - entry.start : 0;
    const nextStart = clampVideoTimelineTime(snapVideoTimelineTime(entry.start + delta), safeDuration - span);
    updateEntry(entry.id, { start: nextStart, end: entry.end === null ? null : nextStart + span });
  };

  const startDrag = (event, entry, mode) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { id: entry.id, mode, clientX: event.clientX, start: entry.start, end: entry.end, visibleDuration };
    setSelectedEntryId(entry.id);
    setDraggingEntryId(entry.id);
  };

  const dragEntry = (event) => {
    const drag = dragRef.current;
    const railRect = railRef.current?.getBoundingClientRect();
    if (!drag || !railRect) return;
    const entry = entries.find((item) => item.id === drag.id);
    if (!entry) return;
    const delta = snapVideoTimelineTime(((event.clientX - drag.clientX) / railRect.width) * drag.visibleDuration);
    const originalEnd = drag.end === null ? null : drag.end;
    if (drag.mode === 'move') {
      const span = originalEnd === null ? 0 : originalEnd - drag.start;
      const start = clampVideoTimelineTime(snapVideoTimelineTime(drag.start + delta), safeDuration - span);
      updateEntry(entry.id, { start, end: originalEnd === null ? null : start + span });
      return;
    }
    if (originalEnd === null) return;
    if (drag.mode === 'start') {
      updateEntry(entry.id, { start: Math.min(Math.max(0, snapVideoTimelineTime(drag.start + delta)), originalEnd - VIDEO_TIMELINE_DRAG_STEP_SECONDS) });
      return;
    }
    updateEntry(entry.id, { end: Math.max(Math.min(safeDuration, snapVideoTimelineTime(originalEnd + delta)), drag.start + VIDEO_TIMELINE_DRAG_STEP_SECONDS) });
  };

  const stopDrag = (event) => {
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setDraggingEntryId(null);
  };

  const updateTimelinePointer = (event) => {
    const railRect = railRef.current?.getBoundingClientRect();
    if (!railRect?.width) return;
    const position = Math.max(0, Math.min(100, ((event.clientX - railRect.left) / railRect.width) * 100));
    const time = clampVideoTimelineTime(snapVideoTimelineTime((position / 100) * visibleDuration), safeDuration);
    setTimelinePointer({ position, time });
  };

  return (
    <section className="video-breakdown-timeline" id="script-breakdown-timeline" aria-labelledby="video-breakdown-timeline-title">
      <div className="video-timeline-heading">
        <div>
          <span className="video-timeline-kicker">视频拆解时间轴</span>
          <h3 id="video-breakdown-timeline-title">用时码记录关键事件</h3>
          <p>拖动节点、区间条或两端把手直接调整时间，每次按 1 秒更新。</p>
        </div>
        <label className="video-timeline-duration">
          视频时长
          <span><input type="number" min="0.5" step="0.5" value={safeDuration / 60} onChange={(event) => updateDuration(event.target.value)} aria-label="视频总时长，单位分钟，可填0.5表示00:30" /> 分钟</span>
        </label>
      </div>
      <div className="video-timeline-toolbar">
        <span>时间点显示为节点；时间段显示为区间条。拖动节点、区间条或两端把手即可调整时码。</span>
      </div>
      <div className="video-timeline-workbench">
      <div className="video-timeline-canvas">
      <div className="video-timeline-rail-scroll">
        <div className="video-timeline-rail" ref={railRef} style={{ '--video-timeline-rows': 2, '--video-timeline-sources': sourceEntries.length }} onMouseMove={updateTimelinePointer} onMouseLeave={() => setTimelinePointer(null)}>
          <div className="video-timeline-ruler" aria-hidden="true">
            {rulerMarks.map((mark) => <span key={mark} style={{ left: `${(mark / visibleDuration) * 100}%` }}>{formatVideoTimelineTime(mark)}</span>)}
          </div>
          <div className="video-timeline-grid" aria-hidden="true">
            {rulerMarks.map((mark) => <i key={mark} style={{ left: `${(mark / visibleDuration) * 100}%` }} />)}
          </div>
          {timelinePointer && <div className={`video-timeline-hover-guide${timelinePointer.position < 8 ? ' edge-start' : ''}${timelinePointer.position > 92 ? ' edge-end' : ''}`} style={{ '--timeline-hover-left': `${timelinePointer.position}%` }} aria-hidden="true"><span>{formatVideoTimelineTime(timelinePointer.time)}</span></div>}
          {sortedEntries.map((entry, index) => {
            const type = typeById.get(entry.typeId);
            const isInterval = entry.end !== null && entry.end > entry.start;
            const color = entry.color || type?.color || '#3976d5';
            const left = (clampVideoTimelineTime(entry.start, visibleDuration) / visibleDuration) * 100;
            const width = isInterval ? Math.max(1.2, ((Math.min(entry.end, visibleDuration) - entry.start) / visibleDuration) * 100) : 1.2;
            return (
              <div className={`video-timeline-entry${isInterval ? ' is-interval' : ' is-point'}${selectedEntryId === entry.id ? ' is-selected' : ''}${draggingEntryId === entry.id ? ' is-dragging' : ''}`} key={entry.id} style={{ '--timeline-left': `${left}%`, '--timeline-width': `${width}%`, '--timeline-row': isInterval ? 1 : 0, '--timeline-color': color }}>
                <button
                  type="button"
                  className="video-timeline-entry-body"
                  onClick={() => setSelectedEntryId(entry.id)}
                  onPointerDown={(event) => startDrag(event, entry, 'move')}
                  onPointerMove={dragEntry}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                  onLostPointerCapture={stopDrag}
                  onKeyDown={(event) => moveEntryWithKeyboard(event, entry)}
                  aria-label={`${type?.label || '未分类'}：${entry.title || '未命名事件'}，${isInterval ? `${formatVideoTimelineTime(entry.start)} 到 ${formatVideoTimelineTime(entry.end)}` : formatVideoTimelineTime(entry.start)}。使用左右方向键以1秒移动。`}
                  title={`${type?.label || '未分类'} · ${entry.title || '未命名事件'} · ${formatVideoTimelineRange(entry.start, entry.end)}`}
                >
                  <span>{entry.title || type?.label || '事件'}</span>
                </button>
                {draggingEntryId === entry.id && <span className="video-timeline-drag-time" aria-live="polite">{formatVideoTimelineRange(entry.start, entry.end)}</span>}
                {isInterval && <>
                  <button type="button" className="video-timeline-resize start" aria-label={`调整${entry.title || '事件'}的开始时间`} onPointerDown={(event) => startDrag(event, entry, 'start')} onPointerMove={dragEntry} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag} />
                  <button type="button" className="video-timeline-resize end" aria-label={`调整${entry.title || '事件'}的结束时间`} onPointerDown={(event) => startDrag(event, entry, 'end')} onPointerMove={dragEntry} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag} />
                </>}
              </div>
            );
          })}
          {sourceEntries.map((entry, index) => {
            const left = (clampVideoTimelineTime(entry.start, visibleDuration) / visibleDuration) * 100;
            const isInterval = entry.end !== null && entry.end > entry.start;
            const width = isInterval ? Math.max(0.8, ((Math.min(entry.end, visibleDuration) - entry.start) / visibleDuration) * 100) : 0.8;
            return <button type="button" className={`video-timeline-source source-${entry.kind}`} key={entry.id} style={{ '--timeline-left': `${left}%`, '--timeline-width': `${width}%`, '--timeline-source-row': index }} onClick={() => onOpenSource(entry.kind)} title={`来自${entry.kind === 'emotion' ? '情绪曲线' : '核心事件链'}：${entry.label}`}><span>{entry.kind === 'emotion' ? '情绪' : '事件链'} · {entry.label}</span></button>;
          })}
        </div>
      </div>
      <div className="video-timeline-source-key" aria-label="时间轴来源标记说明"><span className="emotion">情绪曲线来源</span><span className="core">核心事件链来源</span></div>
      </div>
      {selectedEntry ? (
        <section className="video-timeline-editor" aria-label="编辑时间轴事件">
          <div className="video-timeline-editor-heading">
            <div><strong>编辑事件</strong><span>{formatVideoTimelineRange(selectedEntry.start, selectedEntry.end)}</span></div>
            <div className="video-timeline-editor-actions"><button type="button" className="video-timeline-add" onClick={createEntry}><Plus size={15} /> 新增事件</button><button type="button" className="video-timeline-delete" onClick={removeEntry}><Trash2 size={15} /> 删除</button></div>
          </div>
          <div className="video-timeline-editor-grid">
            <div className="video-timeline-editor-half video-timeline-editor-left">
              <label className="video-timeline-color-field">颜色<span className="video-timeline-color-control"><input type="color" value={selectedEntry.color || typeById.get(selectedEntry.typeId)?.color || '#3976d5'} onChange={(event) => updateEntry(selectedEntry.id, { color: event.target.value })} aria-label="事件颜色" /></span></label>
              <label className="video-timeline-type-field">事件类型
                <select className="video-timeline-type-select" value={selectedEntry.typeId} onChange={(event) => { const nextType = typeById.get(event.target.value); updateEntry(selectedEntry.id, { typeId: event.target.value, color: nextType?.color || selectedEntry.color }); }}>
                  {Object.entries(typeGroups).map(([group, groupTypes]) => <optgroup label={group} key={group}>{groupTypes.map((type) => <option value={type.id} key={type.id}>{type.label}</option>)}</optgroup>)}
                </select>
              </label>
            </div>
            <div className="video-timeline-editor-half video-timeline-editor-right">
              <div className="video-timeline-shape-choice" role="group" aria-label="时间形态">
                <span>时间形态</span>
                <button
                  type="button"
                  className={`video-timeline-shape-switch${selectedEntry.end === null ? ' is-point' : ' is-range'}`}
                  role="switch"
                  aria-checked={selectedEntry.end !== null}
                  aria-label={`时间形态：${selectedEntry.end === null ? '时间点' : '时间段'}`}
                  onClick={() => updateEntry(selectedEntry.id, { end: selectedEntry.end === null ? Math.min(safeDuration, selectedEntry.start + VIDEO_TIMELINE_DRAG_STEP_SECONDS) : null })}
                >
                  <i aria-hidden="true" />
                  <b>时间点</b>
                  <b>时间段</b>
                </button>
              </div>
              <label className="video-timeline-timecode-field">开始时码<input key={`${selectedEntry.id}-${selectedEntry.start}`} defaultValue={formatVideoTimelineTime(selectedEntry.start)} onBlur={(event) => updateTimeFromInput(selectedEntry, 'start', event.currentTarget.value, event.currentTarget)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} inputMode="decimal" aria-label="自定义开始时码，格式为0:00或输入十进制分钟，如1.5表示1:30" /></label>
              {selectedEntry.end !== null && <label className="video-timeline-timecode-field is-end">结束时码<input key={`${selectedEntry.id}-${selectedEntry.end}`} defaultValue={formatVideoTimelineTime(selectedEntry.end)} onBlur={(event) => updateTimeFromInput(selectedEntry, 'end', event.currentTarget.value, event.currentTarget)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} inputMode="decimal" aria-label="自定义结束时码，格式为0:00或输入十进制分钟，如1.5表示1:30" /></label>}
            </div>
            <label className="video-timeline-title-field">标题<input value={selectedEntry.title} onChange={(event) => updateEntry(selectedEntry.id, { title: event.target.value })} placeholder="例如：主角身份暴露" maxLength="60" /></label>
          </div>
          <label className="video-timeline-editor-field">说明<textarea value={selectedEntry.description} onChange={(event) => updateEntry(selectedEntry.id, { description: event.target.value })} placeholder="这一段发生了什么？" rows={2} /></label>
          <div className="video-timeline-editor-grid secondary">
            <label>标签<input value={selectedEntry.tags} onChange={(event) => updateEntry(selectedEntry.id, { tags: event.target.value })} placeholder="多个标签用逗号分隔" /></label>
            <label>可借鉴做法<input value={selectedEntry.takeaway} onChange={(event) => updateEntry(selectedEntry.id, { takeaway: event.target.value })} placeholder="我能怎样借鉴？" /></label>
          </div>
          <button type="button" className="video-timeline-import" onClick={() => onImportToEmotionCurve(selectedEntry)}><Sparkles size={16} /> 导入情绪曲线</button>
          <small className="video-timeline-autosave">可输入 1.5 表示 1:30；输入后会自动保存到当前拆解草稿。</small>
        </section>
      ) : <div className="video-timeline-empty"><Clock3 size={20} /><span>还没有事件。新增一个时间点或时间段开始拆解。</span><button type="button" className="video-timeline-add" onClick={createEntry}><Plus size={16} /> 新增事件</button></div>}
      </div>
      <section className="video-timeline-custom-type" aria-label="新增自定义事件类型">
        <strong>自定义类型</strong><span>添加后可用于此条拆解时间轴。</span>
        <input value={customTypeName} onChange={(event) => setCustomTypeName(event.target.value)} placeholder="例如：表演细节" maxLength="20" />
        <input type="color" value={customTypeColor} onChange={(event) => setCustomTypeColor(event.target.value)} aria-label="自定义类型颜色" />
        <button type="button" onClick={addCustomType} disabled={!customTypeName.trim()}>添加类型</button>
      </section>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function TabButton({ icon: Icon, label, value, activeTab, onClick }) {
  return (
    <button className={activeTab === value ? 'tab-button active' : 'tab-button'} onClick={() => onClick(value)}>
      <Icon size={17} />
      {label}
    </button>
  );
}

function LegacyDashboard({ notes, tasks, onOpenTasks, onOpenSchedule, onOpenNotes, onOpenWebsites, onAddWebsite, onToggleScheduleTask }) {
  const today = getToday();
  const ordinaryTasks = tasks.filter((task) => !isLongTermTask(task));
  const longTermTasks = tasks.filter((task) => isLongTermTask(task));
  const todayTasks = ordinaryTasks.filter((task) => task.task_date === today).sort(sortTasks);
  const scheduleTasks = todayTasks.sort((first, second) => {
    const firstCompleted = first.status === 'completed';
    const secondCompleted = second.status === 'completed';
    if (firstCompleted !== secondCompleted) return firstCompleted ? 1 : -1;
    return (first.task_time || '99:99').localeCompare(second.task_time || '99:99');
  });
  const upcomingTasks = tasks
    .filter((task) => !isLongTermTask(task) && task.task_date > today && task.status !== 'completed')
    .sort(sortTasks)
    .slice(0, 3);
  const recentNotes = notes.slice(0, 3);
  const todayDate = new Date(`${today}T12:00:00`);
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return { label: ['一', '二', '三', '四', '五', '六', '日'][index], day: date.getDate(), isToday: date.getDate() === todayDate.getDate() && date.getMonth() === todayDate.getMonth() };
  });
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][todayDate.getDay()];

  return (
    <div className="dashboard-home">
      <div className="dashboard-top-grid">
        <section className="panel-card dashboard-schedule-card" aria-label="今日日程">
          <div className="dashboard-schedule-date" aria-label={`${todayDate.getMonth() + 1}月${todayDate.getDate()}日，${weekday}`}>
            <div className="dashboard-schedule-date-main">
              <div><span>{todayDate.getMonth() + 1}月</span><b>{weekday}</b></div>
              <strong>{todayDate.getDate()}</strong>
            </div>
            <div className="dashboard-schedule-week" aria-label="本周日期">
              {weekDays.map((day) => <span className={day.isToday ? 'today' : ''} key={day.label}><small>{day.label}</small><b>{day.day}</b></span>)}
            </div>
          </div>
          <div className="dashboard-schedule-content">
            <div className="dashboard-schedule-heading">
              <button className="dashboard-schedule-open-button" type="button" onClick={onOpenSchedule}>查看日历 <ArrowRight size={14} /></button>
            </div>
            {scheduleTasks.length ? (
              <div className="dashboard-schedule-list">
                {scheduleTasks.slice(0, 3).map((task) => (
                  <div className={`dashboard-schedule-item schedule-${task.matrix_category}${task.status === 'completed' ? ' completed' : ''}`} key={task.id}>
                    <button className="dashboard-schedule-complete" type="button" aria-label={task.status === 'completed' ? `恢复任务：${task.title}` : `完成任务：${task.title}`} title={task.status === 'completed' ? '恢复为进行中' : '标记已完成'} onClick={(event) => { event.stopPropagation(); onToggleScheduleTask(task); }}>
                      {task.status === 'completed' && <Check size={14} strokeWidth={3} />}
                    </button>
                    <div><strong>{task.title}</strong><small>{task.task_time ? formatTime(task.task_time) : '全天'}</small></div>
                  </div>
                ))}
                {scheduleTasks.length > 3 && <span className="dashboard-schedule-more">还有 {scheduleTasks.length - 3} 项日程 <ArrowRight size={14} /></span>}
              </div>
            ) : <p className="dashboard-schedule-empty">今天暂无日程，安排一件最重要的事吧。</p>}
          </div>
        </section>

        <div className="quick-entry-stack">
          <button className="quick-entry-card quick-task" onClick={onOpenTasks}>
            <span><Plus size={22} /></span>
            <strong>新建任务</strong>
          </button>
          <button className="quick-entry-card quick-note" onClick={onOpenNotes}>
            <span><NotebookPen size={21} /></span>
            <strong>写点东西</strong>
          </button>
        </div>
      </div>

      <WebsiteQuickLinks onOpenWebsites={onOpenWebsites} onAddWebsite={onAddWebsite} />

      <section className="dashboard-section">
        <div className="dashboard-section-heading outside-card">
          <div>
            <span className="section-icon section-icon-purple"><Sparkles size={18} /></span>
            <h2>长期任务</h2>
          </div>
          <button className="section-link" onClick={onOpenTasks}>管理任务 <ArrowRight size={15} /></button>
        </div>
        {upcomingTasks.length === 0 ? (
          <div className="panel-card dashboard-empty">暂时没有未来任务，可以在任务中心添加长期计划。</div>
        ) : (
          <div className="long-term-grid">
            {upcomingTasks.map((task, index) => (
              <article className={`long-term-card accent-${index + 1}`} key={task.id}>
                <div className="long-term-card-top">
                  <span className="long-term-icon"><Clock3 size={18} /></span>
                  <span className={`tag matrix-${task.matrix_category}`}>{getLabel(matrixOptions, task.matrix_category)}</span>
                </div>
                <h3>{task.title}</h3>
                <p>{task.description || '保持推进，一点点完成这个计划。'}</p>
                <div className="long-term-meta">
                  <strong>{getLabel(statusOptions, task.status)}</strong>
                  <span>{formatDate(task.task_date)}</span>
                </div>
                <div className="progress-track"><div style={{ width: task.status === 'in_progress' ? '60%' : task.status === 'stalled' ? '24%' : '12%' }} /></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading outside-card">
          <div>
            <span className="section-icon section-icon-blue"><Clock3 size={18} /></span>
            <h2>最近笔记</h2>
          </div>
          <button className="section-link" onClick={onOpenNotes}>全部笔记 <ArrowRight size={15} /></button>
        </div>
        {recentNotes.length === 0 ? (
          <div className="panel-card dashboard-empty">还没有笔记，点击“写点东西”记录第一条内容。</div>
        ) : (
          <div className="recent-notes-grid">
            {recentNotes.map((note, index) => (
              <button className={`recent-note-card note-color-${index + 1}`} key={note.id} onClick={onOpenNotes}>
                <span className="note-color-block">
                  <span className="note-cover-icon" aria-hidden="true">{['📝', '💡', '📚'][index % 3]}</span>
                  <span className={note.visibility === 'public' ? 'note-visibility-pill public' : 'note-visibility-pill'}>
                    {note.visibility === 'public' ? '公开' : '私密'}
                  </span>
                </span>
                <strong>{note.title}</strong>
                <small>{new Date(note.updated_at ?? note.created_at).toLocaleDateString('zh-CN')} · 最近编辑</small>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const DASHBOARD_LAYOUT_STORAGE_KEY = 'personal-workbench-dashboard-layout-v3';
const LEGACY_DASHBOARD_LAYOUT_STORAGE_KEY = 'personal-workbench-dashboard-layout-v2';
const dashboardSizeOptions = [
  { width: 2, height: 2, label: '2 × 2' },
  { width: 3, height: 2, label: '3 × 2' },
  { width: 4, height: 2, label: '4 × 2' },
  { width: 3, height: 3, label: '3 × 3' },
  { width: 6, height: 2, label: '6 × 2' },
  { width: 6, height: 3, label: '6 × 3' },
];

const defaultDashboardCards = [
  { id: 'schedule', label: '今日日程', width: 6, height: 3, x: 0, y: 0, visible: true },
  { id: 'quick-task', label: '新建任务', width: 1, height: 1, x: 0, y: 3, visible: true },
  { id: 'quick-note', label: '写点东西', width: 1, height: 1, x: 1, y: 3, visible: true },
  { id: 'websites', label: '常用网址', width: 6, height: 2, x: 0, y: 4, visible: true },
  { id: 'upcoming', label: '未来任务', width: 6, height: 3, x: 0, y: 6, visible: true },
  { id: 'notes', label: '最近笔记', width: 6, height: 3, x: 0, y: 9, visible: true, sizeMode: 'auto' },
  { id: 'focus', label: '专注计时', width: 6, height: 4, x: 0, y: 13, visible: true },
];

function getRecentNotesAutoHeight(notes) {
  if (notes.length === 0) return 2;
  if (notes.length <= 3) return 3;
  return notes.some((note) => note.card_cover_visible) ? 4 : 3;
}

function getNoteRecentTimestamp(note) {
  const timestamp = new Date(note.updated_at ?? note.created_at).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function loadDashboardCards() {
  try {
    const savedCards = JSON.parse(window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY) || window.localStorage.getItem(LEGACY_DASHBOARD_LAYOUT_STORAGE_KEY) || '[]');
    if (!Array.isArray(savedCards)) return defaultDashboardCards;
    const savedById = new Map(savedCards.map((card) => [card.id, card]));
    const savedOrder = savedCards.map((card) => card.id);
    const restoredCards = defaultDashboardCards.map((card) => {
      const savedCard = savedById.get(card.id);
      const restoredCard = { ...card, ...savedCard };
      if (card.id !== 'notes' || savedCard?.sizeMode) return restoredCard;
      return {
        ...restoredCard,
        sizeMode: savedCard && (savedCard.width !== card.width || savedCard.height !== card.height) ? 'custom' : 'auto',
      };
    }).sort((left, right) => (savedOrder.indexOf(left.id) === -1 ? 999 : savedOrder.indexOf(left.id)) - (savedOrder.indexOf(right.id) === -1 ? 999 : savedOrder.indexOf(right.id)));
    const cardsWithFocusPlaced = savedById.has('focus') ? restoredCards : restoredCards.map((card) => {
      if (card.id !== 'focus') return card;
      const lastOccupiedRow = Math.max(0, ...restoredCards.filter((item) => item.id !== 'focus' && item.visible).map((item) => item.y + item.height));
      return { ...card, y: lastOccupiedRow };
    });
    return assignDashboardPositions(cardsWithFocusPlaced);
  } catch {
    return defaultDashboardCards;
  }
}

function getDashboardSizeOptions(card) {
  return card.id === 'quick-task' || card.id === 'quick-note'
    ? [{ width: 1, height: 1, label: '1 × 1' }, ...dashboardSizeOptions]
    : dashboardSizeOptions;
}

function dashboardCardsOverlap(first, second) {
  return first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
}

function assignDashboardPositions(cards) {
  const positioned = [];
  return cards.map((card) => {
    const hasPosition = Number.isInteger(card.x) && Number.isInteger(card.y) && card.x >= 0 && card.y >= 0 && card.x + card.width <= 6;
    if (hasPosition) {
      positioned.push(card);
      return card;
    }
    let position = { x: 0, y: 0 };
    let found = false;
    for (let y = 0; y < 100 && !found; y += 1) {
      for (let x = 0; x <= 6 - card.width; x += 1) {
        const candidate = { ...card, x, y };
        if (!positioned.some((placed) => placed.visible && dashboardCardsOverlap(candidate, placed))) {
          position = { x, y };
          found = true;
          break;
        }
      }
    }
    const positionedCard = { ...card, ...position };
    positioned.push(positionedCard);
    return positionedCard;
  });
}

function pushDashboardCardCollisions(cards, primaryId) {
  const next = cards.map((card) => ({ ...card }));
  const pending = [primaryId];

  while (pending.length) {
    const sourceId = pending.shift();
    const source = next.find((card) => card.id === sourceId);
    if (!source) continue;
    const collisions = next.filter((card) => card.id !== source.id && card.visible && dashboardCardsOverlap(source, card)).sort((first, second) => first.y - second.y || first.x - second.x);

    collisions.forEach((collidingCard) => {
      let candidate = { ...collidingCard, y: Math.max(collidingCard.y, source.y + source.height) };
      while (next.some((card) => card.id !== candidate.id && card.visible && dashboardCardsOverlap(candidate, card))) {
        candidate = { ...candidate, y: candidate.y + 1 };
      }
      const index = next.findIndex((card) => card.id === candidate.id);
      next[index] = candidate;
      pending.push(candidate.id);
    });
  }

  return next;
}

function Dashboard({ notes, tasks, onOpenTasks, onOpenSchedule, onOpenNotes, onOpenWebsites, onAddWebsite, onToggleScheduleTask }) {
  const [dashboardCards, setDashboardCards] = React.useState(loadDashboardCards);
  const [isLayoutEditing, setIsLayoutEditing] = React.useState(false);
  const [draggedCardId, setDraggedCardId] = React.useState(null);
  const [dragTarget, setDragTarget] = React.useState(null);
  const [layoutNotice, setLayoutNotice] = React.useState('');
  const [dashboardGridMode, setDashboardGridMode] = React.useState(() => window.innerWidth <= 600 ? 'mobile' : window.innerWidth <= 900 ? 'compact' : 'desktop');
  const dashboardGridRef = React.useRef(null);
  const dragStateRef = React.useRef(null);
  const today = getToday();
  const ordinaryTasks = tasks.filter((task) => !isLongTermTask(task));
  const todayTasks = ordinaryTasks.filter((task) => task.task_date === today).sort(sortTasks);
  const scheduleTasks = todayTasks.sort((first, second) => {
    const firstCompleted = first.status === 'completed';
    const secondCompleted = second.status === 'completed';
    if (firstCompleted !== secondCompleted) return firstCompleted ? 1 : -1;
    return (first.task_time || '99:99').localeCompare(second.task_time || '99:99');
  });
  const upcomingTasks = tasks.filter((task) => !isLongTermTask(task) && task.task_date > today && task.status !== 'completed').sort(sortTasks).slice(0, 3);
  const recentNotes = [...notes].sort((first, second) => getNoteRecentTimestamp(second) - getNoteRecentTimestamp(first)).slice(0, 6);
  const recentNotesAutoHeight = getRecentNotesAutoHeight(recentNotes);
  const todayDate = new Date(`${today}T12:00:00`);
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return { label: ['一', '二', '三', '四', '五', '六', '日'][index], day: date.getDate(), isToday: date.getDate() === todayDate.getDate() && date.getMonth() === todayDate.getMonth() };
  });
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][todayDate.getDay()];

  React.useEffect(() => { window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(dashboardCards)); }, [dashboardCards]);
  React.useEffect(() => {
    const updateGridMode = () => setDashboardGridMode(window.innerWidth <= 600 ? 'mobile' : window.innerWidth <= 900 ? 'compact' : 'desktop');
    window.addEventListener('resize', updateGridMode);
    return () => window.removeEventListener('resize', updateGridMode);
  }, []);

  React.useEffect(() => {
    setDashboardCards((current) => {
      const notesCard = current.find((card) => card.id === 'notes');
      if (!notesCard || notesCard.sizeMode === 'custom' || notesCard.height === recentNotesAutoHeight) return current;
      const resized = current.map((card) => card.id === 'notes' ? { ...card, width: 6, height: recentNotesAutoHeight, x: 0, sizeMode: 'auto' } : card);
      return pushDashboardCardCollisions(resized, 'notes');
    });
  }, [recentNotesAutoHeight]);

  function updateDashboardCard(id, updates) {
    setDashboardCards((current) => current.map((card) => card.id === id ? { ...card, ...updates } : card));
  }

  function resizeDashboardCard(id, width, height) {
    setDashboardCards((current) => {
      const resized = current.map((card) => card.id === id ? { ...card, width, height, x: Math.min(card.x, 6 - width), ...(id === 'notes' ? { sizeMode: 'custom' } : {}) } : card);
      return pushDashboardCardCollisions(resized, id);
    });
    setLayoutNotice('尺寸已更新；相撞的卡片已自动向下移动。');
  }

  function restoreNotesAutoSize() {
    setDashboardCards((current) => {
      const resized = current.map((card) => card.id === 'notes' ? { ...card, width: 6, height: recentNotesAutoHeight, x: 0, sizeMode: 'auto' } : card);
      return pushDashboardCardCollisions(resized, 'notes');
    });
    setLayoutNotice('最近笔记已恢复自动高度。');
  }

  function isDashboardPositionAvailable(cardId, position) {
    const card = dashboardCards.find((item) => item.id === cardId);
    if (!card) return false;
    const candidate = { ...card, ...position };
    return !dashboardCards.some((item) => item.id !== cardId && item.visible && dashboardCardsOverlap(candidate, item));
  }

  function getDashboardDragPosition(event) {
    const grid = dashboardGridRef.current;
    const state = dragStateRef.current;
    const card = dashboardCards.find((item) => item.id === state?.cardId);
    if (!grid || !state || !card) return null;
    const rect = grid.getBoundingClientRect();
    const logicalCellWidth = rect.width / 6;
    const rowHeight = 124;
    const column = Math.floor((event.clientX - rect.left) / logicalCellWidth) - state.offsetX;
    const row = Math.floor((event.clientY - rect.top) / rowHeight) - state.offsetY;
    return { x: Math.max(0, Math.min(6 - card.width, column)), y: Math.max(0, row) };
  }

  function startDashboardDrag(event, card) {
    if (!isLayoutEditing || event.button !== 0) return;
    event.preventDefault();
    const grid = dashboardGridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    dragStateRef.current = {
      cardId: card.id,
      offsetX: Math.max(0, Math.min(card.width - 1, Math.floor((event.clientX - rect.left) / (rect.width / 6)) - card.x)),
      offsetY: Math.max(0, Math.floor((event.clientY - rect.top) / 124) - card.y),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setLayoutNotice('');
    setDraggedCardId(card.id);
    setDragTarget({ x: card.x, y: card.y });
  }

  function previewDashboardDrag(event) {
    if (!dragStateRef.current) return;
    const position = getDashboardDragPosition(event);
    if (position) setDragTarget(position);
  }

  function finishDashboardDrag(event) {
    const state = dragStateRef.current;
    const position = getDashboardDragPosition(event);
    if (state && position) {
      if (isDashboardPositionAvailable(state.cardId, position)) {
        updateDashboardCard(state.cardId, position);
      } else {
        setLayoutNotice('这里已经有其他卡片，请放到空白格子里。');
      }
    }
    dragStateRef.current = null;
    setDraggedCardId(null);
    setDragTarget(null);
  }

  function getDashboardCardStyle(card) {
    const size = { '--card-width': card.width, '--card-height': card.height };
    if (dashboardGridMode === 'mobile') return size;
    const position = draggedCardId === card.id && dragTarget ? dragTarget : card;
    const scale = dashboardGridMode === 'compact' ? 1 : 2;
    return {
      ...size,
      gridColumn: `${position.x * scale + 1} / span ${card.width * scale}`,
      gridRow: `${position.y + 1} / span ${card.height}`,
    };
  }

  const dashboardGridRows = Math.max(12, ...dashboardCards.filter((card) => card.visible).map((card) => card.y + card.height + 3));

  function getDashboardDotStyle(index) {
    const x = index % 6;
    const y = Math.floor(index / 6);
    const scale = dashboardGridMode === 'desktop' ? 2 : 1;
    return { gridColumn: `${x * scale + 1} / span ${scale}`, gridRow: y + 1 };
  }

  const cards = {
    schedule: <section className="dashboard-schedule-card" aria-label="今日日程"><div className="dashboard-schedule-date" aria-label={`${todayDate.getMonth() + 1}月${todayDate.getDate()}日，${weekday}`}><div className="dashboard-schedule-date-main"><div><span>{todayDate.getMonth() + 1}月</span><b>{weekday}</b></div><strong>{todayDate.getDate()}</strong></div><div className="dashboard-schedule-week" aria-label="本周日期">{weekDays.map((day) => <span className={day.isToday ? 'today' : ''} key={day.label}><small>{day.label}</small><b>{day.day}</b></span>)}</div></div><div className="dashboard-schedule-content"><div className="dashboard-schedule-heading"><button className="dashboard-schedule-open-button" type="button" onClick={onOpenSchedule}>查看日历 <ArrowRight size={14} /></button></div>{scheduleTasks.length ? <div className="dashboard-schedule-list">{scheduleTasks.slice(0, 3).map((task) => <div className={`dashboard-schedule-item schedule-${task.matrix_category}${task.status === 'completed' ? ' completed' : ''}`} key={task.id}><button className="dashboard-schedule-complete" type="button" aria-label={task.status === 'completed' ? `恢复任务：${task.title}` : `完成任务：${task.title}`} title={task.status === 'completed' ? '恢复为进行中' : '标记已完成'} onClick={(event) => { event.stopPropagation(); onToggleScheduleTask(task); }}>{task.status === 'completed' && <Check size={14} strokeWidth={3} />}</button><div><strong>{task.title}</strong><small>{task.task_time ? formatTime(task.task_time) : '全天'}</small></div></div>)}{scheduleTasks.length > 3 && <span className="dashboard-schedule-more">还有 {scheduleTasks.length - 3} 项日程 <ArrowRight size={14} /></span>}</div> : <p className="dashboard-schedule-empty">今天暂无日程，安排一件最重要的事吧。</p>}</div></section>,
    'quick-task': <button className="quick-entry-card quick-task" onClick={onOpenTasks}><span><Plus size={22} /></span><strong>新建任务</strong><small>安排今天或未来要做的事</small></button>,
    'quick-note': <button className="quick-entry-card quick-note" onClick={onOpenNotes}><span><NotebookPen size={21} /></span><strong>写点东西</strong><small>记录此刻的想法与灵感</small></button>,
    websites: <WebsiteQuickLinks onOpenWebsites={onOpenWebsites} onAddWebsite={onAddWebsite} />,
    upcoming: <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="section-icon section-icon-purple"><Sparkles size={18} /></span><h2>未来任务</h2></div><button className="section-link" onClick={onOpenTasks}>管理任务 <ArrowRight size={15} /></button></div>{upcomingTasks.length === 0 ? <div className="dashboard-empty">暂时没有未来任务，可以在任务中心添加长期计划。</div> : <div className="long-term-grid">{upcomingTasks.map((task, index) => <article className={`long-term-card accent-${index + 1}`} key={task.id}><div className="long-term-card-top"><span className="long-term-icon"><Clock3 size={18} /></span><span className={`tag matrix-${task.matrix_category}`}>{getLabel(matrixOptions, task.matrix_category)}</span></div><h3>{task.title}</h3><p>{task.description || '保持推进，一点点完成这个计划。'}</p><div className="long-term-meta"><strong>{getLabel(statusOptions, task.status)}</strong><span>{formatDate(task.task_date)}</span></div><div className="progress-track"><div style={{ width: task.status === 'in_progress' ? '60%' : task.status === 'stalled' ? '24%' : '12%' }} /></div></article>)}</div>}</section>,
    notes: <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="section-icon section-icon-blue"><Clock3 size={18} /></span><h2>最近笔记</h2></div><button className="section-link" onClick={onOpenNotes}>全部笔记 <ArrowRight size={15} /></button></div>{recentNotes.length === 0 ? <div className="dashboard-empty">还没有笔记，点击“写点东西”记录第一条内容。</div> : <div className="recent-notes-grid">{recentNotes.map((note, index) => <button className={`recent-note-card ${note.card_cover_visible ? 'has-note-cover' : 'without-note-cover'} note-color-${index + 1}`} key={note.id} onClick={onOpenNotes}>{note.card_cover_visible ? <span className="note-color-block"><span className="note-cover-icon" aria-hidden="true">{['📝', '💡', '📚'][index % 3]}</span><span className={note.visibility === 'public' ? 'note-visibility-pill public' : 'note-visibility-pill'}>{note.visibility === 'public' ? '公开' : '私密'}</span></span> : null}<strong>{note.title}</strong><small>{new Date(note.updated_at ?? note.created_at).toLocaleDateString('zh-CN')} · 最近编辑</small></button>)}</div>}</section>,
    focus: <FocusTimerCard tasks={todayTasks} onCompleteTask={onToggleScheduleTask} />,
  };

  return (
    <div className="dashboard-home dashboard-card-home">
      <header className="dashboard-layout-heading"><button className={isLayoutEditing ? 'dashboard-layout-button active' : 'dashboard-layout-button'} type="button" onClick={() => setIsLayoutEditing((editing) => !editing)}>{isLayoutEditing ? <><Check size={17} />完成编辑</> : <><SlidersHorizontal size={17} />编辑首页</>}</button></header>
      {isLayoutEditing && (
        <section className="dashboard-layout-editor" aria-label="首页卡片设置">
          <div><strong>按住卡片右上角的手柄，自由拖到任何空白格子</strong><span>卡片会固定在放下的位置，空位不会自动补齐；变大时会自动下推相撞卡片。</span></div>
          <button type="button" onClick={() => setDashboardCards(defaultDashboardCards)}>恢复默认布局</button>
          {layoutNotice && <p className="dashboard-layout-notice" role="status">{layoutNotice}</p>}
          <div className="dashboard-layout-editor-list">
            {dashboardCards.map((card) => {
              const usesAutoNoteSize = card.id === 'notes' && card.sizeMode !== 'custom';
              return (
                <label key={card.id}>
                  <span>{card.label}</span>
                  <select
                    value={usesAutoNoteSize ? 'auto' : `${card.width}x${card.height}`}
                    aria-label={`${card.label}的尺寸`}
                    title={`卡片尺寸：${card.width} 列 × ${card.height} 行`}
                    onChange={(event) => {
                      if (card.id === 'notes' && event.target.value === 'auto') {
                        restoreNotesAutoSize();
                        return;
                      }
                      const [width, height] = event.target.value.split('x').map(Number);
                      resizeDashboardCard(card.id, width, height);
                    }}
                  >
                    {card.id === 'notes' && <option value="auto">自动</option>}
                    {getDashboardSizeOptions(card).map((size) => <option value={`${size.width}x${size.height}`} key={size.label}>{size.label}</option>)}
                  </select>
                  <button className="dashboard-card-visibility-toggle" type="button" onClick={() => updateDashboardCard(card.id, { visible: !card.visible })} aria-label={card.visible ? `隐藏${card.label}` : `显示${card.label}`} title={card.visible ? '隐藏卡片' : '显示卡片'}>{card.visible ? <Eye size={17} /> : <EyeOff size={17} />}</button>
                </label>
              );
            })}
          </div>
        </section>
      )}
      <div className={isLayoutEditing ? 'dashboard-card-grid is-editing' : 'dashboard-card-grid'} ref={dashboardGridRef}>{isLayoutEditing && <div className="dashboard-grid-dots" aria-hidden="true">{Array.from({ length: dashboardGridRows * 6 }, (_, index) => <span className="dashboard-grid-dot" style={getDashboardDotStyle(index)} key={index} />)}</div>}{dashboardCards.filter((card) => card.visible).map((card) => <article className={`${draggedCardId === card.id ? 'dashboard-card is-dragging' : 'dashboard-card'} dashboard-card-${card.id}${card.id === 'notes' && card.sizeMode !== 'custom' ? ' dashboard-card-auto-size' : ''}${card.width === 1 && card.height === 1 ? ' dashboard-card-compact' : ''}`} key={card.id} style={getDashboardCardStyle(card)}>{isLayoutEditing && <button className="dashboard-card-drag-handle" type="button" aria-label={`拖动 ${card.label}`} title="按住并拖动卡片" onPointerDown={(event) => startDashboardDrag(event, card)} onPointerMove={previewDashboardDrag} onPointerUp={finishDashboardDrag} onPointerCancel={finishDashboardDrag}><GripVertical size={18} strokeWidth={2.5} aria-hidden="true" /></button>}{cards[card.id]}</article>)}</div>
    </div>
  );
}

function DashboardTaskList({ tasks, emptyText }) {
  if (tasks.length === 0) return <p className="dashboard-empty-copy">{emptyText}</p>;

  return (
    <div className="dashboard-task-list">
      {tasks.slice(0, 4).map((task) => (
        <div className={`dashboard-task-row matrix-row-${task.matrix_category}`} key={task.id}>
          <span className={task.status === 'completed' ? 'dashboard-check completed' : 'dashboard-check'}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{task.title}</strong>
            <span className={`tag matrix-${task.matrix_category}`}>{getLabel(matrixOptions, task.matrix_category)}</span>
          </div>
          <small>{formatTime(task.task_time) || getLabel(statusOptions, task.status)}</small>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ title, items, emptyText }) {
  return (
    <div className="panel-card">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted-text">{emptyText}</p>
      ) : (
        <div className="compact-list">
          {items.slice(0, 5).map((task) => (
            <span key={task.id}>
              {task.title}
              <small className={isTaskOverdue(task) ? 'text-overdue' : ''}>{getTaskTimingInfo(task).label}</small>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, value, total }) {
  return (
    <div className="progress-row">
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <div className="progress-track">
        <div style={{ width: `${Math.min(100, (value / total) * 100)}%` }} />
      </div>
    </div>
  );
}

const richNoteColorOptions = [
  { value: '#172033', label: '深色文字' },
  { value: '#3976D5', label: '信息蓝' },
  { value: '#7647C8', label: '创意紫' },
  { value: '#C97808', label: '提醒橙' },
  { value: '#D93655', label: '强调红' },
  { value: '#247B55', label: '成功绿' },
];

const richNoteEmojiOptions = ['💡', '📝', '✅', '📌', '⭐', '🧠', '🔥', '📚', '🎬', '✨', '🎯', '🔗'];

function escapeNoteHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isRichNoteHtml(value) {
  return /<(?:p|div|br|strong|b|em|i|ul|ol|li|span|font)\b/i.test(String(value ?? ''));
}

function sanitizeRichNoteHtml(value) {
  const rawValue = String(value ?? '');
  if (!rawValue) return '';

  if (!isRichNoteHtml(rawValue)) {
    return escapeNoteHtml(rawValue).replace(/\r?\n/g, '<br>');
  }

  const documentFragment = new DOMParser().parseFromString(rawValue, 'text/html');
  const container = document.createElement('div');
  const permittedTags = new Set(['P', 'DIV', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'SPAN', 'FONT']);
  const permittedColors = new Set(richNoteColorOptions.map((option) => option.value.toLowerCase()));

  function appendSafeNodes(source, target) {
    [...source.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        target.append(document.createTextNode(node.textContent ?? ''));
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tagName = node.tagName.toUpperCase();
      if (!permittedTags.has(tagName)) {
        appendSafeNodes(node, target);
        return;
      }

      const safeTagName = tagName === 'FONT' ? 'span' : tagName.toLowerCase();
      const safeElement = document.createElement(safeTagName);
      if (tagName === 'SPAN' || tagName === 'FONT') {
        const color = (node.getAttribute('color') || node.style.color || '').toLowerCase();
        if (permittedColors.has(color)) safeElement.style.color = color;
      }
      appendSafeNodes(node, safeElement);
      target.append(safeElement);
    });
  }

  appendSafeNodes(documentFragment.body, container);
  return container.innerHTML;
}

function getRichNotePlainText(value) {
  const rawValue = String(value ?? '');
  if (!isRichNoteHtml(rawValue)) return rawValue;
  return new DOMParser().parseFromString(sanitizeRichNoteHtml(rawValue), 'text/html').body.textContent ?? '';
}

function RichNotePreview({ className, content }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeRichNoteHtml(content) }} />;
}

function RichTextEditor({ id, value, onChange, onResize }) {
  const editorRef = React.useRef(null);
  const [openMenu, setOpenMenu] = React.useState(null);
  const initialContent = React.useMemo(() => sanitizeRichNoteHtml(value), [id]);

  React.useLayoutEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = initialContent;
    onResize(editorRef.current);
  }, [id, initialContent]);

  function syncContent() {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
    onResize(editorRef.current);
  }

  function runCommand(command, commandValue, shouldCloseMenu = true) {
    editorRef.current?.focus({ preventScroll: true });
    document.execCommand(command, false, commandValue);
    syncContent();
    if (shouldCloseMenu) setOpenMenu(null);
  }

  function insertEmoji(emoji) {
    runCommand('insertText', emoji);
  }

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar" role="toolbar" aria-label="正文快捷编辑">
        <button type="button" className="rich-text-tool" title="加粗" aria-label="加粗" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('bold')}>
          <Bold size={16} />
        </button>
        <button type="button" className="rich-text-tool" title="无序列表" aria-label="无序列表" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('insertUnorderedList')}>
          <List size={17} />
        </button>
        <button type="button" className="rich-text-tool" title="有序列表" aria-label="有序列表" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('insertOrderedList')}>
          <ListOrdered size={17} />
        </button>
        <div className="rich-text-menu-wrap">
          <button type="button" className="rich-text-tool" title="插入 Emoji" aria-label="插入 Emoji" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpenMenu((menu) => menu === 'emoji' ? null : 'emoji')}>
            <Smile size={16} />
          </button>
          {openMenu === 'emoji' && <div className="rich-text-menu rich-text-emoji-menu" role="menu" aria-label="选择 Emoji">
            {richNoteEmojiOptions.map((emoji) => <button key={emoji} type="button" className="rich-text-emoji-option" onMouseDown={(event) => event.preventDefault()} onClick={() => insertEmoji(emoji)}>{emoji}</button>)}
          </div>}
        </div>
        <div className="rich-text-menu-wrap">
          <button type="button" className="rich-text-tool" title="文字颜色" aria-label="文字颜色" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpenMenu((menu) => menu === 'color' ? null : 'color')}>
            <Palette size={16} />
          </button>
          {openMenu === 'color' && <div className="rich-text-menu rich-text-color-menu" role="menu" aria-label="选择文字颜色">
            {richNoteColorOptions.map((option) => <button key={option.value} type="button" className="rich-text-color-option" style={{ '--rich-text-color': option.value }} title={option.label} aria-label={option.label} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('foreColor', option.value, false)} />)}
          </div>}
        </div>
      </div>
      <div
        id={id}
        ref={editorRef}
        className="edit-note-content rich-text-editor-content"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="笔记内容"
        data-placeholder="写下这篇笔记的内容…"
        suppressContentEditableWarning
        onInput={syncContent}
      />
    </div>
  );
}

function NotesPanel({ session, notes, setNotes, setMessage }) {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [visibility, setVisibility] = React.useState('private');
  const [cardCoverVisible, setCardCoverVisible] = React.useState(false);
  const [editingNoteId, setEditingNoteId] = React.useState(null);
  const [confirmingDeleteNoteId, setConfirmingDeleteNoteId] = React.useState(null);
  const [editForm, setEditForm] = React.useState({ title: '', content: '', visibility: 'private', card_cover_visible: false });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isComposerOpen, setIsComposerOpen] = React.useState(false);
  const [isComposerVisibilityMenuOpen, setIsComposerVisibilityMenuOpen] = React.useState(false);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = React.useState(false);
  const composerVisibilityMenuRef = React.useRef(null);
  const visibilityMenuRef = React.useRef(null);

  function startEditNote(note) {
    setEditingNoteId(note.id);
    setIsVisibilityMenuOpen(false);
    setConfirmingDeleteNoteId(null);
    setEditForm({
      title: note.title,
      content: note.content ?? '',
      visibility: note.visibility,
      card_cover_visible: note.card_cover_visible === true,
    });
    setMessage('');
  }

  function cancelEditNote() {
    setEditingNoteId(null);
    setIsVisibilityMenuOpen(false);
    setEditForm({ title: '', content: '', visibility: 'private', card_cover_visible: false });
  }

  function updateEditForm(key, value) {
    setEditForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  React.useEffect(() => {
    if (!isVisibilityMenuOpen) return undefined;
    function closeVisibilityMenu(event) {
      if (!visibilityMenuRef.current?.contains(event.target)) setIsVisibilityMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeVisibilityMenu);
    return () => document.removeEventListener('pointerdown', closeVisibilityMenu);
  }, [isVisibilityMenuOpen]);

  React.useEffect(() => {
    if (!isComposerVisibilityMenuOpen) return undefined;
    function closeComposerVisibilityMenu(event) {
      if (!composerVisibilityMenuRef.current?.contains(event.target)) setIsComposerVisibilityMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeComposerVisibilityMenu);
    return () => document.removeEventListener('pointerdown', closeComposerVisibilityMenu);
  }, [isComposerVisibilityMenuOpen]);

  function cancelNoteComposer() {
    setTitle('');
    setContent('');
    setVisibility('private');
    setCardCoverVisible(false);
    setIsComposerVisibilityMenuOpen(false);
    setIsComposerOpen(false);
  }

  function resizeEditNoteContent(textarea) {
    const maxHeight = Math.min(480, window.innerHeight * 0.5);
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }

  async function handleCreateNote(event) {
    event.preventDefault();
    setMessage('');

    const safeContent = sanitizeRichNoteHtml(content);
    if (!title.trim() && !getRichNotePlainText(safeContent).trim()) {
      setMessage('标题和正文不能同时为空。');
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: session.user.id,
        title: title.trim() || '未命名笔记',
        content: safeContent,
        visibility,
        card_cover_visible: cardCoverVisible,
      })
      .select('id, user_id, title, content, visibility, card_cover_visible, created_at')
      .single();
    setIsSaving(false);

    if (error) {
      setMessage(`保存笔记失败：${error.message}`);
      return;
    }

    setNotes((currentNotes) => [data, ...currentNotes]);
    cancelNoteComposer();
    setMessage('笔记已保存。');
  }

  async function handleDeleteNote(note) {
    const { error } = await supabase.from('notes').delete().eq('id', note.id);
    if (error) {
      setMessage(`删除笔记失败：${error.message}`);
      return;
    }
    setNotes((currentNotes) => currentNotes.filter((item) => item.id !== note.id));
    setConfirmingDeleteNoteId(null);
    setMessage('笔记已删除。');
  }

  async function handleUpdateNote(event, note) {
    event.preventDefault();
    setMessage('');

    const safeContent = sanitizeRichNoteHtml(editForm.content);
    if (!editForm.title.trim() && !getRichNotePlainText(safeContent).trim()) {
      setMessage('标题和正文不能同时为空。');
      return;
    }

    setIsUpdating(true);
    const { data, error } = await supabase
      .from('notes')
      .update({
        title: editForm.title.trim() || '未命名笔记',
        content: safeContent,
        visibility: editForm.visibility,
        card_cover_visible: editForm.card_cover_visible,
      })
      .eq('id', note.id)
      .select('id, user_id, title, content, visibility, card_cover_visible, created_at')
      .single();
    setIsUpdating(false);

    if (error) {
      setMessage(`更新笔记失败：${error.message}`);
      return;
    }

    const updatedAt = new Date().toISOString();
    setNotes((currentNotes) => currentNotes.map((item) => (item.id === note.id ? { ...data, updated_at: updatedAt } : item)));
    cancelEditNote();
    setMessage('笔记已更新。');
  }

  return (
    <div className="notes-page-layout">
      <div className="page-action-row">
        <div className="note-filter-pills">
          <span className="active">全部笔记</span>
          <span>{notes.filter((note) => note.visibility === 'private').length} 篇私密</span>
          <span>{notes.filter((note) => note.visibility === 'public').length} 篇公开</span>
        </div>
        <button className="workspace-main-action" onClick={() => setIsComposerOpen((open) => !open)}>
          <Plus size={18} />
          {isComposerOpen ? '收起编辑器' : '写新笔记'}
        </button>
      </div>

      {isComposerOpen && <form className="panel-card form-stack note-composer edit-note-form" onSubmit={handleCreateNote}>
        <div className="form-card-heading">
          <span className="section-icon section-icon-blue"><NotebookPen size={18} /></span>
          <div><h2>写新笔记</h2></div>
        </div>
        <div className="edit-note-title-field">
          <input id="note-title" value={title} placeholder="标题" aria-label="标题" onChange={(event) => setTitle(event.target.value)} />
        </div>
        <RichTextEditor id="note-content" value={content} onChange={setContent} onResize={resizeEditNoteContent} />
        <div className="edit-note-meta-row">
          <span className="edit-note-meta-label">可见性</span>
          <div className="edit-note-visibility-menu" ref={composerVisibilityMenuRef}>
            <button id="note-visibility" type="button" className="edit-note-visibility-trigger" aria-haspopup="listbox" aria-expanded={isComposerVisibilityMenuOpen} onClick={() => setIsComposerVisibilityMenuOpen((open) => !open)}>
              {visibility === 'public' ? '公开' : '私密'}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {isComposerVisibilityMenuOpen && <div className="edit-note-visibility-options" role="listbox" aria-labelledby="note-visibility">
              {[['private', '私密'], ['public', '公开']].map(([value, label]) => <button key={value} type="button" role="option" aria-selected={visibility === value} onClick={() => { setVisibility(value); setIsComposerVisibilityMenuOpen(false); }}>{label}</button>)}
            </div>}
          </div>
          <label className="note-cover-toggle note-cover-toggle-inline" htmlFor="note-card-cover-visible">
            <input id="note-card-cover-visible" type="checkbox" checked={cardCoverVisible} onChange={(event) => setCardCoverVisible(event.target.checked)} />
            <span className="note-cover-toggle-indicator" aria-hidden="true"><Check size={13} /></span>
            <span>卡片显示封面</span>
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSaving}>
            <Plus size={16} />
            {isSaving ? '保存中...' : '保存笔记'}
          </button>
          <button className="text-button" type="button" onClick={cancelNoteComposer} disabled={isSaving}>取消</button>
        </div>
      </form>}

      <section className="notes-collection">
        {notes.length === 0 ? (
          <EmptyState text="还没有笔记，可以先写一个想法或记录。" />
        ) : (
          <div className="notes-card-grid">
            {notes.map((note, index) => (
              <article className={`item-card note-library-card ${editingNoteId === note.id ? 'is-editing' : ''} ${note.card_cover_visible ? 'has-card-cover' : 'without-card-cover'} note-accent-${(index % 4) + 1}`} key={note.id}>
                {editingNoteId === note.id ? (
                  <form className="form-stack edit-note-form" onSubmit={(event) => handleUpdateNote(event, note)}>
                    <div className="edit-note-title-field">
                      <input
                        id={`edit-note-title-${note.id}`}
                        value={editForm.title}
                        placeholder="标题"
                        aria-label="标题"
                        onChange={(event) => updateEditForm('title', event.target.value)}
                      />
                    </div>
                    <RichTextEditor
                      id={`edit-note-content-${note.id}`}
                      value={editForm.content}
                      onChange={(value) => updateEditForm('content', value)}
                      onResize={resizeEditNoteContent}
                    />
                    <div className="edit-note-meta-row">
                      <span className="edit-note-meta-label">可见性</span>
                      <div className="edit-note-visibility-menu" ref={visibilityMenuRef}>
                        <button
                          id={`edit-note-visibility-${note.id}`}
                          type="button"
                          className="edit-note-visibility-trigger"
                          aria-haspopup="listbox"
                          aria-expanded={isVisibilityMenuOpen}
                          onClick={() => setIsVisibilityMenuOpen((open) => !open)}
                        >
                          {editForm.visibility === 'public' ? '公开' : '私密'}
                          <ChevronDown size={16} aria-hidden="true" />
                        </button>
                        {isVisibilityMenuOpen && <div className="edit-note-visibility-options" role="listbox" aria-labelledby={`edit-note-visibility-${note.id}`}>
                          {[['private', '私密'], ['public', '公开']].map(([value, label]) => <button key={value} type="button" role="option" aria-selected={editForm.visibility === value} onClick={() => { updateEditForm('visibility', value); setIsVisibilityMenuOpen(false); }}>{label}</button>)}
                        </div>}
                      </div>
                      <label className="note-cover-toggle note-cover-toggle-inline" htmlFor={`edit-note-card-cover-visible-${note.id}`}>
                        <input
                          id={`edit-note-card-cover-visible-${note.id}`}
                          type="checkbox"
                          checked={editForm.card_cover_visible}
                          onChange={(event) => updateEditForm('card_cover_visible', event.target.checked)}
                        />
                        <span className="note-cover-toggle-indicator" aria-hidden="true"><Check size={13} /></span>
                        <span>卡片显示封面</span>
                      </label>
                    </div>
                    <div className="form-actions">
                      <button className="primary-button" type="submit" disabled={isUpdating}>
                        <Pencil size={16} />
                        {isUpdating ? '保存中...' : '保存修改'}
                      </button>
                      <button className="text-button" type="button" onClick={cancelEditNote} disabled={isUpdating}>
                        取消
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {note.card_cover_visible ? <span className="note-card-cover" /> : null}
                    <div className="item-top">
                      <h3>{note.title}</h3>
                      {confirmingDeleteNoteId === note.id ? (
                        <div className="confirm-delete">
                          <span>确认删除吗？</span>
                          <button className="danger-confirm-button" onClick={() => handleDeleteNote(note)}>
                            删除
                          </button>
                          <button className="cancel-confirm-button" onClick={() => setConfirmingDeleteNoteId(null)}>
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="item-actions">
                          <button className="small-action-button" onClick={() => startEditNote(note)} aria-label="编辑笔记" title="编辑笔记">
                            <Pencil size={15} />
                          </button>
                          <button className="delete-button" onClick={() => setConfirmingDeleteNoteId(note.id)} aria-label="删除笔记" title="删除笔记">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    {note.content && <p className="note-card-content">{getRichNotePlainText(note.content)}</p>}
                    <div className="tag-row">
                      <span className={note.visibility === 'public' ? 'tag public' : 'tag'}>{note.visibility === 'public' ? '公开' : '私密'}</span>
                      <span>{new Date(note.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TasksPanel({ initialTaskView = taskViews.list, session, tasks, setTasks, setMessage }) {
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    task_date: getToday(),
    end_date: '',
    task_time: '',
    category: '生活',
    matrix_category: 'important_not_urgent',
    status: 'not_started',
  });
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [matrixFilter, setMatrixFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [isTaskFilterOpen, setIsTaskFilterOpen] = React.useState(false);
  const [activeTaskView, setActiveTaskView] = React.useState(initialTaskView);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = React.useState(false);
  const [categoryDefinitions, setCategoryDefinitions] = React.useState(DEFAULT_TASK_CATEGORIES);
  const [isTaskCategoryManagerOpen, setIsTaskCategoryManagerOpen] = React.useState(false);
  const [newTaskCategoryName, setNewTaskCategoryName] = React.useState('');
  const [newTaskCategoryColor, setNewTaskCategoryColor] = React.useState('#c97808');

  React.useEffect(() => {
    let isCurrent = true;
    if (!supabase || session.user.id === 'preview-user') return undefined;
    supabase.from('task_categories').select('*').order('sort_order').then(({ data, error }) => {
      if (!isCurrent || error) return;
      if (data?.length) {
        setCategoryDefinitions(data);
        return;
      }
      supabase.from('task_categories').insert(DEFAULT_TASK_CATEGORIES.map(({ name, color, sort_order }) => ({ user_id: session.user.id, name, color, sort_order }))).select('*').then(({ data: created }) => {
        if (isCurrent && created?.length) setCategoryDefinitions(created);
      });
    });
    return () => { isCurrent = false; };
  }, [session.user.id]);

  function updateForm(key, value) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setMessage('');
    if (!form.category.trim()) {
      setMessage('请填写任务分类。');
      return;
    }
    if (form.end_date && form.end_date < form.task_date) {
      setMessage('结束日期不能早于开始日期。');
      return;
    }
    setIsSaving(true);
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...form,
        category: form.category.trim(),
        end_date: form.end_date || null,
        task_time: form.task_time || null,
        user_id: session.user.id,
      })
      .select('*')
      .single();
    setIsSaving(false);

    if (error) {
      setMessage(`保存任务失败：${error.message}`);
      return;
    }

    setTasks((currentTasks) => [...currentTasks, data].sort(sortTasks));
    setForm({
      title: '',
      description: '',
      task_date: getToday(),
      end_date: '',
      task_time: '',
      category: '生活',
      matrix_category: 'important_not_urgent',
      status: 'not_started',
    });
    setIsEndDateOpen(false);
    setIsCreateOpen(false);
    setMessage('任务已保存到列表。');
  }

  const ordinaryTasks = tasks.filter((task) => !isLongTermTask(task));
  const longTermTasks = tasks.filter((task) => isLongTermTask(task));
  const taskCategories = categoryDefinitions.map((category) => category.name);
  const visibleTasks = filterTasks(ordinaryTasks, statusFilter, matrixFilter, categoryFilter);
  const emptyText = getTaskListEmptyText(statusFilter, matrixFilter, categoryFilter);
  const taskStatusTabs = [
    { value: 'all', label: '全部', count: ordinaryTasks.length },
    { value: 'unfinished', label: '待办', count: ordinaryTasks.filter((task) => task.status !== 'completed').length },
    { value: 'in_progress', label: '进行中', count: ordinaryTasks.filter((task) => task.status === 'in_progress').length },
    { value: 'completed', label: '已完成', count: ordinaryTasks.filter((task) => task.status === 'completed').length },
  ];

  async function addTaskCategory(name, color) {
    const normalizedName = name.trim();
    if (!normalizedName) return setMessage('请填写分类名称。');
    if (categoryDefinitions.some((category) => category.name === normalizedName)) return setMessage('该分类已存在。');
    if (categoryDefinitions.length >= 4) return setMessage('分类最多只能保留 4 个。');

    const draft = { id: `local-${Date.now()}`, name: normalizedName, color, sort_order: categoryDefinitions.length };
    if (!supabase || session.user.id === 'preview-user') {
      setCategoryDefinitions((current) => [...current, draft]);
      return;
    }
    const { data, error } = await supabase.from('task_categories').insert({ user_id: session.user.id, name: normalizedName, color, sort_order: categoryDefinitions.length }).select('*').single();
    if (error) return setMessage(`新增分类失败：${error.message}`);
    setCategoryDefinitions((current) => [...current, data]);
  }

  async function updateTaskCategoryColor(category, color) {
    if (!supabase || session.user.id === 'preview-user') {
      setCategoryDefinitions((current) => current.map((item) => item.id === category.id ? { ...item, color } : item));
      return;
    }
    const { error } = await supabase.from('task_categories').update({ color }).eq('id', category.id);
    if (error) return setMessage(`更新分类颜色失败：${error.message}`);
    setCategoryDefinitions((current) => current.map((item) => item.id === category.id ? { ...item, color } : item));
  }

  async function renameTaskCategory(category, nextName) {
    const normalizedName = nextName.trim();
    if (!normalizedName) {
      setMessage('请填写分类名称。');
      return false;
    }
    if (normalizedName === category.name) return true;
    if (categoryDefinitions.some((item) => item.id !== category.id && item.name === normalizedName)) {
      setMessage('该分类已存在。');
      return false;
    }

    if (!supabase || session.user.id === 'preview-user') {
      setCategoryDefinitions((current) => current.map((item) => item.id === category.id ? { ...item, name: normalizedName } : item));
      setTasks((current) => current.map((task) => (task.category || '生活') === category.name ? { ...task, category: normalizedName } : task));
      return true;
    }

    const { error: tasksError } = await supabase.from('tasks').update({ category: normalizedName }).eq('user_id', session.user.id).eq('category', category.name);
    if (tasksError) {
      setMessage(`更新任务分类失败：${tasksError.message}`);
      return false;
    }
    const { error: categoryError } = await supabase.from('task_categories').update({ name: normalizedName }).eq('id', category.id);
    if (categoryError) {
      setMessage(`修改分类名称失败：${categoryError.message}`);
      return false;
    }
    setCategoryDefinitions((current) => current.map((item) => item.id === category.id ? { ...item, name: normalizedName } : item));
    setTasks((current) => current.map((task) => (task.category || '生活') === category.name ? { ...task, category: normalizedName } : task));
    return true;
  }

  async function removeTaskCategory(category) {
    const remainingCategories = categoryDefinitions.filter((item) => item.id !== category.id);
    if (remainingCategories.length === 0) {
      setMessage('至少保留一个分类。');
      return false;
    }
    const replacementCategory = remainingCategories[0];
    const affectedTaskCount = tasks.filter((task) => (task.category || '生活') === category.name).length;
    if (!supabase || session.user.id === 'preview-user') {
      setCategoryDefinitions((current) => current.filter((item) => item.id !== category.id));
      setTasks((current) => current.map((task) => (task.category || '生活') === category.name ? { ...task, category: replacementCategory.name } : task));
      if (affectedTaskCount) setMessage(`已删除“${category.name}”，${affectedTaskCount} 项任务已转入“${replacementCategory.name}”。`);
      return true;
    }
    const { error: tasksError } = await supabase.from('tasks').update({ category: replacementCategory.name }).eq('user_id', session.user.id).eq('category', category.name);
    if (tasksError) {
      setMessage(`迁移分类任务失败：${tasksError.message}`);
      return false;
    }
    const { error } = await supabase.from('task_categories').delete().eq('id', category.id);
    if (error) {
      setMessage(`删除分类失败：${error.message}`);
      return false;
    }
    setCategoryDefinitions((current) => current.filter((item) => item.id !== category.id));
    setTasks((current) => current.map((task) => (task.category || '生活') === category.name ? { ...task, category: replacementCategory.name } : task));
    if (affectedTaskCount) setMessage(`已删除“${category.name}”，${affectedTaskCount} 项任务已转入“${replacementCategory.name}”。`);
    return true;
  }

  async function handleAddTaskCategory(event) {
    event.preventDefault();
    const name = newTaskCategoryName.trim();
    if (!name || categoryDefinitions.some((category) => category.name === name) || categoryDefinitions.length >= 4) {
      await addTaskCategory(name, newTaskCategoryColor);
      return;
    }
    await addTaskCategory(name, newTaskCategoryColor);
    setNewTaskCategoryName('');
  }

  function updateCalendarTaskLocally(taskId, changes) {
    setTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? { ...task, ...changes } : task).sort(sortTasks));
  }

  async function persistCalendarTask(task) {
    if (!task) return;
    if (!supabase || session.user.id === 'preview-user') return;

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: task.title.trim(),
        description: task.description ?? '',
        task_date: task.task_date,
        end_date: task.end_date || null,
        task_time: task.task_time || null,
        end_time: task.end_time || null,
        category: task.category || '生活',
      })
      .eq('id', task.id)
      .select('*')
      .single();

    if (error) {
      setMessage(`更新日历任务失败：${error.message}`);
      return;
    }

    setTasks((currentTasks) => currentTasks.map((item) => item.id === task.id ? data : item).sort(sortTasks));
  }

  async function deleteCalendarTask(task) {
    if (!task) return;
    if (!supabase || session.user.id === 'preview-user') {
      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
      return;
    }
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      setMessage(`删除日历任务失败：${error.message}`);
      return;
    }
    setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
  }

  return (
    <div className="tasks-page-layout">
      <div className="task-toolbar">
        <div className="task-view-switcher">
          <TabButton icon={ListTodo} label="列表" value={taskViews.list} activeTab={activeTaskView} onClick={setActiveTaskView} />
          <TabButton icon={CalendarDays} label="日历" value={taskViews.calendar} activeTab={activeTaskView} onClick={setActiveTaskView} />
          <TabButton icon={Database} label="四象限" value={taskViews.matrix} activeTab={activeTaskView} onClick={setActiveTaskView} />
          <TabButton icon={Flame} label="长期追踪" value={taskViews.longTerm} activeTab={activeTaskView} onClick={(view) => { setActiveTaskView(view); setIsCreateOpen(false); }} />
        </div>
        <button className="workspace-main-action" onClick={() => setIsCreateOpen((open) => !open)}>
          <Plus size={18} />
          {isCreateOpen ? '收起表单' : '新建任务'}
        </button>
      </div>

      {isTaskCategoryManagerOpen && (
        <TaskCategoryManager
          categories={categoryDefinitions}
          newCategoryName={newTaskCategoryName}
          newCategoryColor={newTaskCategoryColor}
          onChangeName={setNewTaskCategoryName}
          onChangeColor={setNewTaskCategoryColor}
          onAdd={handleAddTaskCategory}
          onUpdateColor={updateTaskCategoryColor}
          onRemove={removeTaskCategory}
          onClose={() => setIsTaskCategoryManagerOpen(false)}
        />
      )}

      {isCreateOpen && activeTaskView !== taskViews.longTerm && (
        <form className="panel-card form-stack task-composer" onSubmit={handleCreateTask}>
          <div className="form-card-heading">
            <span className="section-icon section-icon-coral"><CheckCircle2 size={18} /></span>
            <div><h2>新建任务</h2><p>先写下要做的事，再补充时间和优先级。</p></div>
            <button className="task-composer-close" type="button" onClick={() => setIsCreateOpen(false)} aria-label="收起新建任务表单" title="收起"><X size={18} /></button>
          </div>

          <section className="task-composer-section" aria-label="任务内容">
            <label className="task-composer-title-field"><span>任务标题 <em aria-hidden="true">*</em></span><input id="task-title" value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="例如：整理 9 月视频选题" required /></label>
            <label className="task-composer-note-field"><span>备注（选填）</span><input id="task-description" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="补充背景、要求或链接…" /></label>
          </section>

          <section className="task-composer-section" aria-label="任务属性">
            <TaskCategoryPillPicker
              compactManage
              categories={categoryDefinitions}
              value={form.category}
              onChange={(category) => updateForm('category', category)}
              onOpenSettings={() => setIsTaskCategoryManagerOpen((open) => !open)}
            />

            <div className="task-property-grid">
              <label>优先级（四象限）<select id="task-matrix" value={form.matrix_category} onChange={(event) => updateForm('matrix_category', event.target.value)}>{matrixOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
              <label>进展<select id="task-status" value={form.status} onChange={(event) => updateForm('status', event.target.value)}>{statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            </div>
          </section>

          <section className="task-composer-section" aria-label="时间安排">
            <div className="task-schedule-grid">
              <div className="task-start-date-control">
                <label>开始日期<input type="date" value={form.task_date} onChange={(event) => updateForm('task_date', event.target.value)} required /></label>
                <div className="quick-date-row" aria-label="快捷日期">
                  {[0, 1, 2].map((offset) => {
                    const label = ['今天', '明天', '后天'][offset];
                    const date = getRelativeDate(offset);
                    return <button className={form.task_date === date ? 'selected' : undefined} type="button" aria-pressed={form.task_date === date} key={label} onClick={() => updateForm('task_date', date)}>{label}</button>;
                  })}
                </div>
              </div>
              <label>时间<input type="time" value={form.task_time} onChange={(event) => updateForm('task_time', event.target.value)} /></label>
            </div>
            {isEndDateOpen || form.end_date ? (
              <div className="task-end-date-row">
                <label>结束日期（可选）<input type="date" value={form.end_date} min={form.task_date} onChange={(event) => updateForm('end_date', event.target.value)} /></label>
                <button type="button" onClick={() => { updateForm('end_date', ''); setIsEndDateOpen(false); }}>移除结束日期</button>
              </div>
            ) : <button className="task-add-end-date" type="button" onClick={() => setIsEndDateOpen(true)}>＋ 添加结束日期</button>}
          </section>

          <div className="task-composer-actions">
            <button className="primary-button large" disabled={isSaving}><Plus size={18} />{isSaving ? '保存中...' : '保存任务'}</button>
          </div>
        </form>
      )}

      {activeTaskView === taskViews.list && (
        <div className="task-list-layout">
          <section className="panel-card task-list-panel">
            <div className="task-list-heading">
              <div>
                <h2>待办事件</h2>
              </div>
              <button
                className={isTaskFilterOpen ? 'task-filter-button active' : 'task-filter-button'}
                type="button"
                onClick={() => setIsTaskFilterOpen((open) => !open)}
                aria-expanded={isTaskFilterOpen}
                aria-controls="task-list-filters"
              >
                <SlidersHorizontal size={16} /> 筛选
              </button>
            </div>
            <div className="task-status-tabs" role="tablist" aria-label="任务状态">
              {taskStatusTabs.map((tab) => (
                <button
                  className={statusFilter === tab.value ? 'task-status-tab active' : 'task-status-tab'}
                  type="button"
                  key={tab.value}
                  role="tab"
                  aria-selected={statusFilter === tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                >
                  {tab.label}（{tab.count}）
                </button>
              ))}
            </div>
            {isTaskFilterOpen && (
              <div className="task-filter-popover" id="task-list-filters">
                <label>
                  <span>进展</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="筛选任务状态">
                    <option value="all">全部</option>
                    <option value="unfinished">未完成</option>
                    <option value="completed">已完成</option>
                    <option value="in_progress">进行中</option>
                    <option value="not_started">待开始</option>
                    <option value="stalled">已停滞</option>
                  </select>
                </label>
                <label>
                  <span>重要紧急程度</span>
                  <select value={matrixFilter} onChange={(event) => setMatrixFilter(event.target.value)} aria-label="筛选重要紧急程度">
                    <option value="all">全部</option>
                    {matrixOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>分类</span>
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="筛选任务分类">
                    <option value="all">全部</option>
                    {taskCategories.map((category) => <option value={category} key={category}>{category}</option>)}
                  </select>
                </label>
              </div>
            )}
            <TaskList tasks={visibleTasks} setTasks={setTasks} setMessage={setMessage} emptyText={emptyText} categoryOptions={taskCategories} categoryDefinitions={categoryDefinitions} onOpenCategorySettings={() => setIsTaskCategoryManagerOpen((open) => !open)} />
          </section>
        </div>
      )}

      {activeTaskView === taskViews.calendar && <CalendarPanel tasks={ordinaryTasks} longTermTasks={longTermTasks} categories={categoryDefinitions} onAddCategory={addTaskCategory} onUpdateCategoryColor={updateTaskCategoryColor} onRenameCategory={renameTaskCategory} onRemoveCategory={removeTaskCategory} onUpdateTask={updateCalendarTaskLocally} onPersistTask={persistCalendarTask} onDeleteTask={deleteCalendarTask} />}
      {activeTaskView === taskViews.matrix && <MatrixPanel tasks={ordinaryTasks} setTasks={setTasks} setMessage={setMessage} categoryOptions={taskCategories} categoryDefinitions={categoryDefinitions} onOpenCategorySettings={() => setIsTaskCategoryManagerOpen((open) => !open)} />}
      {activeTaskView === taskViews.longTerm && (
        <LongTermTasksPanel
          session={session}
          tasks={tasks}
          setTasks={setTasks}
          setMessage={setMessage}
          isCreateOpen={isCreateOpen}
          setIsCreateOpen={setIsCreateOpen}
          categoryOptions={taskCategories}
        />
      )}
    </div>
  );
}

function TaskCategoryPillPicker({ categories = DEFAULT_TASK_CATEGORIES, value, onChange, onOpenSettings, className = '', compactManage = false }) {
  const visibleCategories = categories.some((category) => category.name === value)
    ? categories
    : [...categories, { id: `legacy-${value}`, name: value, color: '#98a2b3' }];

  return (
    <div className={`task-category-picker${compactManage ? ' task-category-picker-inline' : ''} ${className}`.trim()}>
      <span className="task-category-picker-label">分类</span>
      <div className="task-category-pill-row" role="radiogroup" aria-label="任务分类">
        {visibleCategories.map((category) => <button className={value === category.name ? 'task-category-pill selected' : 'task-category-pill'} type="button" role="radio" aria-checked={value === category.name} key={category.id} style={{ '--task-category-color': category.color }} onClick={() => onChange?.(category.name)}>{category.name}</button>)}
        {!compactManage && <button className="task-category-settings-pill" type="button" onClick={onOpenSettings}><Settings2 size={15} /> 设置分类</button>}
      </div>
      {compactManage && <button className="task-category-manage-link" type="button" onClick={onOpenSettings}><Settings2 size={15} /> 管理分类</button>}
    </div>
  );
}

function CategoryColorPicker({ category, isOpen, onToggle, onChange }) {
  return (
    <div className="category-color-picker">
      <button className="category-color-swatch" type="button" style={{ '--category-color': category.color }} onClick={onToggle} aria-label={`设置${category.name}的颜色`} aria-expanded={isOpen}>
        <span aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="category-color-popover" role="dialog" aria-label={`${category.name}的颜色选项`}>
          <span>选择颜色</span>
          <div className="category-color-presets">
            {TASK_CATEGORY_COLOR_PRESETS.map((preset) => (
              <button
                className={category.color.toLowerCase() === preset.value ? 'selected' : ''}
                type="button"
                key={preset.value}
                title={preset.name}
                aria-label={`${preset.name} ${preset.value}`}
                style={{ '--preset-color': preset.value }}
                onClick={() => onChange?.(preset.value)}
              />
            ))}
          </div>
          <label className="category-color-custom">
            自定义
            <input type="color" value={category.color} onChange={(event) => onChange?.(event.target.value)} aria-label={`自定义${category.name}的颜色`} />
          </label>
        </div>
      )}
    </div>
  );
}

function TaskCategoryManager({ categories, newCategoryName, newCategoryColor, onChangeName, onChangeColor, onAdd, onUpdateColor, onRemove, onClose }) {
  const [colorPickerCategoryId, setColorPickerCategoryId] = React.useState(null);
  const [isNewCategoryColorPickerOpen, setIsNewCategoryColorPickerOpen] = React.useState(false);

  function updateCategoryColor(category, color) {
    onUpdateColor?.(category, color);
    setColorPickerCategoryId(null);
  }

  React.useEffect(() => {
    if (!colorPickerCategoryId && !isNewCategoryColorPickerOpen) return undefined;
    const closeColorPicker = (event) => {
      if (!event.target.closest('.category-color-picker')) {
        setColorPickerCategoryId(null);
        setIsNewCategoryColorPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeColorPicker);
    return () => document.removeEventListener('pointerdown', closeColorPicker);
  }, [colorPickerCategoryId, isNewCategoryColorPickerOpen]);

  return (
    <section className="task-category-manager" id="task-category-manager" aria-label="分类管理">
      <div className="task-category-manager-heading">
        <div><h2>分类设置</h2><p>最多 4 个分类。颜色会用于分类胶囊和日历任务。</p></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭分类设置"><X size={17} /></button>
      </div>
      <div className="task-category-manager-list">
        {categories.map((category) => (
          <div className="task-category-manager-row" key={category.id}>
            <CategoryColorPicker category={category} isOpen={colorPickerCategoryId === category.id} onToggle={() => setColorPickerCategoryId((current) => current === category.id ? null : category.id)} onChange={(color) => updateCategoryColor(category, color)} />
            <strong>{category.name}</strong>
            <button className="text-button" type="button" onClick={() => onRemove?.(category)}>删除</button>
          </div>
        ))}
      </div>
      {categories.length < 4 && (
        <form className="task-category-add" onSubmit={onAdd}>
          <input value={newCategoryName} onChange={(event) => onChangeName(event.target.value)} placeholder="新增分类名称" maxLength={16} aria-label="新增分类名称" />
          <CategoryColorPicker category={{ id: 'new-task-category', name: '新增分类', color: newCategoryColor }} isOpen={isNewCategoryColorPickerOpen} onToggle={() => setIsNewCategoryColorPickerOpen((open) => !open)} onChange={(color) => { onChangeColor(color); setIsNewCategoryColorPickerOpen(false); }} />
          <button className="secondary-action" type="submit">添加分类</button>
        </form>
      )}
    </section>
  );
}

function TaskList({ tasks, setTasks, setMessage, categoryOptions = ['生活', '工作'], categoryDefinitions = DEFAULT_TASK_CATEGORIES, onOpenCategorySettings, variant = 'default', emptyText = '这里暂时没有任务。' }) {
  if (tasks.length === 0) return <EmptyState text={emptyText} />;

  return (
    <div className="card-list">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} setTasks={setTasks} setMessage={setMessage} categoryOptions={categoryOptions} categoryDefinitions={categoryDefinitions} onOpenCategorySettings={onOpenCategorySettings} variant={variant} />
      ))}
    </div>
  );
}

function TaskCard({ task, setTasks, setMessage, categoryOptions = ['生活', '工作'], categoryDefinitions = DEFAULT_TASK_CATEGORIES, onOpenCategorySettings, compact = false, variant = 'default' }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    title: task.title,
    description: task.description ?? '',
    task_date: task.task_date,
    end_date: task.end_date ?? '',
    task_time: task.task_time ?? '',
    category: task.category || '生活',
    matrix_category: task.matrix_category,
    status: task.status,
  });
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setEditForm({
        title: task.title,
        description: task.description ?? '',
        task_date: task.task_date,
        end_date: task.end_date ?? '',
        task_time: task.task_time ?? '',
        category: task.category || '生活',
        matrix_category: task.matrix_category,
        status: task.status,
      });
    }
  }, [isEditing, task]);

  function updateEditForm(key, value) {
    setEditForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  function cancelEditTask() {
    setIsEditing(false);
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      task_date: task.task_date,
      end_date: task.end_date ?? '',
      task_time: task.task_time ?? '',
      category: task.category || '生活',
      matrix_category: task.matrix_category,
      status: task.status,
    });
  }

  async function handleStatusChange(status) {
    await updateTaskStatus(task, status, setTasks, setMessage);
  }

  async function handleToggleComplete() {
    if (task.status === 'completed') {
      await handleStatusChange('in_progress');
      return;
    }

    setIsCompleting(true);
    const [{ error }] = await Promise.all([
      supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id),
      new Promise((resolve) => window.setTimeout(resolve, 500)),
    ]);

    if (error) {
      setIsCompleting(false);
      setMessage?.(`更新任务失败：${error.message}`);
      return;
    }

    setTasks?.((currentTasks) =>
      currentTasks.map((item) => (item.id === task.id ? { ...item, status: 'completed' } : item)).sort(sortTasks),
    );
    setMessage?.('任务已完成。');
  }

  async function handleMatrixChange(matrixCategory) {
    const { error } = await supabase.from('tasks').update({ matrix_category: matrixCategory }).eq('id', task.id);
    if (error) {
      setMessage?.(`更新任务失败：${error.message}`);
      return;
    }
    setTasks?.((currentTasks) =>
      currentTasks.map((item) => (item.id === task.id ? { ...item, matrix_category: matrixCategory } : item)),
    );
    setMessage?.('任务重要紧急程度已更新。');
  }

  async function handleDeleteTask() {
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      setMessage?.(`删除任务失败：${error.message}`);
      return;
    }
    setTasks?.((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
    setMessage?.('任务已删除。');
  }

  async function handleUpdateTask(event) {
    event.preventDefault();
    setMessage?.('');

    if (!editForm.title.trim()) {
      setMessage?.('任务标题不能为空。');
      return;
    }
    if (!editForm.category.trim()) {
      setMessage?.('请填写任务分类。');
      return;
    }
    if (editForm.end_date && editForm.end_date < editForm.task_date) {
      setMessage?.('结束日期不能早于开始日期。');
      return;
    }

    setIsUpdating(true);
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...editForm,
        title: editForm.title.trim(),
        category: editForm.category.trim(),
        end_date: editForm.end_date || null,
        task_time: editForm.task_time || null,
      })
      .eq('id', task.id)
      .select('*')
      .single();
    setIsUpdating(false);

    if (error) {
      setMessage?.(`更新任务失败：${error.message}`);
      return;
    }

    setTasks?.((currentTasks) =>
      currentTasks.map((item) => (item.id === task.id ? data : item)).sort(sortTasks),
    );
    setIsEditing(false);
    setMessage?.('任务已更新。');
  }

  const timingInfo = getTaskTimingInfo(task);
  const isMatrixView = variant === 'matrix';
  const taskCategory = categoryDefinitions.find((category) => category.name === (task.category || '生活'));
  const taskMeta = (
    <>
      <span className="tag task-category-tag" style={{ '--task-category-color': taskCategory?.color ?? '#98a2b3' }}>{task.category || '生活'}</span>
      <span className={`tag matrix-${task.matrix_category}`}>{getLabel(matrixOptions, task.matrix_category)}</span>
      <span className={`tag task-status-tag status-${task.status}`}>{getLabel(statusOptions, task.status)}</span>
      <span className={timingInfo.className}>{timingInfo.label}</span>
    </>
  );

  return (
    <article className={[task.status === 'completed' ? 'item-card completed' : 'item-card', isTaskOverdue(task) ? 'task-overdue' : '', `task-accent-${task.matrix_category}`, isMatrixView ? 'matrix-task-card' : '', isEditing ? 'task-editing' : '', isCompleting ? 'task-completing' : ''].filter(Boolean).join(' ')}>
      {isEditing ? (
        <form className="form-stack edit-task-form" onSubmit={handleUpdateTask}>
          <div className="edit-task-input-row">
            <label className="edit-task-title-field" htmlFor={`edit-task-title-${task.id}`}>
              <input
                id={`edit-task-title-${task.id}`}
                value={editForm.title}
                onChange={(event) => updateEditForm('title', event.target.value)}
                placeholder="（必填）事件"
                aria-label="任务标题"
                required
              />
            </label>
            <label className="edit-task-description-field" htmlFor={`edit-task-description-${task.id}`}>
              <input
                id={`edit-task-description-${task.id}`}
                value={editForm.description}
                onChange={(event) => updateEditForm('description', event.target.value)}
                placeholder="备注"
                aria-label="备注"
              />
            </label>
          </div>
          <TaskCategoryPillPicker
            categories={categoryDefinitions}
            value={editForm.category}
            onChange={(category) => updateEditForm('category', category)}
            onOpenSettings={onOpenCategorySettings}
          />
          <section className="edit-task-section" aria-label="任务属性">
            <p className="edit-task-section-title">任务属性</p>
            <div className="edit-task-grid edit-task-meta-grid">
              <label>
                重要紧急程度
                <select
                  id={`edit-task-matrix-${task.id}`}
                  value={editForm.matrix_category}
                  onChange={(event) => updateEditForm('matrix_category', event.target.value)}
                >
                  {matrixOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                进展状态
                <select
                  id={`edit-task-status-${task.id}`}
                  value={editForm.status}
                  onChange={(event) => updateEditForm('status', event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="edit-task-section" aria-label="时间安排">
            <p className="edit-task-section-title">时间安排</p>
            <div className="edit-task-grid">
              <label>
                开始日期
                <input
                  type="date"
                  value={editForm.task_date}
                  onChange={(event) => updateEditForm('task_date', event.target.value)}
                  required
                />
              </label>
              <label>
                结束日期（可选）
                <input
                  type="date"
                  value={editForm.end_date}
                  min={editForm.task_date}
                  onChange={(event) => updateEditForm('end_date', event.target.value)}
                />
              </label>
              <label>
                时间
                <input type="time" value={editForm.task_time} onChange={(event) => updateEditForm('task_time', event.target.value)} />
              </label>
            </div>
          </section>
          <div className="form-actions edit-task-actions">
            <div className="edit-task-primary-actions">
              <button className="primary-button" type="submit" disabled={isUpdating}>
                <Pencil size={16} />
                {isUpdating ? '保存中...' : '保存修改'}
              </button>
              <button className="text-button" type="button" onClick={cancelEditTask} disabled={isUpdating}>
                取消
              </button>
            </div>
            <details className="edit-task-danger">
              <summary><MoreHorizontal size={17} /> 更多操作</summary>
              <div className="edit-task-danger-actions">
                {isConfirmingDelete ? (
                  <>
                    <button className="danger-confirm-button" type="button" onClick={handleDeleteTask}>确认删除</button>
                    <button className="cancel-confirm-button" type="button" onClick={() => setIsConfirmingDelete(false)}>保留任务</button>
                  </>
                ) : (
                  <button className="edit-form-delete" type="button" onClick={() => setIsConfirmingDelete(true)}>
                    <Trash2 size={15} /> 删除任务
                  </button>
                )}
              </div>
            </details>
          </div>
        </form>
      ) : (
        <>
          <div className="item-top">
            {!compact && !isMatrixView && (
              <button
                className={task.status === 'completed' || isCompleting ? 'task-complete-checkbox checked' : 'task-complete-checkbox'}
                onClick={handleToggleComplete}
                disabled={isCompleting}
                aria-label={task.status === 'completed' ? '恢复为进行中' : '标记已完成'}
                title={task.status === 'completed' ? '恢复为进行中' : '完成任务'}
              >
                {(task.status === 'completed' || isCompleting) && <CheckCircle2 size={18} />}
              </button>
            )}
            <div className="task-title-row">
              <span className="task-card-symbol"><Target size={17} /></span>
              <h3>{task.title}</h3>
            </div>
            {!isMatrixView && <div className="tag-row task-list-inline-meta">{taskMeta}</div>}
            {!compact && <div className="item-actions task-card-actions">
              <button
                className="task-edit-button"
                onClick={() => {
                  setIsEditing(true);
                  setIsConfirmingDelete(false);
                }}
                disabled={isCompleting}
                aria-label="编辑任务"
                title="编辑任务"
              >
                <Pencil size={17} />
              </button>
              {isMatrixView && <button
                className={task.status === 'completed' || isCompleting ? 'task-complete-checkbox checked' : 'task-complete-checkbox'}
                onClick={handleToggleComplete}
                disabled={isCompleting}
                aria-label={task.status === 'completed' ? '恢复为进行中' : '标记已完成'}
                title={task.status === 'completed' ? '恢复为进行中' : '完成任务'}
              >
                {(task.status === 'completed' || isCompleting) && <CheckCircle2 size={18} />}
              </button>}
            </div>}
          </div>
          {task.description && <p>{task.description}</p>}
          {isMatrixView && <div className="tag-row">{taskMeta}</div>}
        </>
      )}
    </article>
  );
}

async function updateTaskStatus(task, status, setTasks, setMessage) {
  if (task.user_id === 'preview-user') {
    setTasks?.((currentTasks) => currentTasks.map((item) => (item.id === task.id ? { ...item, status } : item)).sort(sortTasks));
    setMessage?.('任务状态已更新。');
    return;
  }

  if (!supabase) {
    setMessage?.('任务服务尚未配置，暂时无法更新状态。');
    return;
  }

  const { error } = await supabase.from('tasks').update({ status }).eq('id', task.id);
  if (error) {
    setMessage?.(`更新任务失败：${error.message}`);
    return;
  }
  setTasks?.((currentTasks) => currentTasks.map((item) => (item.id === task.id ? { ...item, status } : item)).sort(sortTasks));
  setMessage?.('任务状态已更新。');
}

function getCalendarLongTermRanges(tasks, monthDays) {
  const visibleStart = monthDays[0]?.date;
  const visibleEnd = monthDays[monthDays.length - 1]?.date;
  if (!visibleStart || !visibleEnd) return [];

  return tasks
    .map((task, index) => {
      const metadata = parseLongTermTask(task);
      const startDate = metadata?.startDate || task.task_date;
      const endDate = metadata?.endDate || visibleEnd;
      if (!metadata || metadata.lifecycle === 'archived' || !startDate || startDate > visibleEnd || endDate < visibleStart) return null;
      return {
        ...task,
        endDate: endDate > visibleEnd ? visibleEnd : endDate,
        lane: index,
        startDate: startDate < visibleStart ? visibleStart : startDate,
      };
    })
    .filter(Boolean);
}

function getCalendarCrossDayTaskRanges(tasks, monthDays) {
  const visibleStart = monthDays[0]?.date;
  const visibleEnd = monthDays[monthDays.length - 1]?.date;
  if (!visibleStart || !visibleEnd) return [];

  return tasks
    .map((task) => {
      const startDate = task.task_date;
      const endDate = task.end_date;
      if (!startDate || !endDate || endDate <= startDate || startDate > visibleEnd || endDate < visibleStart) return null;
      return {
        ...task,
        kind: 'cross-day-task',
        startDate: startDate < visibleStart ? visibleStart : startDate,
        endDate: endDate > visibleEnd ? visibleEnd : endDate,
      };
    })
    .filter(Boolean);
}

function getCalendarRangeSegments(ranges, weekDays) {
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[weekDays.length - 1].date;
  return ranges.reduce((segments, range) => {
    if (range.startDate > weekEnd || range.endDate < weekStart) return segments;
    const startDate = range.startDate > weekStart ? range.startDate : weekStart;
    const endDate = range.endDate < weekEnd ? range.endDate : weekEnd;
    const startIndex = weekDays.findIndex((day) => day.date === startDate);
    const endIndex = weekDays.findIndex((day) => day.date === endDate);
    if (startIndex >= 0 && endIndex >= startIndex) {
      segments.push({ ...range, startIndex, span: endIndex - startIndex + 1 });
    }
    return segments;
  }, []);
}

function CalendarPanel({ tasks, longTermTasks = [], categories = DEFAULT_TASK_CATEGORIES, onAddCategory, onUpdateCategoryColor, onRenameCategory, onRemoveCategory, onUpdateTask, onPersistTask, onDeleteTask }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedCategories, setSelectedCategories] = React.useState(() => categories.map((category) => category.name));
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = React.useState(false);
  const [colorPickerCategoryId, setColorPickerCategoryId] = React.useState(null);
  const [isNewCategoryColorPickerOpen, setIsNewCategoryColorPickerOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newCategoryColor, setNewCategoryColor] = React.useState('#c97808');
  const [newCategoryError, setNewCategoryError] = React.useState('');
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [editingCategoryId, setEditingCategoryId] = React.useState(null);
  const [editingCategoryName, setEditingCategoryName] = React.useState('');
  const categoryManagerAnchorRef = React.useRef(null);
  const newCategoryNameInputRef = React.useRef(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState(null);
  const [editorPosition, setEditorPosition] = React.useState({ top: 16, left: 16 });
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const normalizedCategories = categories.map((category, index) => ({
    ...category,
    name: category.name?.trim() || DEFAULT_TASK_CATEGORIES[index]?.name || '',
  }));
  const monthDays = getMonthDays(currentDate, { fixedWeeks: false });
  const monthWeeks = Array.from({ length: Math.ceil(monthDays.length / 7) }, (_, index) => monthDays.slice(index * 7, index * 7 + 7));
  const matchesSelectedCategories = (task) => selectedCategories.includes(task.category || '生活');
  const visibleTasks = tasks.filter(matchesSelectedCategories);
  const visibleLongTermTasks = longTermTasks.filter(matchesSelectedCategories);
  const longTermRanges = getCalendarLongTermRanges(visibleLongTermTasks, monthDays);
  const crossDayTaskRanges = getCalendarCrossDayTaskRanges(visibleTasks, monthDays);
  const calendarRanges = [...longTermRanges, ...crossDayTaskRanges].map((range, lane) => ({ ...range, lane }));
  const rangeCount = calendarRanges.length;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  function shiftMonth(delta) {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  }

  function toggleCategory(category) {
    setSelectedCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  async function handleAddCategory(event) {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      setNewCategoryError('请先填写分类名称。');
      newCategoryNameInputRef.current?.focus();
      return;
    }
    if (categories.some((category) => category.name === name)) {
      setNewCategoryError('该分类已存在。');
      newCategoryNameInputRef.current?.focus();
      return;
    }
    await onAddCategory?.(newCategoryName, newCategoryColor);
    setNewCategoryName('');
    setNewCategoryError('');
    setIsNewCategoryColorPickerOpen(false);
    setIsAddingCategory(false);
  }

  function beginAddCategory() {
    setIsAddingCategory(true);
    setNewCategoryError('');
    window.setTimeout(() => newCategoryNameInputRef.current?.focus(), 0);
  }

  function beginEditCategory(category) {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  }

  async function saveCategoryName(category) {
    const name = editingCategoryName.trim();
    if (!name) return;
    const isSaved = await onRenameCategory?.(category, name);
    if (isSaved) {
      setSelectedCategories((current) => current.map((item) => item === category.name ? name : item));
      setEditingCategoryId(null);
      setEditingCategoryName('');
    }
  }

  async function removeCategory(category) {
    const isRemoved = await onRemoveCategory?.(category);
    if (isRemoved) {
      setSelectedCategories((current) => current.filter((item) => item !== category.name));
      if (editingCategoryId === category.id) {
        setEditingCategoryId(null);
        setEditingCategoryName('');
      }
    }
  }

  function updateCategoryColor(category, color) {
    onUpdateCategoryColor?.(category, color);
    setColorPickerCategoryId(null);
  }

  React.useEffect(() => {
    if (!colorPickerCategoryId && !isNewCategoryColorPickerOpen) return undefined;
    const closeColorPicker = (event) => {
      if (!event.target.closest('.category-color-picker')) {
        setColorPickerCategoryId(null);
        setIsNewCategoryColorPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeColorPicker);
    return () => document.removeEventListener('pointerdown', closeColorPicker);
  }, [colorPickerCategoryId, isNewCategoryColorPickerOpen]);

  React.useEffect(() => {
    if (!isCategoryManagerOpen) return undefined;
    const closeCategoryManager = (event) => {
      if (!categoryManagerAnchorRef.current?.contains(event.target)) {
        setIsCategoryManagerOpen(false);
        setColorPickerCategoryId(null);
        setIsNewCategoryColorPickerOpen(false);
        setIsAddingCategory(false);
        setEditingCategoryId(null);
      }
    };
    document.addEventListener('pointerdown', closeCategoryManager);
    return () => document.removeEventListener('pointerdown', closeCategoryManager);
  }, [isCategoryManagerOpen]);

  function openTaskEditor(task, event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const editorWidth = Math.min(302, window.innerWidth - 32);
    setEditorPosition({
      top: Math.max(16, Math.min(rect.bottom + 10, window.innerHeight - 540)),
      left: Math.max(16, Math.min(rect.left, window.innerWidth - editorWidth - 16)),
    });
    setSelectedTaskId(task.id);
    setIsConfirmingDelete(false);
  }

  function closeTaskEditor() {
    setSelectedTaskId(null);
    setIsConfirmingDelete(false);
  }

  function updateSelectedTask(changes, shouldPersist = true) {
    if (!selectedTask) return;
    const nextTask = { ...selectedTask, ...changes };
    onUpdateTask?.(selectedTask.id, changes);
    if (shouldPersist) onPersistTask?.(nextTask);
  }

  function persistSelectedTask() {
    if (selectedTask) onPersistTask?.(selectedTask);
  }

  async function handleDeleteSelectedTask() {
    if (!selectedTask) return;
    await onDeleteTask?.(selectedTask);
    closeTaskEditor();
  }

  return (
    <div className="calendar-layout">
      <section className="panel-card">
        <div className="calendar-toolbar">
          <div className="calendar-title-group">
            <h2>{currentDate.getMonth() + 1}月 <span>{currentDate.getFullYear()}</span></h2>
            <button className="calendar-arrow" onClick={() => shiftMonth(-1)} aria-label="上个月">‹</button>
            <button className="calendar-arrow" onClick={() => shiftMonth(1)} aria-label="下个月">›</button>
          </div>
          <button className="text-button" onClick={() => setCurrentDate(new Date())}>回到今天</button>
        </div>
        <div className="calendar-category-filter" role="group" aria-label="按任务分类筛选日历">
          <div className="calendar-category-heading">
            <span>分类</span>
            <div className="calendar-category-manager-anchor" ref={categoryManagerAnchorRef}>
              <button
                className={isCategoryManagerOpen ? 'calendar-category-settings is-open' : 'calendar-category-settings'}
                type="button"
                onClick={() => setIsCategoryManagerOpen((open) => !open)}
                aria-label={isCategoryManagerOpen ? '关闭分类管理' : '管理分类'}
                aria-expanded={isCategoryManagerOpen}
                aria-controls="calendar-category-manager"
              >
                <Settings2 size={15} aria-hidden="true" />
              </button>
              {isCategoryManagerOpen && <section id="calendar-category-manager" className="calendar-category-manager" aria-label="分类管理">
                <h3>分类设置</h3>
                <p>最多 4 个分类。颜色会用于日历中的任务圆点和跨天任务条。</p>
                {normalizedCategories.map((category) => <div className="calendar-category-manager-row" key={category.id}>
                  <CategoryColorPicker category={category} isOpen={colorPickerCategoryId === category.id} onToggle={() => setColorPickerCategoryId((current) => current === category.id ? null : category.id)} onChange={(color) => updateCategoryColor(category, color)} />
                  <div className="calendar-category-name-field">
                    <input className="calendar-category-name-input" value={editingCategoryId === category.id ? editingCategoryName : category.name} onChange={(event) => setEditingCategoryName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveCategoryName(category); } if (event.key === 'Escape') setEditingCategoryId(null); }} maxLength={16} aria-label={`修改${category.name}分类名称`} readOnly={editingCategoryId !== category.id} autoFocus={editingCategoryId === category.id} />
                    <button type="button" className="calendar-category-edit-button" onClick={() => editingCategoryId === category.id ? saveCategoryName(category) : beginEditCategory(category)} aria-label={editingCategoryId === category.id ? `保存${category.name}分类名称` : `编辑${category.name}分类名称`}>{editingCategoryId === category.id ? '保存' : <Pencil size={15} aria-hidden="true" />}</button>
                  </div>
                  <button type="button" className="text-button" onClick={() => removeCategory(category)}>删除</button>
                </div>)}
                {normalizedCategories.length < 4 && <form onSubmit={handleAddCategory} className="calendar-category-add"><CategoryColorPicker category={{ id: 'new-category', name: '新增分类', color: newCategoryColor }} isOpen={isNewCategoryColorPickerOpen} onToggle={() => setIsNewCategoryColorPickerOpen((open) => !open)} onChange={(color) => { setNewCategoryColor(color); setIsNewCategoryColorPickerOpen(false); }} /><div className="calendar-category-name-field"><input ref={newCategoryNameInputRef} className="calendar-category-name-input" value={newCategoryName} onChange={(event) => { setNewCategoryName(event.target.value); setNewCategoryError(''); }} placeholder="添加新分类" maxLength={16} aria-label="新增分类名称" readOnly={!isAddingCategory} /><button className="calendar-category-edit-button" type={isAddingCategory ? 'submit' : 'button'} onClick={isAddingCategory ? undefined : beginAddCategory} aria-label={isAddingCategory ? '保存新增分类' : '编辑新增分类'}>{isAddingCategory ? '保存' : <Pencil size={15} aria-hidden="true" />}</button></div>{newCategoryError && <span className="calendar-category-add-error" role="alert">{newCategoryError}</span>}</form>}
              </section>}
            </div>
          </div>
          {normalizedCategories.map((category) => (
            <label key={category.id} style={{ '--category-color': category.color }}>
              <input type="checkbox" checked={selectedCategories.includes(category.name)} onChange={() => toggleCategory(category.name)} />
              <span className="calendar-category-checkbox" aria-hidden="true" />
              {category.name}
            </label>
          ))}
          {selectedCategories.length < normalizedCategories.length && <button className="text-button" type="button" onClick={() => setSelectedCategories(normalizedCategories.map((category) => category.name))}>全选分类</button>}
        </div>
        <div className="calendar-grid" style={{ '--calendar-range-space': `${rangeCount * 26}px` }}>
          <div className="calendar-weekdays">
            {['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].map((day) => (
              <span className="calendar-head" key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-month-grid">
            {monthWeeks.map((weekDays) => {
              const rangeSegments = getCalendarRangeSegments(calendarRanges, weekDays);
              return (
                <div className="calendar-week" key={weekDays[0].date}>
                  <div className="calendar-week-cells">
                    {weekDays.map((day) => {
                      const dayTasks = visibleTasks.filter((task) => task.task_date === day.date && !(task.end_date && task.end_date > task.task_date));
                      const isToday = day.date === getToday();
                      const isPast = day.isCurrentMonth && day.date < getToday();
                      return (
                        <div
                          className={[
                            'calendar-cell',
                            day.isCurrentMonth ? '' : 'muted',
                            isToday ? 'today' : '',
                            isPast ? 'past' : '',
                          ].join(' ')}
                          key={day.date}
                        >
                          <strong>{day.dayNumber}</strong>
                          <div className="calendar-day-events">
                            {dayTasks.slice(0, 3).map((task) => (
                              <button type="button" className={`calendar-event event-${task.matrix_category}`} key={task.id} style={{ color: categories.find((category) => category.name === (task.category || '生活'))?.color }} onClick={(event) => openTaskEditor(task, event)}>
                                <i aria-hidden="true" />
                                <b>{task.title}</b>
                              </button>
                            ))}
                            {dayTasks.length > 3 && <small>+{dayTasks.length - 3}</small>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="calendar-range-layer" aria-label="跨天任务与长期任务时间轴">
                    {rangeSegments.map((range) => (
                      range.kind === 'cross-day-task' ? (
                      <button
                        type="button"
                        className={`calendar-range-event${range.kind === 'cross-day-task' ? ' calendar-cross-day-range' : ''} event-${range.matrix_category}`}
                        key={`${range.id}-${weekDays[0].date}`}
                        style={{
                          '--calendar-range-left': `${(range.startIndex / 7) * 100}%`,
                          '--calendar-range-top': `${range.lane * 26}px`,
                          '--calendar-range-width': `${(range.span / 7) * 100}%`,
                          '--task-category-color': categories.find((category) => category.name === (range.category || '生活'))?.color,
                        }}
                        title={`${range.title}：${range.startDate} 至 ${range.endDate}`}
                        onClick={(event) => openTaskEditor(range, event)}
                      >
                        {range.title}
                      </button>
                      ) : (
                      <span
                        className={`calendar-range-event event-${range.matrix_category}`}
                        key={`${range.id}-${weekDays[0].date}`}
                        style={{
                          '--calendar-range-left': `${(range.startIndex / 7) * 100}%`,
                          '--calendar-range-top': `${range.lane * 26}px`,
                          '--calendar-range-width': `${(range.span / 7) * 100}%`,
                        }}
                        title={`${range.title}：${range.startDate} 至 ${range.endDate}`}
                      >
                        {range.title}
                      </span>
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {selectedTask && (
        <CalendarTaskEditor
          task={selectedTask}
          categories={categories}
          position={editorPosition}
          isConfirmingDelete={isConfirmingDelete}
          onClose={closeTaskEditor}
          onUpdate={updateSelectedTask}
          onPersist={persistSelectedTask}
          onConfirmDelete={() => setIsConfirmingDelete(true)}
          onCancelDelete={() => setIsConfirmingDelete(false)}
          onDelete={handleDeleteSelectedTask}
        />
      )}
    </div>
  );
}

function CalendarTaskEditor({ task, categories, position, isConfirmingDelete, onClose, onUpdate, onPersist, onConfirmDelete, onCancelDelete, onDelete }) {
  const isAllDay = !task.task_time && !task.end_time;
  const endDate = task.end_date || task.task_date;

  function changeStartDate(date) {
    const changes = { task_date: date };
    if (task.end_date && task.end_date < date) changes.end_date = date;
    onUpdate(changes);
  }

  function changeEndDate(date) {
    onUpdate({ end_date: date === task.task_date ? null : date });
  }

  function toggleAllDay() {
    if (isAllDay) {
      onUpdate({ task_time: '09:00', end_time: '10:00' });
      return;
    }
    onUpdate({ task_time: null, end_time: null });
  }

  return (
    <div className="calendar-task-editor-backdrop" onMouseDown={onClose}>
      <section
        className="calendar-task-editor"
        aria-label={`编辑任务：${task.title}`}
        onMouseDown={(event) => event.stopPropagation()}
        style={{ '--calendar-editor-top': `${position.top}px`, '--calendar-editor-left': `${position.left}px` }}
      >
        <div className="calendar-editor-title-row">
          <input
            aria-label="任务标题"
            value={task.title}
            onChange={(event) => onUpdate({ title: event.target.value }, false)}
            onBlur={onPersist}
            placeholder="填写任务标题"
          />
          <button type="button" className="calendar-editor-close" onClick={onClose} aria-label="关闭任务设置">×</button>
        </div>

        <div className="calendar-editor-schedule">
          <div className="calendar-editor-properties-row">
          <label className="calendar-editor-category">
            <span className="calendar-editor-category-dot" style={{ background: categories.find((item) => item.name === (task.category || '生活'))?.color }} aria-hidden="true" />
            <select value={task.category || '生活'} onChange={(event) => onUpdate({ category: event.target.value })} aria-label="任务分类">
              {categories.map((category) => <option value={category.name} key={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="calendar-editor-specific-time">
            <input type="checkbox" checked={!isAllDay} onChange={toggleAllDay} />
            <span>具体时间</span>
          </label>
          </div>
          <div className={isAllDay ? 'calendar-editor-schedule-row is-all-day' : 'calendar-editor-schedule-row'}>
            <CalendarDateInput label="开始" value={task.task_date} onChange={changeStartDate} />
            {!isAllDay && <label className="calendar-editor-time"><Clock3 size={15} aria-hidden="true" /><input type="time" value={task.task_time || ''} onChange={(event) => onUpdate({ task_time: event.target.value }, false)} onBlur={onPersist} aria-label="开始时间" /></label>}
          </div>
          <div className={isAllDay ? 'calendar-editor-schedule-row is-all-day' : 'calendar-editor-schedule-row'}>
            <CalendarDateInput label="结束" value={endDate} min={task.task_date} onChange={changeEndDate} />
            {!isAllDay && <label className="calendar-editor-time"><Clock3 size={15} aria-hidden="true" /><input type="time" value={task.end_time || ''} onChange={(event) => onUpdate({ end_time: event.target.value }, false)} onBlur={onPersist} aria-label="结束时间" /></label>}
          </div>
        </div>

        <label className="calendar-editor-notes">
          <input value={task.description ?? ''} onChange={(event) => onUpdate({ description: event.target.value }, false)} onBlur={onPersist} placeholder="备注" aria-label="备注" />
        </label>

        {isConfirmingDelete ? (
          <div className="calendar-editor-delete-confirm">
            <span>确认删除此事件？</span>
            <button type="button" onClick={onDelete}>确认删除</button>
            <button type="button" onClick={onCancelDelete}>取消</button>
          </div>
        ) : (
          <button className="calendar-editor-delete" type="button" onClick={onConfirmDelete}><Trash2 size={16} /> 删除事件</button>
        )}
      </section>
    </div>
  );
}

function CalendarDateInput({ label, value, min, onChange }) {
  const [text, setText] = React.useState(formatCalendarDateInput(value));
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  React.useEffect(() => {
    setText(formatCalendarDateInput(value));
  }, [value]);

  function applyManualDate() {
    const parsedDate = parseCalendarDateInput(text);
    if (!parsedDate || (min && parsedDate < min)) {
      setText(formatCalendarDateInput(value));
      return;
    }
    onChange(parsedDate);
  }

  return (
    <label className="calendar-editor-date">
      <span>{label}</span>
      <div className="calendar-date-input-wrap">
        <button type="button" className="calendar-date-picker-button" onClick={() => setIsPickerOpen((open) => !open)} aria-label={`选择${label}日期`} aria-expanded={isPickerOpen}>
          <CalendarDays size={18} />
        </button>
        <input
          value={text}
          inputMode="numeric"
          placeholder="9 / 15 / 2026"
          onChange={(event) => setText(event.target.value)}
          onBlur={applyManualDate}
          aria-label={`${label}日期，可输入月日年`}
        />
      </div>
      {isPickerOpen && <CalendarDatePicker value={value} min={min} onSelect={(date) => { onChange(date); setIsPickerOpen(false); }} />}
    </label>
  );
}

function CalendarDatePicker({ value, min, onSelect }) {
  const [activeMonth, setActiveMonth] = React.useState(() => new Date(`${value}T12:00:00`));
  const monthDays = getMonthDays(activeMonth);

  return (
    <div className="calendar-date-picker" role="dialog" aria-label="选择日期">
      <div className="calendar-date-picker-header">
        <button type="button" onClick={() => setActiveMonth((date) => new Date(date.getFullYear() - 1, date.getMonth(), 1))} aria-label="上一年">«</button>
        <button type="button" onClick={() => setActiveMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} aria-label="上个月">‹</button>
        <strong>{activeMonth.getFullYear()}年{activeMonth.getMonth() + 1}月</strong>
        <button type="button" onClick={() => setActiveMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} aria-label="下个月">›</button>
        <button type="button" onClick={() => setActiveMonth((date) => new Date(date.getFullYear() + 1, date.getMonth(), 1))} aria-label="下一年">»</button>
      </div>
      <div className="calendar-date-picker-weekdays" aria-hidden="true">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-date-picker-days">
        {monthDays.map((day) => (
          <button
            type="button"
            key={day.date}
            className={[day.isCurrentMonth ? '' : 'muted', day.date === value ? 'selected' : ''].filter(Boolean).join(' ')}
            disabled={Boolean(min && day.date < min)}
            onClick={() => onSelect(day.date)}
          >
            {day.dayNumber}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatCalendarDateInput(date) {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  return `${month} / ${day} / ${year}`;
}

function parseCalendarDateInput(value) {
  const parts = value.match(/\d+/g)?.map(Number);
  if (!parts || parts.length !== 3) return null;
  const [first, second, third] = parts;
  const [year, month, day] = String(first).length === 4 ? [first, second, third] : [third, first, second];
  const candidate = new Date(year, month - 1, day);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function MatrixPanel({ tasks, setTasks, setMessage, categoryOptions, categoryDefinitions, onOpenCategorySettings }) {
  return (
    <div className="matrix-grid">
      <div className="matrix-coordinate-axes" aria-hidden="true">
        <span className="matrix-coordinate-axis horizontal" />
        <span className="matrix-coordinate-axis vertical" />
      </div>
      {matrixOptions.map((matrix) => {
        const matrixTasks = tasks.filter((task) => task.matrix_category === matrix.value && task.status !== 'completed');
        return (
          <section className="panel-card matrix-cell" key={matrix.value}>
            <div className="matrix-heading">
              <div>
                <span className={`matrix-heading-icon icon-${matrix.value}`}><MatrixVisualIcon value={matrix.value} /></span>
                <div><h2>{matrix.label}</h2><p>{matrix.hint}</p></div>
              </div>
              <span>{matrixTasks.length}</span>
            </div>
            <TaskList
              tasks={matrixTasks}
              setTasks={setTasks}
              setMessage={setMessage}
              categoryOptions={categoryOptions}
              categoryDefinitions={categoryDefinitions}
              onOpenCategorySettings={onOpenCategorySettings}
              variant="matrix"
              emptyText="这个象限暂时没有任务。"
            />
          </section>
        );
      })}
    </div>
  );
}

function MatrixVisualIcon({ value }) {
  const activeCells = {
    important_urgent: 'top-left',
    important_not_urgent: 'top-right',
    urgent_not_important: 'bottom-left',
    not_urgent_not_important: 'bottom-right',
  };

  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none">
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((cell) => {
        const isActive = activeCells[value] === cell;
        const x = cell.endsWith('right') ? 12.5 : 3.5;
        const y = cell.startsWith('bottom') ? 12.5 : 3.5;
        return (
          <rect
            key={cell}
            x={x}
            y={y}
            width="8"
            height="8"
            rx="2"
            fill={isActive ? 'currentColor' : 'none'}
            opacity={isActive ? 1 : 0.62}
            stroke="currentColor"
            strokeWidth="1.65"
          />
        );
      })}
    </svg>
  );
}

function ProfilePanel({ session, profile, onProfileChange, setMessage, theme, setTheme, onSignOut }) {
  const [nickname, setNickname] = React.useState(profile?.nickname ?? '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isNicknameSaved, setIsNicknameSaved] = React.useState(false);

  React.useEffect(() => {
    setNickname(profile?.nickname ?? '');
  }, [profile]);

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, nickname: nickname.trim() || makeNickname(session.user.email) })
      .select('*')
      .single();
    setIsSaving(false);

    if (error) {
      setMessage(`保存昵称失败：${error.message}`);
      return;
    }

    onProfileChange(data);
    setIsNicknameSaved(true);
    setMessage('昵称已更新。');
  }

  const isNicknameUnchanged = nickname.trim() === (profile?.nickname ?? '').trim();

  return (
    <section className="profile-settings-grid">
      <div className="panel-card profile-panel">
      <h2>个人资料</h2>
      <div className="profile-summary">
        <div>
          <span>当前邮箱</span>
          <strong>{session.user.email}</strong>
        </div>
        <div>
          <span>当前昵称</span>
          <strong>{profile?.nickname ?? '还没有昵称'}</strong>
        </div>
      </div>
      <p className="muted-text">公开笔记和评论会显示昵称，不显示完整邮箱。</p>
      <form className="profile-nickname-form" onSubmit={handleSave}>
        <label htmlFor="nickname">昵称</label>
        <div className="profile-nickname-row">
          <input
            id="nickname"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
              setIsNicknameSaved(false);
            }}
          />
          <button className="nickname-save-button" disabled={isSaving || isNicknameUnchanged}>
            {isSaving ? '保存中...' : isNicknameSaved ? '已保存' : '保存修改'}
          </button>
        </div>
      </form>
      <button className="profile-signout-button" onClick={onSignOut}>
        <LogOut size={17} />
        退出登录
      </button>
      </div>

      <div className="panel-card theme-panel">
        <div className="theme-panel-heading">
          <span className="section-icon section-icon-purple"><Palette size={18} /></span>
          <div>
            <h2>工作台主题</h2>
            <p className="muted-text">只改变登录后的私人工作台。</p>
          </div>
        </div>
        <div className="theme-options">
          <button className={theme === 'default' ? 'theme-option active' : 'theme-option'} onClick={() => setTheme('default')}>
            <span className="theme-preview default-preview"><i /><i /><i /></span>
            <span><strong>轻盈多彩</strong><small>浅灰背景、白色卡片和彩色点缀</small></span>
            {theme === 'default' && <CheckCircle2 size={19} />}
          </button>
          <button className={theme === 'mint' ? 'theme-option active' : 'theme-option'} onClick={() => setTheme('mint')}>
            <span className="theme-preview mint-preview"><i /><i /><i /></span>
            <span><strong>薄荷绿</strong><small>保留原有淡绿色背景和绿色按钮</small></span>
            {theme === 'mint' && <CheckCircle2 size={19} />}
          </button>
        </div>
      </div>
    </section>
  );
}

function PublicNotesPage({ session, profile, onLogin, embedded = false }) {
  const [notes, setNotes] = React.useState([]);
  const [profiles, setProfiles] = React.useState({});
  const [commentsByNote, setCommentsByNote] = React.useState({});
  const [commentsEnabled, setCommentsEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    async function loadPublicNotes() {
      if (!supabase) {
        setMessage('Supabase 还没有配置好。');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .select('id, user_id, title, content, created_at')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        setMessage(`读取公开笔记失败：${error.message}`);
        setIsLoading(false);
        return;
      }

      const publicNotes = data ?? [];
      const noteIds = publicNotes.map((note) => note.id);
      let publicComments = [];

      if (noteIds.length > 0) {
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .select('id, note_id, user_id, content, created_at')
          .in('note_id', noteIds)
          .order('created_at', { ascending: true });

        if (commentError) {
          setCommentsEnabled(false);
          setMessage('评论区还没有准备好，公开笔记可以正常查看。');
        } else {
          publicComments = commentData ?? [];
          setCommentsEnabled(true);
          setCommentsByNote(
            publicComments.reduce((groups, comment) => {
              groups[comment.note_id] = [...(groups[comment.note_id] ?? []), comment];
              return groups;
            }, {}),
          );
        }
      }

      const userIds = [...new Set([...publicNotes.map((note) => note.user_id), ...publicComments.map((comment) => comment.user_id)])];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase.from('profiles').select('id, nickname').in('id', userIds);
        setProfiles(Object.fromEntries((profileData ?? []).map((profile) => [profile.id, profile.nickname])));
      }

      setNotes(publicNotes);
      setIsLoading(false);
    }

    loadPublicNotes();
  }, []);

  async function handleCreateComment(noteId, content, clearComment) {
    setMessage('');

    if (!session) {
      setMessage('登录后就可以参与评论。');
      return;
    }

    const text = content.trim();
    if (!text) {
      setMessage('先写一点内容，再发布评论。');
      return;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({ note_id: noteId, user_id: session.user.id, content: text })
      .select('id, note_id, user_id, content, created_at')
      .single();

    if (error) {
      setMessage(`评论发布失败：${error.message}`);
      return;
    }

    setProfiles((currentProfiles) => ({
      ...currentProfiles,
      [session.user.id]: profile?.nickname ?? session.user.email,
    }));
    setCommentsByNote((currentComments) => ({
      ...currentComments,
      [noteId]: [...(currentComments[noteId] ?? []), data],
    }));
    clearComment();
    setMessage('评论已发布。');
  }

  async function handleDeleteComment(noteId, commentId) {
    setMessage('');

    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      setMessage(`评论删除失败：${error.message}`);
      return;
    }

    setCommentsByNote((currentComments) => ({
      ...currentComments,
      [noteId]: (currentComments[noteId] ?? []).filter((comment) => comment.id !== commentId),
    }));
    setMessage('评论已删除。');
  }

  async function handleUpdateComment(noteId, commentId, content) {
    setMessage('');

    const text = content.trim();
    if (!text) {
      setMessage('评论内容不能为空。');
      return false;
    }

    const { data, error } = await supabase
      .from('comments')
      .update({ content: text })
      .eq('id', commentId)
      .select('id, note_id, user_id, content, created_at')
      .single();

    if (error) {
      setMessage(`评论更新失败：${error.message}`);
      return false;
    }

    setCommentsByNote((currentComments) => ({
      ...currentComments,
      [noteId]: (currentComments[noteId] ?? []).map((comment) => (comment.id === commentId ? data : comment)),
    }));
    setMessage('评论已更新。');
    return true;
  }

  return (
    <section className={embedded ? 'public-page embedded-public-page' : 'public-page'}>
      <div className="public-hero">
        <div>
          <p className="public-kicker"><Sparkles size={15} /> 灵感广场</p>
          <h1>公开笔记</h1>
          <p>看看大家最近记录的想法，也可以留下你的回应。</p>
        </div>
        <div className="public-summary">
          <strong>{notes.length}</strong>
          <span>篇公开分享</span>
        </div>
      </div>
      {message && <p className="form-message global-message">{message}</p>}
      {isLoading ? (
        <p className="form-message global-message">正在读取公开笔记...</p>
      ) : notes.length === 0 ? (
        <EmptyState text="还没有公开笔记，公开后的笔记会显示在这里。" />
      ) : (
        <div className="public-grid">
          {notes.map((note, index) => (
            <article className={`public-note-card public-note-accent-${(index % 4) + 1}`} key={note.id}>
              <div className="public-note-cover">
                <span className="public-note-emoji" aria-hidden="true">{['📝', '💡', '📚', '✨'][index % 4]}</span>
                <span className="public-note-label">公开笔记</span>
              </div>
              <div className="public-note-body">
                <div className="public-note-meta">
                  <span className="public-author">{profiles[note.user_id] ?? '匿名用户'}</span>
                  <span>{new Date(note.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <h3>{note.title}</h3>
                {note.content && <RichNotePreview className="public-note-content" content={note.content} />}
              <CommentsSection
                comments={commentsByNote[note.id] ?? []}
                commentsEnabled={commentsEnabled}
                profiles={profiles}
                session={session}
                onLogin={onLogin}
                onCreateComment={(content, clearComment) => handleCreateComment(note.id, content, clearComment)}
                onDeleteComment={(commentId) => handleDeleteComment(note.id, commentId)}
                onUpdateComment={(commentId, content) => handleUpdateComment(note.id, commentId, content)}
              />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentsSection({ comments, commentsEnabled, profiles, session, onLogin, onCreateComment, onDeleteComment, onUpdateComment }) {
  const [draft, setDraft] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingCommentId, setEditingCommentId] = React.useState(null);
  const [editDraft, setEditDraft] = React.useState('');
  const [updatingCommentId, setUpdatingCommentId] = React.useState(null);
  const [confirmingDeleteCommentId, setConfirmingDeleteCommentId] = React.useState(null);
  const [deletingCommentId, setDeletingCommentId] = React.useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    await onCreateComment(draft, () => setDraft(''));
    setIsSubmitting(false);
  }

  async function handleDeleteComment(commentId) {
    setDeletingCommentId(commentId);
    await onDeleteComment(commentId);
    setDeletingCommentId(null);
    setConfirmingDeleteCommentId(null);
  }

  function startEditComment(comment) {
    setEditingCommentId(comment.id);
    setEditDraft(comment.content);
    setConfirmingDeleteCommentId(null);
  }

  async function handleUpdateComment(event, commentId) {
    event.preventDefault();
    setUpdatingCommentId(commentId);
    const didUpdate = await onUpdateComment(commentId, editDraft);
    setUpdatingCommentId(null);
    if (didUpdate) {
      setEditingCommentId(null);
      setEditDraft('');
    }
  }

  return (
    <div className="comments-box">
      <div className="comments-heading">
        <strong>评论</strong>
        <span>{comments.length}</span>
      </div>

      {!commentsEnabled ? (
        <p className="muted-text">评论区暂时不可用。</p>
      ) : comments.length === 0 ? (
        <p className="muted-text">还没有人回应，可以留下第一条评论。</p>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div className="comment-item" key={comment.id}>
              <div className="comment-meta">
                <div className="comment-author">
                  <strong>{profiles[comment.user_id] ?? '匿名用户'}</strong>
                  <span>{new Date(comment.created_at).toLocaleString('zh-CN')}</span>
                </div>
                {session?.user.id === comment.user_id && (
                  confirmingDeleteCommentId === comment.id ? (
                    <div className="confirm-delete comment-confirm-delete">
                      <span>删除这条评论？</span>
                      <button
                        className="danger-confirm-button"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                      >
                        {deletingCommentId === comment.id ? '删除中...' : '删除'}
                      </button>
                      <button className="cancel-confirm-button" onClick={() => setConfirmingDeleteCommentId(null)} disabled={deletingCommentId === comment.id}>
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="comment-actions">
                      <button className="small-action-button comment-icon-button" onClick={() => startEditComment(comment)} aria-label="编辑评论" title="编辑评论">
                        <Pencil size={14} />
                      </button>
                      <button
                        className="delete-button comment-delete-button"
                        onClick={() => setConfirmingDeleteCommentId(comment.id)}
                        aria-label="删除评论"
                        title="删除评论"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                )}
              </div>
              {editingCommentId === comment.id ? (
                <form className="comment-form comment-edit-form" onSubmit={(event) => handleUpdateComment(event, comment.id)}>
                  <textarea
                    rows={2}
                    value={editDraft}
                    maxLength={500}
                    onChange={(event) => setEditDraft(event.target.value)}
                  />
                  <div className="form-actions">
                    <button className="primary-button" type="submit" disabled={updatingCommentId === comment.id || !editDraft.trim()}>
                      {updatingCommentId === comment.id ? '保存中...' : '保存修改'}
                    </button>
                    <button className="text-button" type="button" onClick={() => setEditingCommentId(null)} disabled={updatingCommentId === comment.id}>
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <p>{comment.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {commentsEnabled && (
        session ? (
          <form className="comment-form" onSubmit={handleSubmit}>
            <textarea
              rows={2}
              value={draft}
              placeholder="写下你的想法..."
              maxLength={500}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="primary-button" type="submit" disabled={isSubmitting || !draft.trim()}>
              {isSubmitting ? '发布中...' : '发布'}
            </button>
          </form>
        ) : (
          <button className="text-button comment-login-button" onClick={onLogin}>
            登录后参与评论
          </button>
        )
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
