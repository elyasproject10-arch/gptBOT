import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  FileDown
} from 'lucide-react';
import { pythonProjectFiles, CodeFile } from '../data/pythonCodeRepository';
import { downloadReadmeAsWordDoc } from '../utils/wordExport';

interface CodeExplorerViewProps {
  onDownloadZip: () => void;
}

export const CodeExplorerView: React.FC<CodeExplorerViewProps> = ({ onDownloadZip }) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(pythonProjectFiles[0]);
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'Root': true,
    'config': true,
    'store': true,
    'bot': true,
    'scheduler': true
  });

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group files by folder
  const folders = Array.from(new Set(pythonProjectFiles.map(f => f.folder)));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 mb-2">
            <FileCode className="w-3.5 h-3.5" />
            پروژه آماده استقرار پایتون و جنگو (Ready-to-Deploy)
          </div>
          <h2 className="text-xl font-bold text-white">
            مرکز سورس‌کدها، ساختار فایل‌ها و راهنمای راه‌اندازی
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            تمامی کدهای ماژول‌های جنگو، هاندلرهای همزمان ربات تلگرام و بله، درگاه پیپینگ و کرون‌جاب هوشمند با قابلیت کپی فوری و دانلود یکجای پروژه.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadReadmeAsWordDoc}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 font-bold text-xs shadow-lg cursor-pointer transition whitespace-nowrap"
            title="دانلود فایل راهنمای فارسی با فرمت قابل بازگشایی در مایکروسافت ورد"
          >
            <FileDown className="w-4 h-4 text-blue-400" />
            دانلود راهنما (فایل Word / DOC)
          </button>

          <button
            onClick={onDownloadZip}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer transition whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            دانلود کل پروژه به صورت ZIP
          </button>
        </div>
      </div>

      {/* Main File Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: File Tree */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-400" />
              subscription_project /
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {pythonProjectFiles.length} فایل
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {folders.map(folder => {
              const filesInFolder = pythonProjectFiles.filter(f => f.folder === folder);
              const isExpanded = expandedFolders[folder] ?? true;

              return (
                <div key={folder} className="space-y-1">
                  {folder !== 'Root' ? (
                    <button
                      onClick={() => toggleFolder(folder)}
                      className="w-full text-right flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-800/60 text-slate-300 font-semibold cursor-pointer text-xs"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      {isExpanded ? <FolderOpen className="w-4 h-4 text-sky-400" /> : <Folder className="w-4 h-4 text-sky-400" />}
                      <span className="font-mono text-slate-200">{folder}/</span>
                    </button>
                  ) : null}

                  {(folder === 'Root' || isExpanded) && (
                    <div className={folder !== 'Root' ? 'pr-5 space-y-1' : 'space-y-1'}>
                      {filesInFolder.map(file => {
                        const isSelected = selectedFile.path === file.path;
                        return (
                          <button
                            key={file.path}
                            onClick={() => setSelectedFile(file)}
                            className={`w-full text-right flex items-center justify-between py-1.5 px-2.5 rounded-lg transition cursor-pointer text-xs font-mono ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {file.filename.endsWith('.py') ? (
                                <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-400'}`} />
                              ) : (
                                <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                              )}
                              <span className="truncate">{file.filename}</span>
                            </div>

                            <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                              {file.language}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* File Header Bar */}
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white">
                  {selectedFile.path}
                </span>
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedFile.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد!' : 'کپی کد'}</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Body */}
          <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[560px] overflow-y-auto leading-relaxed" dir="ltr">
            <pre>
              <code>
                {selectedFile.content.split('\n').map((line, i) => (
                  <div key={i} className="table-row hover:bg-slate-900/60">
                    <span className="table-cell select-none pr-4 text-slate-600 text-right w-10 text-[11px]">
                      {i + 1}
                    </span>
                    <span className="table-cell whitespace-pre font-mono">
                      {line}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Step-by-Step Laptop Setup Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          راهنمای تست محلی و راه‌اندازی گام به گام روی لپ‌تاپ / سرور
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">۱</span>
              نصب نیازمندی‌ها
            </div>
            <p className="text-slate-400 leading-relaxed">
              ساخت محیط مجازی پایتون و نصب پکیج‌های ضروری با pip:
            </p>
            <div className="p-2 rounded bg-slate-900 text-sky-300 font-mono text-[11px]" dir="ltr">
              pip install -r requirements.txt
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">۲</span>
              دیتابیس و سوپریوزر جنگو
            </div>
            <p className="text-slate-400 leading-relaxed">
              ایجاد جداول و ساخت کاربر ادمین جهت ورود به پنل:
            </p>
            <div className="p-2 rounded bg-slate-900 text-sky-300 font-mono text-[11px]" dir="ltr">
              python manage.py migrate<br/>
              python manage.py createsuperuser
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">۳</span>
              اتصال درگاه پیپینگ با Ngrok
            </div>
            <p className="text-slate-400 leading-relaxed">
              پورت ۸۰۰۰ را پابلیک کنید و آدرس https را در .env بگذارید:
            </p>
            <div className="p-2 rounded bg-slate-900 text-sky-300 font-mono text-[11px]" dir="ltr">
              ngrok http 8000
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">۴</span>
              اجرای سرور وب جنگو
            </div>
            <p className="text-slate-400 leading-relaxed">
              ورود به آدرس localhost:8000/admin و تعریف محصولات و پلن‌ها:
            </p>
            <div className="p-2 rounded bg-slate-900 text-sky-300 font-mono text-[11px]" dir="ltr">
              python manage.py runserver
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">۵</span>
              اجرای همزمان ربات‌های تلگرام و بله
            </div>
            <p className="text-slate-400 leading-relaxed">
              اتصال همزمان هر دو پیام‌رسان به دیتابیس مشترک جنگو:
            </p>
            <div className="p-2 rounded bg-slate-900 text-sky-300 font-mono text-[11px]" dir="ltr">
              python bot/bot_runner.py
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">۶</span>
              اجرای کرون‌جاب روزانه
            </div>
            <p className="text-slate-400 leading-relaxed">
              بررسی اشتراک‌ها و ارسال اعلان‌های ۵ روزه، ۳ روزه و اخطار ۲ روزه:
            </p>
            <div className="p-2 rounded bg-slate-900 text-sky-300 font-mono text-[11px]" dir="ltr">
              python scheduler/daily_jobs.py
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
