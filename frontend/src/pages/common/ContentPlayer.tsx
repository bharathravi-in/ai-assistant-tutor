import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle, Sparkles, Languages, Monitor, Mic, Volume2 } from 'lucide-react'
import { contentApi, tutorApi } from '../../services/api'
import AITutorPanel from '../../components/tutor/AITutorPanel'
import { useSystemTest, SystemCheckResult } from '../../hooks/useSystemTest'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'

const ContentPlayer: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [content, setContent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [language, setLanguage] = useState('en')
    const [isSystemTestDone, setIsSystemTestDone] = useState(false)
    const [isProcessingPdf, setIsProcessingPdf] = useState(false)
    const [isScormMode, setIsScormMode] = useState(false)
    const [activeSectionIndex, setActiveSectionIndex] = useState(0)

    const { results, isTesting, runTests } = useSystemTest();

    useEffect(() => {
        const fetchContent = async () => {
            if (!id) return
            try {
                setLoading(true)
                const data = await contentApi.getById(parseInt(id))
                setContent(data)
            } catch (err: any) {
                console.error('Failed to fetch content:', err)
                setError(err.response?.data?.detail || 'Failed to load content')
            } finally {
                setLoading(false)
            }
        }

        fetchContent()
        runTests();
    }, [id, runTests])

    // Helper to reconstruct sections for legacy content
    const getSections = (content: any) => {
        if (!content || !content.content_json) return [];
        if (content.content_json.sections) return content.content_json.sections;

        const data = content.content_json.structured_data || content.content_json;
        const sections: any[] = [];
        const type = content.content_type;

        const toString = (val: any) => {
            if (!val) return "";
            if (typeof val === 'string') return val;
            if (Array.isArray(val)) return val.map(i => typeof i === 'object' ? `${i.title || i.name}: ${i.description || i.content}` : `• ${i}`).join('\n');
            if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `**${k.replace(/_/g, ' ')}**: ${v}`).join('\n');
            return String(val);
        };

        if (type === 'lesson_plan') {
            if (data.learning_objectives) {
                sections.push({
                    id: 'learning_objectives',
                    title: 'Learning Objectives',
                    type: 'explanation',
                    content: toString(data.learning_objectives),
                    narration: `Our learning objectives for today: ${toString(data.learning_objectives)}`
                });
            }
            if (Array.isArray(data.activities)) {
                data.activities.forEach((act: any, i: number) => {
                    sections.push({
                        id: `activity_${i + 1}`,
                        title: act.activity_name || `Activity ${i + 1}`,
                        type: 'activity',
                        content: act.description || '',
                        narration: `Now, let's look at ${act.activity_name || `Activity ${i + 1}`}. ${act.description || ''}`
                    });
                });
            }
            const extras = [
                ["multi_grade_adaptations", "explanation", "Multigrade Adaptations"],
                ["low_tlm_alternatives", "explanation", "Low-Resource Alternatives"],
                ["exit_questions", "assessment", "Exit Questions"]
            ];
            extras.forEach(([key, secType, title]) => {
                if (data[key]) {
                    sections.push({
                        id: key,
                        title: title,
                        type: secType,
                        content: toString(data[key]),
                        narration: `Let's move on to ${title}. ${toString(data[key])}`
                    });
                }
            });
        } else {
            const mapping = [
                ["conceptual_briefing", "explanation", "Conceptual Briefing"],
                ["simple_explanation", "explanation", "Simple Explanation"],
                ["mnemonics_hooks", "mnemonic", "Mnemonics & Hooks"],
                ["what_to_say", "script", "What to Say"],
                ["specific_examples", "example", "Contextual Examples"],
                ["visual_aid_idea", "tlm", "Visual Aid Idea"],
                ["check_for_understanding", "assessment", "Check for Understanding"],
                ["understanding", "explanation", "Support"],
                ["immediate_action", "script", "Do This NOW"]
            ];
            mapping.forEach(([key, secType, title]) => {
                if (data[key]) {
                    sections.push({
                        id: key,
                        title: title,
                        type: secType,
                        content: toString(data[key]),
                        narration: `Let's look at ${title}. ${toString(data[key])}`
                    });
                }
            });
        }
        return sections;
    };

    const sections = getSections(content);

    const handleEnhanceContent = async () => {
        if (!content) return;
        try {
            setIsProcessingPdf(true);
            await tutorApi.processPdf(content.id);
            // Refresh content to get new sections
            const updated = await contentApi.getById(content.id);
            setContent(updated);
            setIsSystemTestDone(true);
        } catch (err) {
            console.error('Enhancement failed:', err);
            setError('Failed to process PDF into interactive sections.');
        } finally {
            setIsProcessingPdf(false);
        }
    };

    // Auto-trigger enhancement if in SCORM mode but no sections exist
    useEffect(() => {
        if (isScormMode && sections.length === 0 && !isProcessingPdf && content && !error && isSystemTestDone) {
            handleEnhanceContent();
        }
    }, [isScormMode, sections.length, isProcessingPdf, content, error, isSystemTestDone]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-black gap-6 transition-colors duration-300">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                    <Sparkles className="w-8 h-8 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-yellow-600 dark:text-yellow-500 font-black uppercase tracking-[0.3em] text-xs">Pathshala Guru is arriving...</p>
            </div>
        )
    }

    if (error || !content) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50 dark:bg-black transition-colors duration-300">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">System Interruption</h2>
                <p className="text-zinc-500 max-w-md mb-8">{error || "The requested educational content could not be materialized."}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 bg-yellow-500 text-black font-black rounded-full hover:bg-yellow-400 transition-all uppercase text-xs tracking-widest shadow-lg shadow-gold"
                >
                    Return to Library
                </button>
            </div>
        )
    }


    // Pathshala Style: System Test Screen
    if (!isSystemTestDone) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-black text-zinc-900 dark:text-white p-6 relative overflow-hidden font-sans transition-colors duration-300">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-gold">
                                <Sparkles className="w-7 h-7 text-black" />
                            </div>
                            <span className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">Pathshala Guru</span>
                        </div>

                        <div className="space-y-4">
                            <p className="text-yellow-600 dark:text-yellow-500 font-bold text-sm uppercase tracking-[0.3em]">Session Initializing</p>
                            <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter text-zinc-900 dark:text-white">
                                Preparing your session on <span className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-500 to-yellow-600">{content.title}</span>
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium max-w-lg leading-relaxed">
                                Ensure your hardware is ready for an interactive AI-guided teaching experience.
                            </p>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => {
                                    setIsScormMode(false);
                                    setIsSystemTestDone(true);
                                }}
                                className="group flex items-center justify-center gap-4 px-12 py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black rounded-2xl hover:scale-105 transition-all shadow-gold uppercase tracking-widest text-sm"
                            >
                                Enter Classroom
                                <ChevronLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => {
                                    setIsScormMode(true);
                                    setIsSystemTestDone(true);
                                }}
                                disabled={isProcessingPdf}
                                className="flex items-center justify-center gap-3 px-10 py-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-yellow-500/30 text-zinc-800 dark:text-yellow-500 font-black rounded-2xl hover:bg-zinc-50 dark:hover:bg-yellow-500/10 hover:border-yellow-500 transition-all uppercase tracking-widest text-[10px] group shadow-sm"
                            >
                                {isProcessingPdf ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analyzing Structure...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        PDF → Interactive
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/40 dark:bg-zinc-900/50 backdrop-blur-2xl border border-zinc-200 dark:border-white/5 rounded-[48px] p-10 space-y-10 shadow-2xl relative overflow-hidden animate-in zoom-in duration-1000">
                        <div className="text-center">
                            <div className="inline-block px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-8">
                                <p className="text-[10px] font-black uppercase text-yellow-600 dark:text-yellow-500 tracking-[0.2em]">Diagnostic Test</p>
                            </div>

                            <div className="w-48 h-48 mx-auto bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-800 dark:to-black rounded-full border border-zinc-200 dark:border-white/5 flex items-center justify-center relative mb-10 group cursor-help transition-colors">
                                <div className="absolute inset-0 rounded-full bg-[url('/home/bharathr/.gemini/antigravity/brain/c3c9c1cb-6a53-47fc-8a14-8ade84fabdf1/ai_avatar_premium_1770058769793.png')] bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700" title="AI Assistant" />
                                <div className="absolute inset-0 rounded-full border-4 border-dashed border-yellow-500/20 animate-[spin_20s_linear_infinite]" />
                                <div className="absolute inset-0 rounded-full border-2 border-yellow-500/40 animate-pulse" />
                                {isTesting && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-black/60 rounded-full backdrop-blur-sm z-20">
                                        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-500">Scanning Hardware</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {[
                                { icon: Monitor, label: 'Browser Info', key: 'browser' },
                                { icon: Mic, label: 'Microphone', key: 'microphone' },
                                { icon: Volume2, label: 'Speaker', key: 'speaker' }
                            ].map((item, idx) => {
                                const res = results?.[item.key as keyof SystemCheckResult];
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${res?.passed ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/5'}`}>
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-2xl ${res?.passed ? 'bg-yellow-500 text-black' : 'bg-white dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-100 dark:border-transparent'}`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{item.label}</p>
                                                <p className={`text-xs font-bold ${res?.passed ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>{res?.details || 'Initializing...'}</p>
                                            </div>
                                        </div>
                                        {res && (
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${res.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {res.status}
                                                </span>
                                                <div className={`w-3 h-3 rounded-full ${res.passed ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'} animate-pulse`} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-black text-zinc-900 dark:text-white font-sans transition-colors duration-300">
            {/* Player Header */}
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 px-8 py-5 flex items-center justify-between z-20 shadow-sm dark:shadow-2xl">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3.5 rounded-2xl text-zinc-500 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all border border-zinc-200 dark:border-white/10 hover:border-yellow-500/30"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight truncate max-w-[300px] sm:max-w-[500px] uppercase">
                            {content.title}
                        </h1>
                        <div className="flex items-center gap-4 mt-1.5">
                            <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-black uppercase tracking-widest bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                                {content.subject || 'General'}
                            </span>
                            <button
                                onClick={() => {
                                    if (!isScormMode && sections.length === 0) {
                                        handleEnhanceContent();
                                    }
                                    setIsScormMode(!isScormMode);
                                }}
                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${isScormMode ? 'bg-yellow-500 border-yellow-400 text-black shadow-gold' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20 shadow-sm'}`}
                            >
                                {isScormMode ? 'INTERACTIVE MODE' : 'PDF MODE'}
                            </button>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
                                Class {content.grade || 'All'} • {content.content_type?.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 px-5 py-2.5 rounded-2xl group focus-within:border-yellow-500/50 transition-all shadow-inner">
                        <Languages className="w-4 h-4 text-zinc-500 group-hover:text-yellow-500 transition-colors" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-transparent text-[11px] font-black uppercase tracking-widest focus:outline-none appearance-none pr-8 cursor-pointer text-zinc-900 dark:text-white"
                        >
                            <option value="en" className="bg-white dark:bg-zinc-900">English</option>
                            <option value="hi" className="bg-white dark:bg-zinc-900">Hindi (हिन्दी)</option>
                            <option value="kn" className="bg-white dark:bg-zinc-900">Kannada (ಕನ್ನಡ)</option>
                            <option value="te" className="bg-white dark:bg-zinc-900">Telugu (తెలుగు)</option>
                            <option value="ta" className="bg-white dark:bg-zinc-900">Tamil (தமிழ்)</option>
                        </select>
                        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-white/5" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-500">Language</span>
                    </div>

                    <div className="flex items-center gap-3 px-6 py-3 bg-yellow-500 text-black rounded-2xl shadow-gold animate-in fade-in duration-500">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">PATHSHALA AI</span>
                    </div>
                </div>
            </div>

            {/* Main Interactive Content */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-zinc-100 dark:bg-black relative overflow-hidden flex flex-col items-center justify-center p-12 pb-36 transition-colors duration-300">
                    {/* Immersive View Styling */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-yellow-500/5 rounded-full blur-[150px] pointer-events-none opacity-50" />

                    <div className="w-full h-full rounded-[40px] overflow-hidden border border-zinc-200 dark:border-white/5 shadow-2xl relative z-10 transition-all duration-700 bg-white dark:bg-zinc-950 group/frame">
                        {!isScormMode && content.pdf_url ? (
                            <iframe
                                src={`${content.pdf_url}#toolbar=0&navpanes=0&view=FitH`}
                                className="w-full h-full border-none opacity-90 transition-all duration-1000 group-hover/frame:opacity-100 dark:grayscale dark:invert dark:contrast-[1.1] dark:brightness-[0.85]"
                                title={content.title}
                            />
                        ) : isScormMode && sections.length > 0 ? (
                            <div className="w-full h-full bg-white dark:bg-black p-12 overflow-y-auto custom-scrollbar flex flex-col pointer-events-auto transition-colors">
                                <div className="max-w-4xl mx-auto w-full space-y-10 py-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em]">
                                                {sections[activeSectionIndex]?.type || 'Content'}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-yellow-500/30 to-transparent" />
                                        </div>
                                        <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight">
                                            {sections[activeSectionIndex]?.title}
                                        </h2>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-10 border border-zinc-100 dark:border-white/5 shadow-xl dark:shadow-2xl relative overflow-hidden group/card min-h-[400px] transition-colors">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                        <div className="relative z-10 prose dark:prose-invert prose-xl max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-headings:text-zinc-900 dark:prose-headings:text-white prose-strong:text-yellow-600 dark:prose-strong:text-yellow-500 tracking-tight transition-colors">
                                            <MarkdownRenderer content={sections[activeSectionIndex]?.content} />
                                        </div>
                                    </div>

                                    {sections[activeSectionIndex]?.type === 'activity' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 space-y-4">
                                                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black">
                                                    <Sparkles className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Interactive Task</h4>
                                                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">Follow the instructions above to complete this hands-on activity with your students.</p>
                                            </div>
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-8 space-y-4">
                                                <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-black">
                                                    <Languages className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-xl font-bold text-yellow-600 dark:text-yellow-500">Discussion Point</h4>
                                                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">Ask your students about their thoughts on this topic to deepen engagement.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-white dark:bg-black flex flex-col items-center justify-center gap-12 text-center p-20 relative overflow-hidden transition-colors">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] animate-pulse" />

                                <div className="relative">
                                    <div className="w-48 h-48 bg-zinc-50 dark:bg-zinc-900 rounded-[56px] flex items-center justify-center border border-zinc-100 dark:border-white/5 shadow-xl dark:shadow-2xl relative z-10 group transition-colors">
                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[56px]" />
                                        <Sparkles className="w-16 h-16 text-yellow-500 animate-pulse-slow" />
                                        <div className="absolute inset-[-8px] border-2 border-dashed border-yellow-500/20 rounded-[64px] animate-[spin_10s_linear_infinite]" />
                                    </div>

                                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-gold z-20">
                                        <Loader2 className="w-6 h-6 text-black animate-spin" />
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Constructing Knowledge</h3>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0s]" />
                                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed font-medium">
                                        Our AI Guru is distilling the PDF into a <span className="text-yellow-600 dark:text-yellow-500 font-bold">pedagogical sequence</span> for your classroom.
                                    </p>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md mx-auto flex items-center gap-4 text-red-500 animate-in fade-in zoom-in">
                                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                            <div className="text-left">
                                                <p className="font-bold uppercase text-[10px] tracking-widest mb-1">System Interruption</p>
                                                <p className="text-sm">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-4">
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-[0.3em] animate-pulse">This typically takes 15-20 seconds</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-[500px] flex-shrink-0 relative z-30 shadow-2xl bg-white dark:bg-black border-l border-zinc-200 dark:border-white/5 transition-colors">
                    <AITutorPanel
                        contentId={content.id}
                        sections={sections}
                        language={language}
                        onLanguageChange={(lang) => setLanguage(lang)}
                        onSectionChange={(id) => {
                            const idx = sections.findIndex((s: any) => s.id === id);
                            if (idx !== -1) setActiveSectionIndex(idx);
                        }}
                    />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
                .bg-gradient-radial {
                    background-image: radial-gradient(var(--tw-gradient-stops));
                }
            `}} />
        </div>
    )
}

export default ContentPlayer
