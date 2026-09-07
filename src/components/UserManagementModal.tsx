import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Users, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onAddUser: (newUser: User) => void;
  onDeleteUser: (username: string) => void;
  currentUser: User;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onDeleteUser,
  currentUser,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedUsername || !trimmedPassword) {
      setError('لطفاً تمامی فیلدها را پر کنید.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('نام کاربری باید حداقل ۳ کاراکتر باشد.');
      return;
    }

    if (trimmedPassword.length < 4) {
      setError('رمز عبور باید حداقل ۴ کاراکتر باشد.');
      return;
    }

    // Check duplicate
    if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      setError('این نام کاربری از قبل موجود است.');
      return;
    }

    onAddUser({
      name: trimmedName,
      username: trimmedUsername,
      password: trimmedPassword,
    });

    setSuccess(`کاربر جدید با موفقیت اضافه شد.`);
    setName('');
    setUsername('');
    setPassword('');

    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">مدیریت کاربران سامانه</h3>
              <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">افزودن کاربر جدید یا مشاهده لیست حساب‌ها</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Col: Form to Add User */}
            <div className="md:col-span-5 border-b md:border-b-0 md:border-l border-stone-100 dark:border-zinc-800/80 pb-6 md:pb-0 md:pl-6 space-y-4">
              <h4 className="text-xs font-black text-stone-900 dark:text-zinc-200 flex items-center gap-1.5 mb-2">
                <UserPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>افزودن کاربر جدید</span>
              </h4>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 mb-1.5">
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: امیررضا"
                    className="w-full text-right px-3.5 py-2 text-xs bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700/80 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-stone-900 dark:text-zinc-100 placeholder-stone-400 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 mb-1.5">
                    نام کاربری (انگلیسی)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: amir2"
                    className="w-full text-left px-3.5 py-2 text-xs bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700/80 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-stone-900 dark:text-zinc-100 placeholder-stone-400 transition-all outline-none"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 mb-1.5">
                    رمز عبور
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز ورود دلخواه"
                    className="w-full text-left px-3.5 py-2 text-xs bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700/80 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-stone-900 dark:text-zinc-100 placeholder-stone-400 transition-all outline-none"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  افزودن به کاربران
                </button>
              </form>
            </div>

            {/* Right Col: Users List */}
            <div className="md:col-span-7 space-y-4">
              <h4 className="text-xs font-black text-stone-900 dark:text-zinc-200 flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>کاربران فعال ({users.length} نفر)</span>
              </h4>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {users.map((user) => {
                  const isSelf = user.username.toLowerCase() === currentUser.username.toLowerCase();
                  const isAmirDefault = user.username.toLowerCase() === 'amir';
                  return (
                    <div
                      key={user.username}
                      className="p-3.5 bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                            {user.name}
                          </span>
                          {isSelf && (
                            <span className="bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[9px] px-1.5 py-0.5 rounded font-bold">
                              خود شما
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 dark:text-zinc-500 mt-1 flex gap-2" style={{ direction: 'ltr' }}>
                          <span>@{user.username}</span>
                          <span>•</span>
                          <span>pass: {user.password}</span>
                        </div>
                      </div>

                      {/* Delete Action (cannot delete self, and optional restriction for default amir admin to prevent locking) */}
                      {!isSelf && !isAmirDefault && (
                        <button
                          onClick={() => {
                            if (confirm(`آیا از حذف کاربر "${user.name}" مطمئن هستید؟ با این کار تمام داده‌های برنامه‌ریزی این کاربر پاک می‌شود.`)) {
                              onDeleteUser(user.username);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="حذف کاربر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-zinc-800/20 border-t border-stone-100 dark:border-zinc-800/80 text-center text-[10px] text-stone-400 dark:text-zinc-500">
          داده‌های هر کاربر به طور مستقل در حافظه مرورگر محلی به صورت امن نگهداری می‌شود.
        </div>
      </motion.div>
    </div>
  );
};
