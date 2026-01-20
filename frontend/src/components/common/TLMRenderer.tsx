import { useState } from 'react'
import { Wrench, Eye } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

interface TLMRendererProps {
    content: any
}

// Helper to safely convert any content to string for rendering
function safeStringify(content: any): string {
    if (!content) return ''
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
        return content.map((item, idx) => {
            if (typeof item === 'string') return item
            if (typeof item === 'object') {
                // Handle flashcard-like objects
                const front = item.front || item.question || ''
                const back = item.back || item.answer || item.content || ''
                if (front && back) {
                    return `**Q${idx + 1}:** ${front}\n**A:** ${back}`
                }
                // Handle other structured objects
                const type = item.type || item.title || `Item ${idx + 1}`
                const text = item.content || item.text || item.description || ''
                return `**${type}:** ${text}`
            }
            return String(item)
        }).join('\n\n')
    }
    if (typeof content === 'object') {
        // Try to extract meaningful content
        if (content.content) return safeStringify(content.content)
        if (content.text) return safeStringify(content.text)
        if (content.description) return safeStringify(content.description)
        if (content.diy_workshop) return safeStringify(content.diy_workshop)
        if (content.visual_kit) return safeStringify(content.visual_kit)

        // Build a structured representation
        const parts: string[] = []
        if (content.title) parts.push(`# ${content.title}`)
        if (content.materials && Array.isArray(content.materials)) {
            parts.push('## Materials Needed')
            parts.push(content.materials.map((m: string) => `- ${m}`).join('\n'))
        }
        if (content.steps && Array.isArray(content.steps)) {
            parts.push('## Steps')
            parts.push(content.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n'))
        }
        if (content.usage_tips) {
            parts.push('## How to Use It')
            parts.push(content.usage_tips)
        }
        if (content.flashcards && Array.isArray(content.flashcards)) {
            parts.push('## Flashcards')
            parts.push(content.flashcards.map((card: any, idx: number) => {
                const front = card.front || card.question || ''
                const back = card.back || card.answer || ''
                return `**Card ${idx + 1}**\n- Q: ${front}\n- A: ${back}`
            }).join('\n\n'))
        }

        if (parts.length > 0) return parts.join('\n\n')

        // Fallback to JSON
        try {
            return JSON.stringify(content, null, 2)
        } catch {
            return String(content)
        }
    }
    return String(content)
}

// Parse TLM content for display
function parseTLMContent(content: any): { diy: string; visual: string; hasTabs: boolean } {
    if (!content) return { diy: '', visual: '', hasTabs: false }

    // If it's a string, try to parse as JSON
    if (typeof content === 'string') {
        try {
            const parsed = JSON.parse(content)
            return parseTLMContent(parsed)
        } catch {
            // It's plain text
            return { diy: content, visual: '', hasTabs: false }
        }
    }

    // Object with structured fields
    if (typeof content === 'object') {
        const diy = safeStringify(content.diy_workshop || content.description || content)
        const visual = safeStringify(content.visual_kit || '')
        return {
            diy,
            visual,
            hasTabs: !!(content.visual_kit || content.diy_workshop)
        }
    }

    return { diy: safeStringify(content), visual: '', hasTabs: false }
}

export default function TLMRenderer({ content }: TLMRendererProps) {
    const [activeTab, setActiveTab] = useState<'diy' | 'visual'>('diy')

    // Parse content safely
    const { diy, visual, hasTabs } = parseTLMContent(content)

    // Determine what to show
    const displayContent = activeTab === 'diy' ? diy : visual

    return (
        <div>
            {/* Tabs - only show if we have both types of content */}
            {hasTabs && (
                <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('diy')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'diy'
                                ? 'border-b-2 border-purple-500 text-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Wrench className="w-4 h-4 inline mr-2" />
                        DIY Workshop
                    </button>
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'visual'
                                ? 'border-b-2 border-purple-500 text-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Eye className="w-4 h-4 inline mr-2" />
                        Visual Kit
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
                {displayContent ? (
                    <MarkdownRenderer content={displayContent} />
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No content available for this tab.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
