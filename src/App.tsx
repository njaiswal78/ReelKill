/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Timer, 
  Settings, 
  Zap, 
  BarChart3, 
  Calendar, 
  ExternalLink, 
  Sparkles,
  Camera,
  PlayCircle,
  Music,
  Check,
  ShieldCheck,
  Plus,
  Trash2,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'focus' | 'stats' | 'schedule' | 'whitelist';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('focus');
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [whitelist, setWhitelist] = useState<string[]>(['educational-resource.org', 'vimeo.com/portfolios']);
  const [newUrl, setNewUrl] = useState('');

  const addToWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim() && !whitelist.includes(newUrl.trim())) {
      setWhitelist([newUrl.trim(), ...whitelist]);
      setNewUrl('');
    }
  };

  const removeFromWhitelist = (url: string) => {
    setWhitelist(whitelist.filter(item => item !== url));
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-surface max-w-[360px] mx-auto shadow-2xl relative overflow-hidden ring-1 ring-brand-outline-variant">
      {/* Top Header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[360px] h-20 bg-white border-b border-brand-outline-variant flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Timer className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            FocusShield <span className="text-brand-primary">Pro</span>
          </h1>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
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
                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-success" />
                  </span>
                  Protection Active
                </div>
              </div>

              {/* Central Toggle Card */}
              <div className="bg-brand-primary p-8 rounded-4xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Strict Mode</h2>
                    <p className="text-indigo-100 text-xs leading-relaxed opacity-90">Aggressively wipes all 9:16 containers from feeds globally.</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/20">
                    <span className="font-bold text-sm">Global Toggle</span>
                    <button 
                      onClick={() => setIsSessionActive(!isSessionActive)}
                      className="w-12 h-6 bg-white rounded-full relative flex items-center px-1"
                    >
                      <motion.div 
                        animate={{ x: isSessionActive ? 24 : 0 }}
                        className="w-4 h-4 bg-brand-primary rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <Timer size={160} className="stroke-[1]" />
                </div>
              </div>

              {/* Bento Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="sleek-card p-6 flex flex-col gap-1">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Time Saved</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">42<span className="text-sm ml-1 text-slate-400">min</span></h3>
                </div>
                <div className="sleek-card p-6 flex flex-col gap-1">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Efficiency</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">88<span className="text-sm ml-1 text-slate-400">%</span></h3>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-4 pt-2">
                <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]">
                  <span>Open Dashboard</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">v4.2.1-stable • Engine Build 892</span>
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
                <h2 className="text-xl font-bold tracking-tight">Focus Statistics</h2>
                <p className="text-slate-500 text-xs">Your contribution to digital hygiene.</p>
              </div>

              <div className="sleek-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em]">Digital Cleanse</p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">1,428</p>
                    <p className="text-[10px] font-bold text-slate-500">Short-form videos intercepted</p>
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-bold text-brand-primary">AI Enabled</div>
                </div>

                {/* Progress Bar Style Chart */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">Weekly Goal</span>
                    <span className="text-brand-primary">72% reached</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div className="w-[72%] h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-50">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <span key={i} className={`text-[10px] font-bold ${day === 'T' ? 'text-brand-primary' : 'text-slate-300'}`}>{day}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Platform Filtering</h3>
                  <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600">4 ACTIVE</div>
                </div>
                <div className="space-y-3 divide-y divide-slate-50">
                  {[
                    { name: 'YouTube Shorts', icon: PlayCircle, desc: 'Blocks player and related suggestions.', color: 'text-red-600', bg: 'bg-red-50' },
                    { name: 'Instagram Reels', icon: Camera, desc: 'Redirects Reels tab to main feed.', color: 'text-pink-600', bg: 'bg-pink-50' },
                    { name: '9:16 Guard', icon: Zap, desc: 'Detects vertical video on unknown sites.', color: 'text-slate-900', bg: 'bg-slate-100' }
                  ].map((rule) => (
                    <div key={rule.name} className="flex items-center justify-between py-4 group transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${rule.bg} ${rule.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105`}>
                          <rule.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{rule.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{rule.desc}</p>
                        </div>
                      </div>
                      <div className="w-12 h-7 bg-brand-primary rounded-full relative flex items-center px-1 shadow-inner cursor-pointer">
                        <div className="w-5 h-5 bg-white rounded-full ml-auto shadow-sm" />
                      </div>
                    </div>
                  ))}
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
                <button className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all">Edit</button>
              </div>

              <div className="sleek-card p-8 space-y-8 relative overflow-hidden">
                <div className="flex items-start gap-5 relative z-10">
                  <div className="shrink-0 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <Calendar className="w-7 h-7 text-brand-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900">Deep Work Hours</p>
                    <p className="text-xs text-slate-500 font-medium">Mon - Fri • 09:00 — 17:00</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                    <div className="absolute left-[10%] right-[30%] h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.2)]" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    <span>08:00 AM</span>
                    <span>06:00 PM</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-brand-surface rounded-2xl border border-slate-100">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                  <p className="text-[11px] text-slate-600 italic font-medium leading-tight">Focus mode activates automatically based on your deep work protocol.</p>
                </div>
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Add Exception</p>
                <div className="relative">
                  <input 
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Enter URL or domain..."
                    className="w-full h-12 bg-white border border-brand-outline-variant rounded-2xl pl-11 pr-4 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  />
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Exceptions</h3>
                  <span className="text-[10px] font-bold text-brand-primary bg-indigo-50 px-2 py-0.5 rounded-lg">{whitelist.length} TOTAL</span>
                </div>
                
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {whitelist.map((url) => (
                      <motion.div
                        key={url}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="sleek-card p-4 flex items-center justify-between group hover:border-brand-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-brand-primary" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{url}</span>
                        </div>
                        <button 
                          onClick={() => removeFromWhitelist(url)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {whitelist.length === 0 && (
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
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[360px] h-20 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-40">
        <button 
          onClick={() => setActiveTab('focus')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'focus' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 px-4 rounded-2xl transition-all ${activeTab === 'focus' ? 'bg-indigo-50' : ''}`}>
            <Zap className={`w-5 h-5 ${activeTab === 'focus' ? 'fill-brand-primary/20' : ''}`} />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em]">Focus</span>
        </button>

        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'stats' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 px-4 rounded-2xl transition-all ${activeTab === 'stats' ? 'bg-indigo-50' : ''}`}>
            <BarChart3 className={`w-5 h-5 ${activeTab === 'stats' ? 'fill-brand-primary/20' : ''}`} />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em]">Stats</span>
        </button>

        <button 
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'schedule' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 px-4 rounded-2xl transition-all ${activeTab === 'schedule' ? 'bg-indigo-50' : ''}`}>
            <Calendar className={`w-5 h-5 ${activeTab === 'schedule' ? 'fill-brand-primary/20' : ''}`} />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em]">Schedule</span>
        </button>

        <button 
          onClick={() => setActiveTab('whitelist')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'whitelist' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 px-4 rounded-2xl transition-all ${activeTab === 'whitelist' ? 'bg-indigo-50' : ''}`}>
            <ShieldCheck className={`w-5 h-5 ${activeTab === 'whitelist' ? 'fill-brand-primary/20' : ''}`} />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em]">Allow</span>
        </button>
      </nav>
    </div>
  );
}
