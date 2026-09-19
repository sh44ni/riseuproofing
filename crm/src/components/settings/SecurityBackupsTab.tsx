import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Laptop,
  Tablet,
  History,
  HardDrive,
  Download,
  RotateCw,
  Trash2,
  CheckCircle2,
  Key,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { SecuritySession, AuditLogEntry } from '@/types/settingsTypes';

interface SecurityBackupsTabProps {
  sessions: SecuritySession[];
  auditLogs: AuditLogEntry[];
  onRevokeSession: (id: string) => void;
  onCreateBackup: () => void;
}

export function SecurityBackupsTab({
  sessions,
  auditLogs,
  onRevokeSession,
  onCreateBackup,
}: SecurityBackupsTabProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const handleCreateSnapshot = () => {
    setIsBackingUp(true);
    onCreateBackup();
    setTimeout(() => {
      setIsBackingUp(false);
      setBackupSuccess(true);
      setTimeout(() => {
        setBackupSuccess(false);
      }, 3000);
    }, 1200);
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('macbook') || device.toLowerCase().includes('pc')) {
      return Laptop;
    }
    if (device.toLowerCase().includes('ipad')) {
      return Tablet;
    }
    return Smartphone;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ================================================================
          SECTION 1: 2FA & AUTH POLICIES
          ================================================================ */}
      <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-indigo-500/20 text-purple-700 flex items-center justify-center border border-purple-300/40">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Two-Factor Authentication & Identity Policies</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
                  Grade A+ Active
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Security controls protecting homeowner contracts, employee SSNs, and banking credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                2FA Enforcement
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Mandatory
              </span>
            </div>
            <p className="text-slate-600 font-medium">
              Enforced for all Owners, Estimators, and Administrators.
            </p>
            <div className="text-[10px] text-slate-400">
              Supported via Google Authenticator, 1Password, or SMS.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Session Auto-Timeout
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                8 Hours
              </span>
            </div>
            <p className="text-slate-600 font-medium">
              Inactivity locks sessions to protect jobsite field tablets.
            </p>
            <div className="text-[10px] text-slate-400">
              Requires biometric or PIN re-authentication.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Hashing Standard
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Argon2id
              </span>
            </div>
            <p className="text-slate-600 font-medium">
              OWASP 2026 recommended memory-hard key derivation.
            </p>
            <div className="text-[10px] text-slate-400">
              64MB memory cost, 3 passes, 4 parallel threads.
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 2: ACTIVE DEVICE SESSIONS
          ================================================================ */}
      <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active Authorized Device Sessions
            </h3>
            <p className="text-[11px] text-slate-500">
              Laptops, tablets, and phones currently logged into your Rise Up CRM instance.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {sessions.length} Active Devices
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {sessions.map((sess) => {
            const Icon = getDeviceIcon(sess.device);

            return (
              <div
                key={sess.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-[#1878B8] flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {sess.device}
                      </span>
                      {sess.isCurrent && (
                        <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {sess.browser} • {sess.ip} • {sess.location}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {sess.lastActive}
                  </span>
                  {!sess.isCurrent && (
                    <button
                      onClick={() => onRevokeSession(sess.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================
          SECTION 3: CLOUD DATABASE BACKUPS & AUDIT TRAIL
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Automated Backups */}
        <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-[#1878B8] flex items-center justify-center border border-blue-300/40">
                <HardDrive size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Automated Database Backups
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daily off-site snapshots stored on AWS S3 Glacier (AES-256).
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Schedule:</span>
              <span className="font-bold text-slate-800">Daily at 02:00 AM PST</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Last Snapshot Size:</span>
              <span className="font-mono font-bold text-slate-800">284.6 MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Retention Policy:</span>
              <span className="font-bold text-emerald-600">30 Daily + 12 Monthly</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Encryption:</span>
              <span className="font-bold text-purple-700">AES-256-GCM Encrypted</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleCreateSnapshot}
              disabled={isBackingUp}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
                backupSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {backupSuccess ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Snapshot Created Successfully!</span>
                </>
              ) : isBackingUp ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>Archiving PostgreSQL Snapshot...</span>
                </>
              ) : (
                <>
                  <HardDrive size={14} />
                  <span>Create Manual Snapshot Now</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                alert('Downloading latest encrypted backup snapshot (284 MB)...');
              }}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Download Encrypted SQL Dump"
            >
              <Download size={14} />
              <span>Download Dump</span>
            </button>
          </div>
        </div>

        {/* Immutable Audit Log */}
        <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-700 flex items-center justify-center border border-purple-300/40">
                <History size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Immutable Security Audit Trail
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cryptographically timestamped log of administrative actions.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Live Stream
            </span>
          </div>

          <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center border border-slate-200">
                      {log.userInitials}
                    </span>
                    <span className="font-bold text-slate-900">{log.user}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {log.action}
                </p>
                <div className="text-[9px] text-slate-400 font-mono">
                  IP: {log.ip} • Category: {log.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
