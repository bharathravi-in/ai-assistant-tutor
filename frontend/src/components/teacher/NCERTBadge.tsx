import React from 'react'
import { CheckCircle, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react'
import { AuditResult } from '../../types'

interface NCERTBadgeProps {
    audit?: AuditResult
    isLoading?: boolean
}

export default function NCERTBadge({ audit, isLoading }: NCERTBadgeProps) {
    if (isLoading) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse border border-gray-200 dark:border-gray-700">
                <div className="w-4 h-4 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
                <span className="text-xs font-medium text-gray-500">Auditing Compliance...</span>
            </div>
        )
    }

    if (!audit) return null

    const isCompliant = audit.is_compliant
    const score = audit.compliance_score

    const getStatusColors = () => {
        if (isCompliant && score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
        if (isCompliant) return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
    }

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-300 shadow-sm ${getStatusColors()}`}>
            {isCompliant ? (
                score >= 80 ? <ShieldCheck className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />
            ) : (
                <AlertCircle className="w-5 h-5" />
            )}
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">NCERT Auditor</span>
                    <span className="text-[10px] opacity-70 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10">{score}/100</span>
                </div>
                <span className="text-[10px] font-medium leading-none">
                    {isCompliant ? 'Curriculum Compliant' : 'Optimization Suggested'}
                </span>
            </div>

            {/* Tooltip-like section for info (simplified for now) */}
            <div className="ml-2 pl-2 border-l border-current/20 group relative cursor-help">
                <HelpCircle className="w-3.5 h-3.5 opacity-50" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-2">
                        {audit.ncert_ref || "Alignment based on NCF 2023 guidelines."}
                    </p>
                    {audit.weaknesses.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Focus Areas:</p>
                            {audit.weaknesses.slice(0, 2).map((w, i) => (
                                <p key={i} className="text-[10px] text-amber-600 dark:text-amber-400">• {w}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
