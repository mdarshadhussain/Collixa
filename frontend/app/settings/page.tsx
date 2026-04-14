'use client'

import { useState } from 'react'
import { ChevronLeft, Bell, Lock, User, Shield, LogOut, Camera, Globe, Mail, MapPin } from 'lucide-react'
import Header from '@/components/Header'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import Avatar from '@/components/Avatar'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile')
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    title: 'Full Stack Developer',
    location: 'San Francisco, CA',
    bio: 'Passionate about building amazing products',
    hourlyRate: '$85',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newMessages: true,
    newApplications: true,
    weeklyDigest: true,
    marketingEmails: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (key: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  return (
    <div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen transition-colors duration-700 font-sans">
      <Header />

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-[var(--color-border)] pb-12">
          <div className="space-y-4">
             <button 
               onClick={() => window.history.back()}
               className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all mb-4"
             >
               <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
               Return
             </button>
             <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter italic">Preferences.</h1>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">Refining Your Digital Root</p>
          </div>
          <div className="flex items-center gap-6">
             <div className="px-6 py-3 bg-[var(--color-accent-soft)] rounded-full border border-[var(--color-accent)]/20 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)]">Account Status: Synchronized</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <nav className="space-y-4 sticky top-32">
              {[
                { id: 'profile', label: 'Persona', icon: User },
                { id: 'notifications', label: 'Emissions', icon: Bell },
                { id: 'security', label: 'Vault', icon: Lock },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-8 py-5 rounded-[1.5rem] transition-all duration-500 group relative overflow-hidden ${
                    activeTab === item.id
                      ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-xl shadow-[var(--color-accent)]/10'
                      : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-soft)]'
                  }`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <item.icon size={20} className={activeTab === item.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 transition-opacity'} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">{item.label}</span>
                  </div>
                  {activeTab === item.id && (
                     <div className="w-2 h-2 bg-white rounded-full relative z-10" />
                  )}
                </button>
              ))}

              <div className="pt-8 border-t border-[var(--color-border)] mt-12">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full flex items-center gap-4 px-8 py-5 rounded-[1.5rem] bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-500 font-black uppercase text-[10px] tracking-[0.3em]"
                >
                  <LogOut size={20} />
                  Terminate Session
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content Pane */}
          <div className="lg:col-span-9 space-y-12">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Avatar Section */}
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-12 rounded-[3rem] relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="relative group">
                      <Avatar name="John Doe" size="xl" className="ring-8 ring-[var(--color-accent-soft)] shadow-2xl transition-all group-hover:scale-105" />
                      <button className="absolute bottom-2 right-2 p-3 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-full shadow-xl hover:scale-110 transition-transform">
                         <Camera size={18} />
                      </button>
                    </div>
                    <div className="text-center md:text-left">
                      <h2 className="text-3xl font-serif font-black mb-2 tracking-tight">Visual Identity</h2>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-text-secondary)] mb-8">Persona Branding & Assets</p>
                      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                         <button className="px-10 py-4 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[var(--color-text-primary)] transition-all shadow-xl shadow-[var(--color-accent)]/20">
                            Upload Revision
                         </button>
                         <button className="px-10 py-4 border border-[var(--color-border)] text-[var(--color-text-primary)] text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[var(--color-accent-soft)]/20 transition-all">
                            Purge Asset
                         </button>
                      </div>
                      <p className="text-[10px] italic text-[var(--color-text-secondary)] mt-6 opacity-60">High-fidelity formats supported (Max 10MB)</p>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-12 rounded-[3rem]">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] mb-12">Core Specifications</h2>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Input
                      label="Full Identity"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Communication Node"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Professional Designation"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Geographic Anchor"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-secondary)] mb-4 ml-2">
                        Narrative Brief (Bio)
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-8 py-6 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[2rem] text-sm font-medium focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition-all placeholder:text-[var(--color-text-secondary)]/30 text-[var(--color-text-primary)]"
                      />
                    </div>
                    <Input
                      label="Economic Valuation"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                    />

                    <div className="md:col-span-2 pt-8">
                      <button className="px-16 py-6 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[11px] font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-[var(--color-text-primary)] transition-all shadow-2xl shadow-[var(--color-accent)]/20">
                        Synchronize Preferences
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-12 rounded-[3rem] animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] mb-12">Emission Protocols</h2>
                <div className="space-y-6">
                  {[
                    {
                      key: 'emailNotifications',
                      label: 'Direct Communication Archive',
                      description: 'Critical updates relayed via encrypted email',
                    },
                    {
                      key: 'pushNotifications',
                      label: 'Real-time Frequency Bursts',
                      description: 'Immediate browser-level status injections',
                    },
                    {
                      key: 'newMessages',
                      label: 'Dialogue Alerts',
                      description: 'Notification of incoming peer synchronization',
                    },
                    {
                      key: 'newApplications',
                      label: 'Intent Alignment Pings',
                      description: 'Alerts when peers converge on your mandates',
                    },
                    {
                      key: 'weeklyDigest',
                      label: 'Temporal Manifest',
                      description: 'Condensed weekly retrospective of activity',
                    },
                  ].map((setting) => (
                    <label
                      key={setting.key}
                      className="group flex items-center justify-between p-8 rounded-[2rem] bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <p className="text-sm font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{setting.label}</p>
                        <p className="text-[10px] font-medium text-[var(--color-text-secondary)] mt-1 tracking-wide opacity-70">{setting.description}</p>
                      </div>
                      <div className="relative z-10">
                        <input
                          type="checkbox"
                          checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                          onChange={() => handleNotificationChange(setting.key)}
                          className="w-8 h-8 rounded-xl border-2 border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] cursor-pointer bg-transparent transition-all checked:bg-[var(--color-accent)]"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent-soft)]/0 to-[var(--color-accent-soft)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </label>
                  ))}

                  <div className="pt-12">
                     <button className="px-16 py-6 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[11px] font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-[var(--color-text-primary)] transition-all shadow-2xl shadow-[var(--color-accent)]/20">
                        Commit Protocols
                     </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-12 rounded-[3rem]">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] mb-12 flex items-center gap-4">
                    <Shield size={20} className="text-[var(--color-accent)]" />
                    Access Credentials
                  </h2>
                  <form className="grid grid-cols-1 gap-10">
                    <Input
                      label="Current Authentication Root"
                      type="password"
                      placeholder="••••••••"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <Input
                          label="New Entropy Seed"
                          type="password"
                          placeholder="••••••••"
                        />
                        <Input
                          label="Verify Seed"
                          type="password"
                          placeholder="••••••••"
                        />
                    </div>
                    <div className="pt-8">
                       <button className="px-16 py-6 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[11px] font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-[var(--color-text-primary)] transition-all shadow-2xl shadow-[var(--color-accent)]/20">
                          Update Vault
                       </button>
                    </div>
                  </form>
                </div>

                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-12 rounded-[3rem] group">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-serif font-black tracking-tight group-hover:text-[var(--color-accent)] transition-colors">Dual-Entropy Authentication</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-secondary)] mt-2">Enhanced Security Persistence</p>
                      </div>
                      <button className="px-8 py-4 border-2 border-[var(--color-accent)] text-[var(--color-accent)] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[var(--color-accent-soft)] transition-all">
                         Initialize 2FA
                      </button>
                   </div>
                   <p className="text-[11px] text-[var(--color-text-secondary)] leading-loose opacity-70">Inject a secondary layer of cryptographic validation to ensure absolute session integrity across all node access points.</p>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 p-12 rounded-[3rem]">
                   <h3 className="text-2xl font-serif font-black text-red-500 mb-4 italic">Total Dissolution.</h3>
                   <p className="text-sm font-medium text-red-500/80 mb-10 leading-relaxed">Account termination is irreversible. All intents, broadcasts, and reputation indices will be permanently purged from the collective registry.</p>
                   <button className="px-10 py-5 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20">
                      Purge Account Registry
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
