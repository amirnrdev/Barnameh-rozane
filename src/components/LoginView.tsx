import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (matchedUser && matchedUser.password === password) {
      onLoginSuccess(matchedUser);
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0e1015] px-4 py-12 transition-colors duration-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl p-8 shadow-xl relative overflow-hidden"
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-600" />

        {/* Logo and Headings */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-stone-900 dark:text-zinc-100">سامانه برنامه‌ریز درسی</h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-2 text-center leading-relaxed">
            جهت دسترسی به برنامه درسی و تحلیل عملکرد خود وارد حساب کاربری شوید.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-2">
              نام کاربری
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400 dark:text-zinc-500">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: amir"
                className="w-full text-left pr-10 pl-4 py-3 text-sm bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-stone-900 dark:text-zinc-100 placeholder-stone-400 transition-all outline-none"
                style={{ direction: 'ltr' }}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-2">
              رمز عبور
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400 dark:text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-left pr-10 pl-4 py-3 text-sm bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-stone-900 dark:text-zinc-100 placeholder-stone-400 transition-all outline-none"
                style={{ direction: 'ltr' }}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>ورود به حساب</span>
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-stone-100 dark:border-zinc-800/80 text-center">
          <p className="text-[10px] text-stone-400 dark:text-zinc-500">
            نام کاربری پیش‌فرض: <code className="bg-stone-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-teal-600 dark:text-teal-400">amir</code> و رمز عبور: <code className="bg-stone-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-teal-600 dark:text-teal-400">8383</code>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
