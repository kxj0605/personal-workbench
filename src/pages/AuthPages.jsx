import React from 'react';
import { Eye, EyeOff, Github, LockKeyhole, LogIn, Mail, Sparkles, UserPlus } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient';

const pendingVerificationEmailStorageKey = 'personal-workbench-pending-verification-email';

function readPendingVerificationEmail() {
  try {
    return window.sessionStorage.getItem(pendingVerificationEmailStorageKey) ?? '';
  } catch {
    return '';
  }
}

function savePendingVerificationEmail(email) {
  try {
    window.sessionStorage.setItem(pendingVerificationEmailStorageKey, email);
  } catch {
    // The email field still works when browser storage is unavailable.
  }
}

function clearPendingVerificationEmail() {
  try {
    window.sessionStorage.removeItem(pendingVerificationEmailStorageKey);
  } catch {
    // Nothing else is needed when browser storage is unavailable.
  }
}

function AuthModeSwitcher({ mode, onLogin, onRegister }) {
  const isRegister = mode === 'register';

  return (
    <div className={`auth-mode-switcher${isRegister ? ' is-register' : ''}`} role="tablist" aria-label="账户操作">
      <span className="auth-mode-switcher-indicator" aria-hidden="true" />
      <button
        className={isRegister ? '' : 'active'}
        type="button"
        role="tab"
        aria-selected={!isRegister}
        onClick={() => {
          if (isRegister) onLogin();
        }}
      >
        登录
      </button>
      <button
        className={isRegister ? 'active' : ''}
        type="button"
        role="tab"
        aria-selected={isRegister}
        onClick={() => {
          if (!isRegister) onRegister();
        }}
      >
        注册
      </button>
    </div>
  );
}

function getMailboxUrl(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  const inboxUrls = {
    'qq.com': 'https://mail.qq.com/',
    'foxmail.com': 'https://mail.qq.com/',
    'gmail.com': 'https://mail.google.com/',
    'outlook.com': 'https://outlook.live.com/mail/',
    'hotmail.com': 'https://outlook.live.com/mail/',
    'live.com': 'https://outlook.live.com/mail/',
    '163.com': 'https://mail.163.com/',
    '126.com': 'https://mail.126.com/',
  };

  return inboxUrls[domain] ?? null;
}

export function LoginPage({ onRegister, onForgotPassword, onDone }) {
  const [email, setEmail] = React.useState(readPendingVerificationEmail);
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isGithubLoading, setIsGithubLoading] = React.useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!isSupabaseConfigured) {
      setMessage('Supabase 还没有配置好。');
      return;
    }

    setIsLoading(true);

    try {
      const timeout = new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 12000);
      });
      const { error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeout,
      ]);

      if (error) {
        const errorText = error.message?.toLowerCase() ?? '';
        if (errorText.includes('email not confirmed')) {
          setMessage('邮箱还没有验证，请先打开注册邮件完成验证。');
        } else if (errorText.includes('invalid login credentials')) {
          setMessage('邮箱或密码不正确，请检查后再试。');
        } else {
          setMessage(`登录失败：${error.message}`);
        }
        return;
      }

      clearPendingVerificationEmail();
      onDone();
    } catch (error) {
      setMessage(
        error.message === 'AUTH_TIMEOUT'
          ? '连接登录服务超时，请检查网络后重试。'
          : '暂时无法连接登录服务，请稍后重试。',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGitHubLogin() {
    setMessage('');

    if (!isSupabaseConfigured) {
      setMessage('Supabase 还没有配置好。');
      return;
    }

    setIsGithubLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setIsGithubLoading(false);
      setMessage(`GitHub 登录暂不可用：${error.message}`);
    }
  }

  return (
    <section className="auth-page login-page auth-mode-page">
      <div className="auth-card">
        <div className="auth-card-heading auth-mode-card-heading">
          <AuthModeSwitcher mode="login" onRegister={onRegister} />
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label htmlFor="login-email">邮箱</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="login-password">密码</label>
          <div className="auth-password-field">
            <input
              id="login-password"
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="password-visibility-button"
              type="button"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
              title={isPasswordVisible ? '隐藏密码' : '显示密码'}
            >
              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="login-options">
            <label className="remember-password-option">
              <input type="checkbox" defaultChecked />
              <span>记住密码</span>
            </label>
            <button className="forgot-password-button" type="button" onClick={() => onForgotPassword(email)}>忘记密码？</button>
          </div>
          <button className="primary-button large" type="submit" disabled={isLoading}>
            <LogIn size={18} />
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}
        <button className="github-login-button" type="button" onClick={handleGitHubLogin} disabled={isGithubLoading}>
          <Github size={19} />
          {isGithubLoading ? '正在跳转 GitHub…' : '使用 GitHub 登录'}
        </button>
        <p className="login-register-copy">还没有账号？<button className="inline-register-button" type="button" onClick={onRegister}>立即注册</button></p>
      </div>
    </section>
  );
}

