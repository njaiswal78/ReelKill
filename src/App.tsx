/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Timer,
  Settings,
  Zap,
  BarChart3,
  Calendar,
  Sparkles,
  Camera,
  PlayCircle,
  Facebook,
  ShieldCheck,
  Plus,
  Trash2,
  Globe,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFocusState, formatTime, isScheduleActive } from './lib/useFocusState';
import { browserTimezone, inExtension, lastNDaysBlocked, localDateKey } from './lib/storage';

type Tab = 'focus' | 'stats' | 'schedule' | 'whitelist';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('focus');
  const [newUrl, setNewUrl] = useState('');
  const { settings, stats, loading, updateSettings, resetStats } = useFocusState();

  // Re-evaluate schedule + today's date every 30s so the UI stays correct
  // as the clock crosses minute / midnight boundaries while the popup is open.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const scheduleActive = useMemo(() => isScheduleActive(settings, now), [settings, now]);
  const protectionActive = settings.strictMode || scheduleActive;
  const tz = useMemo(() => browserTimezone(), []);

  const todayKey = useMemo(() => localDateKey(now), [now]);
  const todayBlocked = stats.perDay[todayKey] ?? 0;
  const weeklyBlocked = useMemo(
    () => lastNDaysBlocked(stats.perDay, 7, now),
    [stats.perDay, now],
  );
  const weeklyPct = Math.min(
    100,
    Math.round((weeklyBlocked / Math.max(1, settings.weeklyGoal)) * 100),
  );

  const setWeeklyGoal = (next: number) => {
    const clamped = Math.max(0, Math.min(100_000, Math.round(next)));
    void updateSettings((prev) => ({ ...prev, weeklyGoal: clamped }));
  };

  const addToWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeDomain(newUrl);
    if (!cleaned) return;
    if (settings.whitelist.includes(cleaned)) {
      setNewUrl('');
      return;
    }
    void updateSettings((prev) => ({ ...prev, whitelist: [cleaned, ...prev.whitelist] }));
    setNewUrl('');
  };

  const removeFromWhitelist = (url: string) => {
    void updateSettings((prev) => ({ ...prev, whitelist: prev.whitelist.filter((u) => u !== url) }));
  };

  const toggleStrictMode = () => {
    void updateSettings((prev) => ({ ...prev, strictMode: !prev.strictMode }));
  };

  const toggleRule = (rule: keyof typeof settings.rules) => {
    void updateSettings((prev) => ({
      ...prev,
      rules: { ...prev.rules, [rule]: !prev.rules[rule] },
    }));
  };

  const toggleScheduleDay = (day: number) => {
    void updateSettings((prev) => {
      const has = prev.schedule.days.includes(day);
      const days = has
        ? prev.schedule.days.filter((d) => d !== day)
        : [...prev.schedule.days, day].sort((a, b) => a - b);
      return { ...prev, schedule: { ...prev.schedule, days } };
    });
  };

  const updateScheduleTime = (key: 'startMinutes' | 'endMinutes', minutes: number) => {
    void updateSettings((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [key]: minutes },
    }));
  };

  const toggleScheduleEnabled = () => {
    void updateSettings((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, enabled: !prev.schedule.enabled },
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-surface max-w-[360px] mx-auto shadow-2xl relative overflow-hidden ring-1 ring-brand-outline-variant">
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[360px] h-20 bg-white border-b border-brand-outline-variant flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Timer className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            <span className="text-brand-primary">Reel</span>Kill
          </h1>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Settings">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 pt-20 pb-24 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'focus' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-8"
            >
              <div className="flex justify-center">
                <div
                  className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${
                    protectionActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <span className="flex h-2 w-2 relative">
                    {protectionActive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        protectionActive ? 'bg-brand-success' : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  {protectionActive ? 'Protection Active' : 'Protection Idle'}
                </div>
              </div>

              <div className="bg-brand-primary p-8 rounded-4xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Strict Mode</h2>
                    <p className="text-indigo-100 text-xs leading-relaxed opacity-90">
                      Aggressively wipes all 9:16 containers from feeds globally.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/20">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">
                        {protectionActive ? 'On' : 'Off'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-100/80">
                        {scheduleActive
                          ? 'auto · schedule'
                          : settings.strictMode
                            ? 'manual'
                            : 'protection idle'}
                      </span>
                    </div>
                    <button
                      onClick={toggleStrictMode}
                      disabled={scheduleActive}
                      className={`w-12 h-6 bg-white rounded-full relative flex items-center px-1 transition-opacity ${
                        scheduleActive ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      title={
                        scheduleActive
                          ? 'Schedule is currently enforcing protection. Edit the Schedule tab to change.'
                          : 'Toggle strict mode'
                      }
                      aria-label="Toggle strict mode"
                    >
                      <motion.div
                        animate={{ x: protectionActive ? 24 : 0 }}
                        className="w-4 h-4 bg-brand-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <Timer size={160} className="stroke-[1]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="sleek-card p-6 flex flex-col gap-1">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Today</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {todayBlocked}
                    <span className="text-sm ml-1 text-slate-400">blocked</span>
                  </h3>
                </div>
                <div className="sleek-card p-6 flex flex-col gap-1">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Saved</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {stats.minutesSaved}
                    <span className="text-sm ml-1 text-slate-400">min</span>
                  </h3>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    {inExtension() ? 'ReelKill' : 'web preview'} · v1.0.0
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">ReelKill statistics</h2>
                <p className="text-slate-500 text-xs">What ReelKill removed for you.</p>
              </div>

              <div className="sleek-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em]">
                      Digital Cleanse
                    </p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">
                      {stats.totalBlocked.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">Short-form videos intercepted</p>
                  </div>
                  <button
                    onClick={resetStats}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 transition rounded-lg text-[10px] font-bold text-slate-600"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">7-day Goal</span>
                    <span className="text-brand-primary">{weeklyPct}% reached</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all"
                      style={{ width: `${weeklyPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      <span className="font-bold text-slate-900">
                        {weeklyBlocked.toLocaleString()}
                      </span>
                      <span className="text-slate-400"> / </span>
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        step={50}
                        value={settings.weeklyGoal}
                        onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                        className="w-16 bg-transparent border-b border-slate-200 focus:border-brand-primary outline-none text-slate-900 font-bold text-right tabular-nums"
                        aria-label="Weekly goal"
                      />
                      <span className="text-slate-400"> blocked this week</span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-50">
                  {DAY_LABELS.map((day, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-bold ${
                        i === new Date().getDay() ? 'text-brand-primary' : 'text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Platform Filtering</h3>
                  <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                    {Object.values(settings.rules).filter(Boolean).length} ACTIVE
                  </div>
                </div>
                <div className="space-y-3 divide-y divide-slate-50">
                  {[
                    {
                      key: 'youtubeShorts' as const,
                      name: 'YouTube Shorts',
                      icon: PlayCircle,
                      desc: `Blocks player and Shorts shelf. ${stats.perPlatform.youtube ?? 0} stopped.`,
                      color: 'text-red-600',
                      bg: 'bg-red-50',
                    },
                    {
                      key: 'instagramReels' as const,
                      name: 'Instagram Reels',
                      icon: Camera,
                      desc: `Hides Reels rail and explore videos. ${stats.perPlatform.instagram ?? 0} stopped.`,
                      color: 'text-pink-600',
                      bg: 'bg-pink-50',
                    },
                    {
                      key: 'tiktokFyp' as const,
                      name: 'TikTok For You Page',
                      icon: PlayCircle,
                      desc: `Redirects FYP to Following. ${stats.perPlatform.tiktok ?? 0} stopped.`,
                      color: 'text-slate-900',
                      bg: 'bg-slate-100',
                    },
                    {
                      key: 'facebookReels' as const,
                      name: 'Facebook Reels',
                      icon: Facebook,
                      desc: `Hides Reels nav, cards, and inline reel posts. ${stats.perPlatform.facebook ?? 0} stopped.`,
                      color: 'text-blue-600',
                      bg: 'bg-blue-50',
                    },
                    {
                      key: 'universal916' as const,
                      name: '9:16 Guard',
                      icon: Zap,
                      desc: `Detects vertical video on unknown sites. ${stats.perPlatform.other ?? 0} stopped.`,
                      color: 'text-indigo-700',
                      bg: 'bg-indigo-50',
                    },
                  ].map((rule) => {
                    const enabled = settings.rules[rule.key];
                    return (
                      <div
                        key={rule.name}
                        className="flex items-center justify-between py-4 group transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 ${rule.bg} ${rule.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105`}
                          >
                            <rule.icon className="w-6 h-6" />
                          </div>
                          <div className="max-w-[180px]">
                            <p className="text-sm font-bold text-slate-900">{rule.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{rule.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleRule(rule.key)}
                          className={`w-12 h-7 rounded-full relative flex items-center px-1 shadow-inner cursor-pointer transition ${
                            enabled ? 'bg-brand-primary' : 'bg-slate-200'
                          }`}
                          aria-label={`Toggle ${rule.name}`}
                        >
                          <motion.div
                            animate={{ x: enabled ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="w-5 h-5 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Active Schedule</h2>
                <button
                  onClick={toggleScheduleEnabled}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                    settings.schedule.enabled
                      ? 'bg-brand-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {settings.schedule.enabled ? 'On' : 'Off'}
                </button>
              </div>

              <div className="sleek-card p-8 space-y-8 relative overflow-hidden">
                <div className="flex items-start gap-5 relative z-10">
                  <div className="shrink-0 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <Calendar className="w-7 h-7 text-brand-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900">Deep Work Hours</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {formatTime(settings.schedule.startMinutes)} —{' '}
                      {formatTime(settings.schedule.endMinutes)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {DAY_LABELS.map((label, idx) => {
                    const active = settings.schedule.days.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleScheduleDay(idx)}
                        className={`w-9 h-9 rounded-full text-[11px] font-bold transition ${
                          active
                            ? 'bg-brand-primary text-white shadow'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <TimeField
                    label="Start"
                    minutes={settings.schedule.startMinutes}
                    onChange={(m) => updateScheduleTime('startMinutes', m)}
                  />
                  <TimeField
                    label="End"
                    minutes={settings.schedule.endMinutes}
                    onChange={(m) => updateScheduleTime('endMinutes', m)}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-brand-surface rounded-2xl border border-slate-100">
                  <Sparkles className="w-4 h-4 text-brand-primary shrink-0" />
                  <p className="text-[11px] text-slate-600 italic font-medium leading-tight">
                    {scheduleActive
                      ? 'Schedule is active right now. Strict rules are enforced automatically.'
                      : 'Strict rules will activate automatically during your scheduled hours.'}
                  </p>
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  Times shown in your browser timezone · {tz}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'whitelist' && (
            <motion.div
              key="whitelist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">Whitelist</h2>
                <p className="text-slate-500 text-xs">Manage sites that bypass all blocking rules.</p>
              </div>

              <form onSubmit={addToWhitelist} className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  Add Exception
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="example.com or sub.example.com/path"
                    className="w-full h-12 bg-white border border-brand-outline-variant rounded-2xl pl-11 pr-12 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  />
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all"
                    aria-label="Add to whitelist"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Active Exceptions
                  </h3>
                  <span className="text-[10px] font-bold text-brand-primary bg-indigo-50 px-2 py-0.5 rounded-lg">
                    {settings.whitelist.length} TOTAL
                  </span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {settings.whitelist.map((url) => (
                      <motion.div
                        key={url}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="sleek-card p-4 flex items-center justify-between group hover:border-brand-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 text-brand-primary" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 truncate">{url}</span>
                        </div>
                        <button
                          onClick={() => removeFromWhitelist(url)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          aria-label={`Remove ${url}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {settings.whitelist.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-40">
                      <ShieldCheck className="w-12 h-12 text-slate-200" />
                      <p className="text-xs font-semibold text-slate-400">No whitelisted sites yet</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <Check className="w-4 h-4 animate-pulse" /> Syncing
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[360px] h-20 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-40">
        <NavButton active={activeTab === 'focus'} onClick={() => setActiveTab('focus')} icon={Zap} label="Focus" />
        <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={BarChart3} label="Stats" />
        <NavButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={Calendar} label="Schedule" />
        <NavButton active={activeTab === 'whitelist'} onClick={() => setActiveTab('whitelist')} icon={ShieldCheck} label="Allow" />
      </nav>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}
function NavButton({ active, onClick, icon: Icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
        active ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <div className={`p-2 px-4 rounded-2xl transition-all ${active ? 'bg-indigo-50' : ''}`}>
        <Icon className={`w-5 h-5 ${active ? 'fill-brand-primary/20' : ''}`} />
      </div>
      <span className="text-[9px] font-extrabold uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}

interface TimeFieldProps {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
}
function TimeField({ label, minutes, onChange }: TimeFieldProps) {
  const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => {
          const [h, m] = e.target.value.split(':').map(Number);
          if (!Number.isFinite(h) || !Number.isFinite(m)) return;
          onChange(h * 60 + m);
        }}
        className="bg-white border border-brand-outline-variant rounded-xl h-11 px-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition"
      />
    </label>
  );
}

function sanitizeDomain(input: string): string {
  let value = input.trim().toLowerCase();
  if (!value) return '';
  // Strip protocol if present
  value = value.replace(/^https?:\/\//, '');
  // Strip leading www. for consistency
  value = value.replace(/^www\./, '');
  return value;
}

