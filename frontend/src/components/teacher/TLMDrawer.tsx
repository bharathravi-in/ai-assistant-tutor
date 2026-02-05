import React, { useState } from 'react'
import {
    X,
    Hammer,
    LayoutPanelTop,
    Printer,
    RefreshCw,
    Palette,
    ClipboardList,
    Image as ImageIcon,
    ExternalLink
} from 'lucide-react'

import type { TLM } from '../../types'

interface TLMDrawerProps {
    isOpen: boolean
    onClose: () => void
    tlm: TLM | null
    onRegenerate?: () => void
    isLoading?: boolean
}

const TLMDrawer: React.FC<TLMDrawerProps> = ({
    isOpen,
    onClose,
    tlm,
    onRegenerate,
    isLoading
}) => {
    const [activeTab, setActiveTab] = useState<'diy' | 'visual'>('diy')

    if (!isOpen) return null

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="fixed inset-0 z-[60] overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-2xl transform transition-transform duration-500 ease-in-out">
                    <div className="h-full flex flex-col bg-slate-50 dark:bg-gray-950 shadow-2xl border-l border-white/10 overflow-hidden">

                        {/* Header */}
                        <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Palette className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">TLM Designer</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Low-cost classroom aids</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex">
                            <button
                                onClick={() => setActiveTab('diy')}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'diy' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Hammer className="w-4 h-4" />
                                DIY Workshop
                            </button>
                            <button
                                onClick={() => setActiveTab('visual')}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'visual' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutPanelTop className="w-4 h-4" />
                                Visual Kit
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                        <Palette className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white font-bold">Designing your materials...</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Finding low-cost alternatives for your classroom</p>
                                    </div>
                                </div>
                            ) : tlm ? (
                                <div className="space-y-6 animate-slide-up print:bg-white print:text-black">
                                    {activeTab === 'diy' ? (
                                        <div className="space-y-6">
                                            {/* Physical Aid Section */}
                                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-blue-500/10 shadow-sm">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-blue-500/5 rounded-lg">
                                                        <ClipboardList className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tlm.diy_workshop.title}</h3>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 ml-1">Materials Needed</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {tlm.diy_workshop.materials.map((m, i) => (
                                                                <span key={i} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm border border-gray-100 dark:border-gray-800">
                                                                    {m}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 ml-1">Step-by-Step Guide</h4>
                                                        <div className="space-y-3">
                                                            {tlm.diy_workshop.steps.map((step, i) => (
                                                                <div key={i} className="flex gap-4 p-3 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                                                                    <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                                        {i + 1}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                                                        {step}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">💡 Classroom Usage Tip</h4>
                                                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                                            {tlm.diy_workshop.usage_tips}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {/* Flashcards Section */}
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 ml-1 flex items-center gap-2">
                                                    <ImageIcon className="w-5 h-5 text-blue-500" />
                                                    Flashcard Set
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {tlm.visual_kit.flashcards.map((card, i) => (
                                                        <div key={i} className="group perspective h-48">
                                                            <div className="relative w-full h-full text-center transition-transform duration-500 transform-style-3d group-hover:rotate-y-180">
                                                                {/* Front */}
                                                                <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-blue-500/20 flex flex-col items-center justify-center p-4">
                                                                    <div className="text-[10px] uppercase font-bold text-blue-500/50 mb-2">FRONT</div>
                                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{card.front}</p>
                                                                </div>
                                                                {/* Back */}
                                                                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-blue-500 text-white rounded-2xl flex flex-col items-center justify-center p-4">
                                                                    <div className="text-[10px] uppercase font-bold text-white/50 mb-2">BACK</div>
                                                                    <p className="text-sm font-medium">{card.back}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Poster Template */}
                                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-6 text-white shadow-xl">
                                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                                    <ExternalLink className="w-5 h-5" />
                                                    {tlm.visual_kit.poster_template.title}
                                                </h3>
                                                <p className="text-white/80 text-sm mb-6">{tlm.visual_kit.poster_template.visual_layout_description}</p>

                                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/70 mb-3">Key Sections to Include</h4>
                                                    <div className="space-y-2">
                                                        {tlm.visual_kit.poster_template.key_sections.map((section, i) => (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                                                <span className="text-sm font-medium">{section}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                    <ImageIcon className="w-16 h-16 text-gray-400" />
                                    <p className="text-gray-500 dark:text-gray-400">No TLM content ready yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-3">
                            <button
                                onClick={handlePrint}
                                disabled={!tlm || isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                            >
                                <Printer className="w-5 h-5" />
                                Print Worksheet
                            </button>
                            <button
                                onClick={onRegenerate}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                Regenerate Design
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TLMDrawer