export function ForgotPasswordPage({ initialEmail = '', onLogin }) {
  const [email, setEmail] = React.useState(initialEmail);
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!isSupabaseConfigured) {
      setMessage('登录服务尚未配置好。');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Password reset links must return to a public URL; a local preview URL
      // cannot be opened from an email on another device.
      redirectTo: 'https://image-notes-starter.vercel.app/?reset-password=1',
    });
    setIsLoading(false);

    if (error) {
      setMessage(`发送失败：${error.message}`);
      return;
    }

    setMessage('重置链接已发送。请打开邮箱，点击邮件中的链接后设置新密码。');
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card-heading">
          <span className="auth-heading-icon"><LockKeyhole size={22} /></span>
          <div>
            <p className="eyebrow"><Sparkles size={15} /> 找回密码</p>
            <h1>重设你的登录密码</h1>
            <p className="muted-text">输入注册邮箱，我们会发送一封安全的重置邮件。</p>
          </div>
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label htmlFor="forgot-password-email">注册邮箱</label>
          <input
            id="forgot-password-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button className="primary-button large" type="submit" disabled={isLoading}>
            <LockKeyhole size={18} />
            {isLoading ? '正在发送…' : '发送重置链接'}
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}
        <button className="link-button" onClick={onLogin}>返回登录</button>
      </div>
    </section>
  );
}

export function ResetPasswordPage({ onDone, onLogin }) {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (password.length < 6) {
      setMessage('新密码至少需要 6 位。');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('两次输入的密码不一致。');
      return;
    }
    if (!isSupabaseConfigured) {
      setMessage('登录服务尚未配置好。');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      setMessage(`重置失败：${error.message}`);
      return;
    }

    setMessage('密码已更新，正在进入工作台…');
    window.setTimeout(onDone, 700);
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card-heading">
          <span className="auth-heading-icon"><LockKeyhole size={22} /></span>
          <div>
            <p className="eyebrow"><Sparkles size={15} /> 设置新密码</p>
            <h1>创建新的登录密码</h1>
            <p className="muted-text">请设置至少 6 位的新密码，完成后即可继续使用。</p>
          </div>
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label htmlFor="new-password">新密码</label>
          <input id="new-password" type="password" value={password} minLength={6} onChange={(event) => setPassword(event.target.value)} required />
          <label htmlFor="confirm-password">确认新密码</label>
          <input id="confirm-password" type="password" value={confirmPassword} minLength={6} onChange={(event) => setConfirmPassword(event.target.value)} required />
          <button className="primary-button large" type="submit" disabled={isLoading}>
            <LockKeyhole size={18} />
            {isLoading ? '正在更新…' : '保存新密码'}
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}
        <button className="link-button" onClick={onLogin}>返回登录</button>
      </div>
    </section>
  );
}

export function RegisterPage({ onLogin, onDone }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [verificationEmail, setVerificationEmail] = React.useState('');
  const [resendMessage, setResendMessage] = React.useState('');
  const [resendSeconds, setResendSeconds] = React.useState(0);
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timer = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!isSupabaseConfigured) {
      setMessage('Supabase 还没有配置好。');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setIsLoading(false);

    if (error) {
      setMessage(`注册失败：${error.message}`);
      return;
    }

    if (data.session) {
      clearPendingVerificationEmail();
      onDone();
      return;
    }

    savePendingVerificationEmail(email);
    setVerificationEmail(email);
    setResendSeconds(60);
  }

  async function handleResend() {
    if (!verificationEmail || resendSeconds > 0 || isResending) return;

    setResendMessage('');
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: verificationEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setIsResending(false);

    if (error) {
      setResendMessage(`发送失败：${error.message}`);
      return;
    }

    setResendSeconds(60);
    setResendMessage('验证邮件已重新发送，请检查收件箱和垃圾邮件箱。');
  }

  if (verificationEmail) {
    const mailboxUrl = getMailboxUrl(verificationEmail);

    return (
      <section className="auth-page register-page auth-mode-page">
        <div className="auth-card">
          <div className="auth-card-heading auth-mode-card-heading">
            <AuthModeSwitcher mode="register" onLogin={onLogin} />
          </div>
          <div className="email-verification-card">
            <span className="email-verification-icon"><Mail size={24} /></span>
            <div>
              <h1>验证你的邮箱</h1>
              <p>我们已向下面的邮箱发送确认邮件：</p>
              <strong>{verificationEmail}</strong>
            </div>
            <p className="email-verification-hint">请点击邮件中的确认链接。若在手机完成验证，请回到此设备登录进入工作台。</p>
            <div className="email-verification-actions">
              {mailboxUrl ? (
                <a className="primary-button large verification-mail-link" href={mailboxUrl} target="_blank" rel="noreferrer">打开邮箱</a>
              ) : (
                <p className="email-client-hint">请打开你的邮箱客户端查收验证邮件。</p>
              )}
              <button className="verification-resend-button" type="button" onClick={handleResend} disabled={resendSeconds > 0 || isResending}>
                {isResending ? '正在发送…' : resendSeconds > 0 ? `${resendSeconds} 秒后可重新发送` : '重新发送验证邮件'}
              </button>
              <button className="verification-change-email" type="button" onClick={() => {
                clearPendingVerificationEmail();
                setVerificationEmail('');
                setResendMessage('');
              }}>
                更换邮箱地址
              </button>
            </div>
            {resendMessage && <p className="form-message">{resendMessage}</p>}
            <p className="email-verification-tip">未收到邮件？请检查垃圾邮件箱。</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page register-page auth-mode-page">
      <div className="auth-card">
        <div className="auth-card-heading auth-mode-card-heading">
          <AuthModeSwitcher mode="register" onLogin={onLogin} />
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label htmlFor="register-email">邮箱</label>
          <input
            id="register-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="register-password">密码</label>
          <input
            id="register-password"
            type="password"
            placeholder="至少 6 位"
            value={password}
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="primary-button large" type="submit" disabled={isLoading}>
            <UserPlus size={18} />
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}
      </div>
    </section>
  );
}
