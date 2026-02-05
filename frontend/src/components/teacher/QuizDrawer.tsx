import React, { useState } from 'react'
import {
    X,
    CheckCircle2,
    Copy,
    Printer,
    RefreshCw,
    BrainCircuit,
    ChevronDown,
    ChevronUp,
    FileQuestion
} from 'lucide-react'

import type { Quiz } from '../../types'

interface QuizDrawerProps {
    isOpen: boolean
    onClose: () => void
    quiz: Quiz | null
    onRegenerate?: () => void
    isLoading?: boolean
}

const QuizDrawer: React.FC<QuizDrawerProps> = ({
    isOpen,
    onClose,
    quiz,
    onRegenerate,
    isLoading
}) => {
    const [expandedIds, setExpandedIds] = useState<number[]>([])
    const [showAnswers, setShowAnswers] = useState(false)

    if (!isOpen) return null

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleCopy = () => {
        if (!quiz) return
        const text = quiz.questions.map((q, i) => {
            let qText = `${i + 1}. ${q.question}\n`
            if (q.options) {
                qText += q.options.map((opt, idx) => `   ${String.fromCharCode(idx + 65)}) ${opt}`).join('\n') + '\n'
            }
            return qText
        }).join('\n')

        navigator.clipboard.writeText(`${quiz.title}\n${quiz.description}\n\n${text}`)
        alert('Assessment text copied (without answers)!')
    }

    const handlePrint = () => {
        if (!quiz) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to export PDF');
            return;
        }

        const questionsHtml = quiz.questions.map((q, idx) => {
            const options = q.options?.length ? q.options :
                q.type === 'true_false' ? ['True', 'False'] :
                    [];

            return `
                <div class="question-container">
                    <div class="question-header">
                        <span class="question-number">${idx + 1}</span>
                        <div class="question-meta">
                            <span class="question-type">${q.type.replace(/_/g, ' ')}</span>
                            <div class="question-text">${q.question}</div>
                        </div>
                    </div>
                    ${options.length > 0 ? `
                        <div class="options-grid">
                            ${options.map((opt, i) => `
                                <div class="option ${showAnswers && opt === q.answer ? 'correct' : ''}">
                                    <span class="option-label">${String.fromCharCode(65 + i)}</span>
                                    <span>${opt}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${showAnswers ? `
                        <div class="answer-section">
                            <div class="answer-label">Correct Answer</div>
                            <div class="answer-value">${q.answer}</div>
                            ${q.explanation ? `<div class="explanation"><em>${q.explanation}</em></div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${quiz.title}</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                        padding: 40px; 
                        color: #1a1a1a; 
                        line-height: 1.6;
                        background: white;
                    }
                    .header { border-bottom: 2px solid #2563EB; margin-bottom: 40px; padding-bottom: 20px; }
                    .header h1 { margin: 0 0 8px 0; color: #1a1a1a; font-size: 28px; }
                    .header p { margin: 0; color: #666; font-size: 16px; }
                    .question-container { 
                        margin-bottom: 30px; 
                        page-break-inside: avoid; 
                        border: 1px solid #e5e7eb; 
                        border-radius: 16px; 
                        padding: 24px;
                    }
                    .question-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
                    .question-number { 
                        background: #f3f4f6; 
                        width: 36px; 
                        height: 36px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        border-radius: 10px; 
                        font-weight: bold; 
                        flex-shrink: 0; 
                        color: #4b5563;
                    }
                    .question-type { 
                        font-size: 10px; 
                        text-transform: uppercase; 
                        font-weight: 800; 
                        background: #f3f4f6; 
                        padding: 4px 8px; 
                        border-radius: 6px; 
                        color: #6b7280; 
                        display: inline-block; 
                        margin-bottom: 8px;
                        letter-spacing: 0.05em;
                    }
                    .question-text { font-size: 18px; font-weight: 600; color: #111827; }
                    .options-grid { 
                        display: grid; 
                        grid-template-cols: 1fr 1fr; 
                        gap: 12px; 
                        margin-left: 52px; 
                    }
                    .option { 
                        padding: 12px 16px; 
                        border: 1px solid #f3f4f6; 
                        border-radius: 12px; 
                        font-size: 14px; 
                        display: flex; 
                        align-items: center; 
                        gap: 12px;
                        background: #f9fafb;
                    }
                    .option-label { 
                        width: 24px; 
                        height: 24px; 
                        border-radius: 50%; 
                        background: white;
                        border: 1px solid #e5e7eb; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        font-size: 11px; 
                        font-weight: bold;
                        flex-shrink: 0;
                    }
                    .correct { 
                        border-color: #10b981; 
                        background: #f0fdf4; 
                        color: #065f46;
                    }
                    .correct .option-label {
                        background: #10b981;
                        border-color: #10b981;
                        color: white;
                    }
                    .answer-section { 
                        margin-top: 20px; 
                        margin-left: 52px; 
                        padding: 20px; 
                        background: #f0fdf4; 
                        border: 1px solid #d1fae5; 
                        border-radius: 12px; 
                    }
                    .answer-label {
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        color: #059669;
                        margin-bottom: 4px;
                        letter-spacing: 0.05em;
                    }
                    .answer-value { font-size: 15px; font-weight: 700; color: #065f46; }
                    .explanation { margin-top: 8px; color: #047857; font-size: 13px; line-height: 1.5; }
                    
                    @media print {
                        body { padding: 0; }
                        .question-container { border: 1px solid #eee; break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${quiz.title}</h1>
                    <p>${quiz.description}</p>
                </div>
                <div class="questions">
                    ${questionsHtml}
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            window.onafterprint = () => window.close();
                            // Fallback for browsers that don't support onafterprint or if cancelled
                            setTimeout(() => {
                                if (!window.closed) window.close();
                            }, 1000);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }

    return (
        <div className="fixed inset-0 z-[60] overflow-hidden quiz-drawer-root">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-2xl transform transition-transform duration-500 ease-in-out">
                    <div className="h-full flex flex-col bg-slate-50 dark:bg-gray-950 shadow-2xl border-l border-white/10 overflow-hidden">

                        {/* Header */}
                        <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between no-print">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <BrainCircuit className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assessment Genie</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Perfect quizzes in seconds</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600 transition-colors uppercase tracking-wider">Show Answers</span>
                                    <div
                                        onClick={() => setShowAnswers(!showAnswers)}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${showAnswers ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${showAnswers ? 'translate-x-5' : ''}`} />
                                    </div>
                                </label>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar print-container">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin no-print" />
                                        <BrainCircuit className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse no-print" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse no-print">
                                        Generating your assessment questions...
                                    </p>
                                </div>
                            ) : quiz ? (
                                <div className="space-y-6 animate-slide-up">
                                    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{quiz.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{quiz.description}</p>
                                    </div>

                                    <div className="space-y-4">
                                        {quiz.questions.map((q, idx) => {
                                            // Handle missing options for specific types
                                            const options = q.options?.length ? q.options :
                                                q.type === 'true_false' ? ['True', 'False'] :
                                                    [];

                                            return (
                                                <div
                                                    key={q.id}
                                                    className={`group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md print:shadow-none print:border-gray-200 print:break-inside-avoid print:mb-8`}
                                                >
                                                    <div
                                                        className="p-5 cursor-pointer flex items-start gap-4"
                                                        onClick={() => toggleExpand(q.id)}
                                                    >
                                                        <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400 print:text-black">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 rounded print:text-black print:bg-gray-50">
                                                                    {q.type.replace(/_/g, ' ')}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-900 dark:text-white font-medium leading-relaxed print:text-black">
                                                                {q.question}
                                                            </p>
                                                        </div>
                                                        <div className="mt-1 no-print">
                                                            {expandedIds.includes(q.id) ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                                        </div>
                                                    </div>

                                                    {expandedIds.includes(q.id) && (
                                                        <div className="px-5 pb-5 pt-0 animate-fade-in">
                                                            <div className="pl-12 space-y-4 print:pl-8">
                                                                {options.length > 0 && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        {options.map((opt, i) => (
                                                                            <div
                                                                                key={i}
                                                                                className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${(showAnswers && opt === q.answer) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 print:bg-white print:border-gray-200 print:text-gray-700' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 print:bg-white print:text-black'}`}
                                                                            >
                                                                                <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-current flex items-center justify-center text-[10px] font-bold">
                                                                                    {String.fromCharCode(65 + i)}
                                                                                </span>
                                                                                {opt}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {showAnswers && (
                                                                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/10 no-print">
                                                                        <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                            <span className="text-xs font-bold uppercase tracking-wider">Correct Answer</span>
                                                                        </div>
                                                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                                                            {q.answer}
                                                                        </p>
                                                                        {q.explanation && (
                                                                            <p className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-400/80 italic">
                                                                                {q.explanation}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 no-print">
                                    <FileQuestion className="w-16 h-16 text-gray-400" />
                                    <p className="text-gray-500 dark:text-gray-400">No assessment content available.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-3 no-print">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCopy}
                                    disabled={!quiz || isLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                                >
                                    <Copy className="w-5 h-5" />
                                    Copy Text
                                </button>
                                <button
                                    onClick={handlePrint}
                                    disabled={!quiz || isLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                                >
                                    <Printer className="w-5 h-5" />
                                    Export PDF
                                </button>
                            </div>
                            <button
                                onClick={onRegenerate}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                Regenerate Assessment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuizDrawer
