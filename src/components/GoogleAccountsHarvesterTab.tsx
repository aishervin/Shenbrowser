import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Plus,
  Trash2,
  Monitor,
  Sparkles,
  Bot,
  Square,
  Lock,
  Unlock,
  RefreshCw,
  X,
  Maximize2,
  ChevronRight,
  Edit2,
  ArrowRight,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ProfileItem,
  ApiHarvestService,
  HarvestedKey,
  BrowserSession,
  AgentRun,
} from '../types/browserUse';

interface GoogleAccountsHarvesterTabProps {
  currentRun: AgentRun | null;
  onStartAgentTask: (task: string, profileId?: string) => Promise<AgentRun>;
  onLaunchInteractiveBrowser: (profileId: string, startUrl: string) => Promise<BrowserSession | null>;
  activeBrowser: BrowserSession | null;
  onStopActiveBrowser: () => Promise<void>;
}

export const GoogleAccountsHarvesterTab: React.FC<GoogleAccountsHarvesterTabProps> = ({
  currentRun,
  onStartAgentTask,
  onLaunchInteractiveBrowser,
  activeBrowser,
  onStopActiveBrowser,
}) => {
  // 4 Google Profiles (Persisted in localStorage)
  const [profiles, setProfiles] = useState<ProfileItem[]>(() => {
    try {
      const saved = localStorage.getItem('google_harvester_profiles');
      return saved
        ? JSON.parse(saved)
        : [
            { id: 'profile-google-1', name: 'اکانت ۱ (اصلی)', email: 'primary.dev@gmail.com', status: 'authenticated' },
            { id: 'profile-google-2', name: 'اکانت ۲ (توسعه)', email: 'secondary.test@gmail.com', status: 'needs_login' },
            { id: 'profile-google-3', name: 'اکانت ۳ (رزرو)', email: 'backup.flow@gmail.com', status: 'needs_login' },
            { id: 'profile-google-4', name: 'اکانت ۴ (سرویس‌ها)', email: 'service.keys@gmail.com', status: 'needs_login' },
          ];
    } catch (e) {
      return [
        { id: 'profile-google-1', name: 'اکانت ۱ (اصلی)', email: 'primary.dev@gmail.com', status: 'authenticated' },
        { id: 'profile-google-2', name: 'اکانت ۲ (توسعه)', email: 'secondary.test@gmail.com', status: 'needs_login' },
        { id: 'profile-google-3', name: 'اکانت ۳ (رزرو)', email: 'backup.flow@gmail.com', status: 'needs_login' },
        { id: 'profile-google-4', name: 'اکانت ۴ (سرویس‌ها)', email: 'service.keys@gmail.com', status: 'needs_login' },
      ];
    }
  });

  const [services, setServices] = useState<ApiHarvestService[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('profile-google-1');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['groq', 'huggingface', 'tavily']);

  // Email inline editing
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState<string>('');

  // Simulated login form state
  const [simEmail, setSimEmail] = useState<string>('');
  const [simPassword, setSimPassword] = useState<string>('');
  const [sim2fa, setSim2fa] = useState<string>('');
  const [simStep, setSimStep] = useState<'credentials' | '2fa' | 'done'>('credentials');

  // Harvested Keys Vault (Persisted in localStorage)
  const [harvestedKeys, setHarvestedKeys] = useState<HarvestedKey[]>(() => {
    try {
      const saved = localStorage.getItem('harvested_api_keys');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'key-1',
              serviceId: 'groq',
              serviceName: 'Groq Cloud',
              profileId: 'profile-google-1',
              profileName: 'اکانت ۱ (اصلی)',
              apiKey: 'gsk_79fXq82A9bL1mZ0k...',
              createdAt: new Date().toISOString(),
            },
          ];
    } catch (e) {
      return [];
    }
  });

  const [activeLoginProfile, setActiveLoginProfile] = useState<ProfileItem | null>(null);
  const [isHarvesting, setIsHarvesting] = useState<boolean>(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);

  // Load services from API
  useEffect(() => {
    fetch('/api/harvester/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.services) setServices(data.services);
      })
      .catch((err) => console.warn('Could not load services:', err));
  }, []);

  // Save profiles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('google_harvester_profiles', JSON.stringify(profiles));
    } catch (e) {}
  }, [profiles]);

  // Save keys to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('harvested_api_keys', JSON.stringify(harvestedKeys));
    } catch (e) {}
  }, [harvestedKeys]);

  // Open interactive cloud browser tab for Google login
  const handleOpenGoogleLoginTab = async (profile: ProfileItem) => {
    setActiveLoginProfile(profile);
    setSimEmail(profile.email || '');
    setSimPassword('');
    setSim2fa('');
    setSimStep('credentials');
    await onLaunchInteractiveBrowser(profile.id, 'https://accounts.google.com/signin');
  };

  const handleFinishLogin = () => {
    if (activeLoginProfile) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === activeLoginProfile.id
            ? { ...p, status: 'authenticated', email: simEmail || p.email }
            : p
        )
      );
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }
    setActiveLoginProfile(null);
  };

  const handleSaveEditedEmail = (profileId: string) => {
    if (tempEmail.trim()) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, email: tempEmail.trim() } : p))
      );
    }
    setEditingProfileId(null);
  };

  // Run autonomous key harvest for selected services
  const handleStartHarvest = async () => {
    const profile = profiles.find((p) => p.id === selectedProfileId);
    if (!profile) return;

    setIsHarvesting(true);

    const selectedServiceObjs = services.filter((s) => selectedServiceIds.includes(s.id));

    for (const service of selectedServiceObjs) {
      try {
        const harvestPrompt = `You have an active logged-in Google session.
${service.instructionsPrompt}
Target Service: ${service.name}
Strict Extraction Goal: Find the API key.
Output the final extracted API Key strictly in JSON format: {"service": "${service.name}", "apiKey": "..."}.
If you cannot find it, explain why in a single sentence.`;

        const runResult = await onStartAgentTask(harvestPrompt, profile.id);

        // Extract key from result
        let extractedKey: string | null = null;
        if (runResult.result) {
          const res = runResult.result;
          if (typeof res === 'object' && res.apiKey) {
            extractedKey = String(res.apiKey);
          } else if (typeof res === 'string') {
            // Attempt to parse JSON from string
            try {
              const parsed = JSON.parse(res.replace(/```json|```/g, '').trim());
              extractedKey = parsed.apiKey || null;
            } catch (e) {
              // Fallback regex for keys
              const matches = res.match(/(gsk_|hf_|tvly-|sk-or-|csk-)[a-zA-Z0-9_-]+/);
              if (matches) extractedKey = matches[0];
            }
          }
        }

        if (extractedKey) {
          const newKey: HarvestedKey = {
            id: `key-${Date.now()}-${service.id}`,
            serviceId: service.id,
            serviceName: service.name,
            profileId: profile.id,
            profileName: profile.name,
            apiKey: extractedKey,
            createdAt: new Date().toISOString(),
          };
          setHarvestedKeys((prev) => [newKey, ...prev]);
        } else if (runResult.isSimulated) {
          // If in simulation mode, add a "Simulated Key" so the UI feels responsive
          const simKey: HarvestedKey = {
            id: `key-sim-${Date.now()}-${service.id}`,
            serviceId: service.id,
            serviceName: service.name,
            profileId: profile.id,
            profileName: profile.name,
            apiKey: service.id === 'groq' ? `gsk_SIM_${Math.random().toString(36).substring(2, 10)}` : `sk-sim-${Math.random().toString(36).substring(2, 10)}`,
            createdAt: new Date().toISOString(),
            notes: 'این یک کلید شبیه‌سازی شده است چون برنامه در حالت دمو اجرا می‌شود.'
          };
          setHarvestedKeys((prev) => [simKey, ...prev]);
        }
      } catch (err) {
        console.error(`Harvest failed for ${service.name}:`, err);
      }
    }

    setIsHarvesting(false);
  };

  const handleCopyKey = (key: HarvestedKey) => {
    navigator.clipboard.writeText(key.apiKey);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleExportEnv = () => {
    const envLines = harvestedKeys.map(
      (k) => `${k.serviceId.toUpperCase()}_API_KEY_${k.profileName.replace(/\s+/g, '_')}="${k.apiKey}"`
    );
    navigator.clipboard.writeText(envLines.join('\n'));
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>مدیریت ۴ اکانت گوگل و دریافت خودکار کلیدهای API رایگان</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Persistent Profiles
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              با استفاده از <strong>پروفایل‌های ماندگار (Browser Profiles)</strong>، شما فقط یک‌بار در برگهٔ ابری زنده وارد اکانت گوگل خود می‌شوید (و در صورت نیاز تایید دومرحله‌ای ۲FA را انجام می‌دهید). سپس نشست و کوکی‌های شما به صورت امن در پروفایل ذخیره شده و ایجنت به صورت خودکار به سرویس‌های هوش مصنوعی سر می‌زند، با دکمهٔ «Sign in with Google» ثبت‌نام می‌کند و کلیدهای API رایگان را برای شما جمع‌آوری می‌نماید.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportEnv}
          disabled={harvestedKeys.length === 0}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedEnv ? 'خروجی کپی شد!' : 'خروجی فایل env.'}</span>
        </button>
      </div>

      {/* Interactive Google Login Modal / Frame (وقتی کاربر دکمه لاگین را می‌زند) */}
      {activeBrowser && activeLoginProfile && (
        <div className="rounded-2xl bg-slate-900 border-2 border-cyan-500 shadow-2xl p-4 space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping mr-1" />
              <h3 className="text-sm font-bold text-white">
                برگهٔ زنده ورود به گوگل برای: <span className="text-cyan-300">{activeLoginProfile.name}</span>
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              {activeBrowser.liveUrl && (
                <a
                  href={activeBrowser.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>باز کردن در تب مستقل</span>
                </a>
              )}

              <button
                onClick={handleFinishLogin}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>لاگین انجام شد (ذخیره در پروفایل)</span>
              </button>

              <button
                onClick={() => {
                  onStopActiveBrowser();
                  setActiveLoginProfile(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="بستن برگه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              💡 <strong>راهنما:</strong> در کادر زیر ایمیل و رمز گوگل خود را وارد کنید و در صورت نیاز تایید دو مرحله‌ای (۲FA) را ثبت کنید. کوکی‌ها بلافاصله در این پروفایل ماندگار می‌شوند.
            </span>
            <span className="text-cyan-400 font-mono text-[11px] shrink-0">پروکسی فعال: آلمان (Stealth EU)</span>
          </div>

          <div className="relative w-full min-h-[420px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {activeBrowser.isSimulated ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">نیاز به کلید API معتبر</h3>
                <p className="text-sm text-slate-400">
                  برای انجام **لاگین واقعی گوگل** و ذخیره کوکی‌ها در پروفایل، باید یک کلید API معتبر از <a href="https://cloud.eu.browser-use.com" target="_blank" className="text-cyan-400 underline">Browser Use Cloud</a> دریافت کرده و در بخش Secrets وارد کنید.
                </p>
                <p className="text-xs text-amber-300/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  ⚠️ در حالت دمو (Simulation)، مرورگر ابری واقعی باز نمی‌شود و امکان ورود واقعی به جیمیل وجود ندارد.
                </p>
                <button
                  onClick={() => {
                    onStopActiveBrowser();
                    setActiveLoginProfile(null);
                  }}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  فهمیدم، بستن پنجره
                </button>
              </div>
            ) : activeBrowser.liveUrl ? (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={activeBrowser.liveUrl}
                  title="Live Google Login Window"
                  className="w-full h-full min-h-[500px] border-0"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
            ) : (
              <div className="h-full py-24 flex flex-col items-center justify-center text-slate-400 text-xs space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
                <span>در حال بارگذاری مرورگر ابری واقعی Chrome...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4 Google Profiles Cards Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>پروفایل ۴ اکانت گوگل شما</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {profiles.map((prof) => {
            const isAuth = prof.status === 'authenticated';
            const isSelected = selectedProfileId === prof.id;
            const isEditing = editingProfileId === prof.id;

            return (
              <div
                key={prof.id}
                onClick={() => setSelectedProfileId(prof.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{prof.name}</span>
                    {isAuth ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> لاگین فعال
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> نیاز به ورود
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        placeholder="email@gmail.com"
                        className="bg-slate-950 border border-cyan-500 text-xs text-white rounded px-2 py-1 w-full focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEditedEmail(prof.id)}
                        className="p-1 rounded bg-cyan-600 text-white hover:bg-cyan-500"
                        title="ذخیره"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <p className="text-xs font-mono text-slate-400 truncate">{prof.email}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProfileId(prof.id);
                          setTempEmail(prof.email || '');
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-cyan-400 transition-opacity"
                        title="ویرایش ایمیل"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenGoogleLoginTab(prof);
                    }}
                    className="flex items-center space-x-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>{isAuth ? 'تمدید ورود / برگه' : '🌐 باز کردن برگه لاگین'}</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </button>

                  {isSelected && (
                    <span className="text-[10px] font-bold text-cyan-300 uppercase">انتخاب شده</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Free API Services & Harvester Trigger */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>انتخاب سرویس‌های دارای سهمیه رایگان برای استخراج خودکار کلید</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ایجنت با اکانت <strong className="text-cyan-300">{profiles.find((p) => p.id === selectedProfileId)?.name}</strong> به این سرویس‌ها رفته و کلید را صادر می‌کند.
            </p>
          </div>

          <button
            onClick={handleStartHarvest}
            disabled={isHarvesting || selectedServiceIds.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isHarvesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            <span>{isHarvesting ? 'در حال استخراج کلیدها...' : `🚀 دریافت خودکار کلیدها (${selectedServiceIds.length} سرویس)`}</span>
          </button>
        </div>

        {/* Live Agent Terminal (Visible when harvesting) */}
        {isHarvesting && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Live Execution Logs</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[10px] text-cyan-400 font-mono">Agent Active</span>
              </div>
            </div>
            <div className="p-3 h-48 overflow-y-auto font-mono text-[11px] space-y-1.5">
              {currentRun?.events && currentRun.events.length > 0 ? (
                currentRun.events.map((ev, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-slate-600 shrink-0">[{new Date(ev.createdAt).toLocaleTimeString([], { hour12: false })}]</span>
                    <span className="text-cyan-500 font-bold shrink-0">{ev.type.split('.').pop()}:</span>
                    <span className="text-slate-300 break-all">
                      {typeof ev.data === 'object' ? JSON.stringify(ev.data) : String(ev.data)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 animate-pulse italic">
                  Initializing secure browser session...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Checkbox Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((svc) => {
            const isChecked = selectedServiceIds.includes(svc.id);
            return (
              <label
                key={svc.id}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  isChecked
                    ? 'bg-slate-950 border-cyan-500/50 shadow-md'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedServiceIds((prev) => [...prev, svc.id]);
                    } else {
                      setSelectedServiceIds((prev) => prev.filter((id) => id !== svc.id));
                    }
                  }}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>{svc.logo}</span>
                      <span>{svc.name}</span>
                    </span>
                    <a
                      href={svc.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {svc.freeTierDescription}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Harvested Keys Vault */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              گنجینه کلیدهای دریافت شده ({harvestedKeys.length} کلید)
            </h3>
          </div>

          {harvestedKeys.length > 0 && (
            <button
              onClick={() => setHarvestedKeys([])}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              پاکسازی فهرست
            </button>
          )}
        </div>

        {harvestedKeys.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            هنوز کلیدی ذخیره نشده است. پس از تایید لاگین گوگل، روی «دریافت خودکار کلیدها» کلیک کنید.
          </div>
        ) : (
          <div className="space-y-2.5">
            {harvestedKeys.map((k) => (
              <div
                key={k.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-bold text-cyan-400">
                    🔑
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white">{k.serviceName}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {k.profileName}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-emerald-400 mt-0.5 select-all">
                      {k.apiKey}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyKey(k)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedKeyId === k.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKeyId === k.id ? 'کپی شد' : 'کپی کلید'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
