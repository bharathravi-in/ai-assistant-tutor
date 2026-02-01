import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    Save,
    Send,
    ArrowLeft,
    FileText,
    Activity,
    Palette,
    ClipboardCheck,
    FileSpreadsheet,
    Loader2,
    Plus,
    X,
    Sparkles,
    Eye,
    Edit3,
    Split,
    Wand2,
    BookOpen,
    LayoutTemplate,
    Copy,
    Check,
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Code,
    Quote,
    Link2,
    Table,
    Printer,
    Download,
    Maximize2,
    Minimize2,
    ChevronDown,
    ChevronUp,
    BookMarked,
    GraduationCap,
    Zap,
    Target,
    Brain
} from 'lucide-react'
import { contentApi, aiApi } from '../../services/api'
import { useMasterData } from '../../hooks/useMasterData'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'

// Enhanced content type options with more types
const contentTypes = [
    { value: 'lesson_plan', label: 'Lesson Plan', icon: FileText, color: 'blue', description: 'Complete teaching plan with objectives & activities' },
    { value: 'explanation', label: 'Topic Explanation', icon: BookOpen, color: 'indigo', description: 'Detailed concept explanation for students' },
    { value: 'activity', label: 'Activity', icon: Activity, color: 'green', description: 'Engaging classroom activities' },
    { value: 'tlm', label: 'TLM', icon: Palette, color: 'pink', description: 'Teaching Learning Materials' },
    { value: 'quick_reference', label: 'Quick Reference', icon: Zap, color: 'amber', description: 'Quick tips and reference cards' },
    { value: 'assessment', label: 'Assessment', icon: ClipboardCheck, color: 'purple', description: 'Tests, quizzes, and evaluations' },
    { value: 'worksheet', label: 'Worksheet', icon: FileSpreadsheet, color: 'orange', description: 'Practice worksheets for students' },
    { value: 'study_guide', label: 'Study Guide', icon: BookMarked, color: 'teal', description: 'Comprehensive study materials' },
]

// Content templates for quick start
const contentTemplates: Record<string, string> = {
    lesson_plan: `# Lesson Plan: [Topic Name]

## Learning Objectives
By the end of this lesson, students will be able to:
1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

## Materials Needed
- [Material 1]
- [Material 2]
- [Material 3]

## Duration
[X] minutes

## Lesson Structure

### 1. Engage (5 minutes)
[Hook activity to capture attention]

### 2. Explore (10 minutes)
[Hands-on exploration activity]

### 3. Explain (15 minutes)
[Main teaching content]

### 4. Elaborate (10 minutes)
[Extension activity]

### 5. Evaluate (5 minutes)
[Assessment activity]

## Differentiation
- **For struggling learners:** [Support strategies]
- **For advanced learners:** [Extension activities]

## Assessment
[How you will assess student learning]

## Reflection
[Space for post-lesson notes]
`,
    explanation: `# Understanding [Topic Name]

## What is [Topic]?
[Clear, simple definition]

## Why is it Important?
[Real-world relevance and applications]

## Key Concepts
### Concept 1
[Explanation with examples]

### Concept 2
[Explanation with examples]

## Visual Representation
[Describe diagrams or visuals that help explain]

## Common Misconceptions
- **Misconception:** [What students often get wrong]
- **Reality:** [The correct understanding]

## Real-Life Examples
1. [Example 1]
2. [Example 2]
3. [Example 3]

## Check Your Understanding
1. [Question 1]
2. [Question 2]
3. [Question 3]

## Summary
[Brief recap of main points]
`,
    activity: `# Activity: [Activity Name]

## Learning Objective
Students will [objective]

## Materials
- [Material 1]
- [Material 2]

## Time Required
[X] minutes

## Group Size
[Individual/Pairs/Small groups/Whole class]

## Instructions

### Step 1: Introduction (2 minutes)
[Setup instructions]

### Step 2: Main Activity (X minutes)
[Detailed activity steps]

### Step 3: Wrap-up (3 minutes)
[Conclusion and discussion]

## Differentiation
[How to adapt for different learners]

## Assessment
[How to evaluate participation/learning]

## Extensions
[Follow-up activities]
`,
    tlm: `# Teaching Learning Material: [TLM Name]

## Purpose
[What this TLM helps teach]

## Target Grade/Level
[Grade level(s)]

## Materials Needed
- [Material 1]
- [Material 2]

## Construction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## How to Use
[Instructions for classroom use]

## Visual Description
[Description of what the TLM looks like]

## Learning Outcomes
Students will understand:
- [Outcome 1]
- [Outcome 2]

## Tips for Teachers
- [Tip 1]
- [Tip 2]
`,
    quick_reference: `# Quick Reference: [Topic]

## Key Terms
| Term | Definition |
|------|------------|
| [Term 1] | [Definition] |
| [Term 2] | [Definition] |

## Important Formulas/Rules
- [Formula/Rule 1]
- [Formula/Rule 2]

## Quick Tips
✓ [Tip 1]
✓ [Tip 2]
✓ [Tip 3]

## Common Mistakes to Avoid
✗ [Mistake 1]
✗ [Mistake 2]

## At a Glance
[Visual summary or diagram description]
`,
    assessment: `# Assessment: [Topic Name]

## Assessment Type
[Formative/Summative/Diagnostic]

## Duration
[X] minutes

## Total Marks
[X] marks

## Instructions for Students
1. [Instruction 1]
2. [Instruction 2]

---

## Section A: Multiple Choice (X marks)

**1.** [Question] (1 mark)
   - a) [Option]
   - b) [Option]
   - c) [Option]
   - d) [Option]

## Section B: Short Answer (X marks)

**1.** [Question] (2 marks)

## Section C: Long Answer (X marks)

**1.** [Question] (5 marks)

---

## Answer Key
[Answers for teacher reference]

## Rubric
[Grading criteria]
`,
    worksheet: `# Worksheet: [Topic Name]

**Name:** _________________ **Date:** ___________ **Class:** ____

---

## Part A: Fill in the Blanks

1. ________________________________
2. ________________________________
3. ________________________________

## Part B: Match the Following

| Column A | Column B |
|----------|----------|
| 1. [Item] | a. [Match] |
| 2. [Item] | b. [Match] |

## Part C: Short Questions

1. [Question]
   _______________________________________________

2. [Question]
   _______________________________________________

## Part D: Practice Problems

1. [Problem]



2. [Problem]



## Part E: Think and Write

[Open-ended question for deeper thinking]

---

**Teacher's Comments:** ________________________________
`,
    study_guide: `# Study Guide: [Topic/Chapter Name]

## Overview
[Brief introduction to the topic]

## Learning Objectives
After studying this guide, you should be able to:
- [ ] [Objective 1]
- [ ] [Objective 2]
- [ ] [Objective 3]

## Key Vocabulary
- **[Term 1]:** [Definition]
- **[Term 2]:** [Definition]

## Main Concepts

### 1. [Concept Name]
[Detailed explanation]

**Key Points:**
- Point 1
- Point 2

### 2. [Concept Name]
[Detailed explanation]

## Summary
[Condensed review of main points]

## Self-Test Questions
1. [Question]
2. [Question]
3. [Question]

## Additional Resources
- [Resource 1]
- [Resource 2]

## Study Tips
💡 [Tip 1]
💡 [Tip 2]
`
}

// AI prompt templates for different content types
const aiPromptTemplates: Record<string, (topic: string, grade: number, subject: string) => string> = {
    lesson_plan: (topic: string, grade: number, subject: string) => 
        `Create a detailed 5E lesson plan for teaching "${topic}" to Class ${grade} ${subject} students. Include clear learning objectives, engaging activities, materials list, timing breakdown, differentiation strategies, and assessment methods.`,
    
    explanation: (topic: string, grade: number, subject: string) =>
        `Explain "${topic}" for Class ${grade} ${subject} students. Include clear definitions, real-world examples, visual descriptions, common misconceptions, and check-for-understanding questions.`,
    
    activity: (topic: string, grade: number, subject: string) =>
        `Design an engaging classroom activity for teaching "${topic}" to Class ${grade} ${subject} students. Include materials, step-by-step instructions, grouping strategies, and assessment criteria.`,
    
    tlm: (topic: string, grade: number, subject: string) =>
        `Create a Teaching Learning Material (TLM) design for "${topic}" for Class ${grade} ${subject}. Include materials needed, construction steps, usage instructions, and learning outcomes.`,
    
    quick_reference: (topic: string, grade: number, subject: string) =>
        `Create a quick reference card for "${topic}" for Class ${grade} ${subject}. Include key terms, formulas/rules, tips, and common mistakes to avoid.`,
    
    assessment: (topic: string, grade: number, subject: string) =>
        `Create an assessment/test for "${topic}" for Class ${grade} ${subject} with multiple choice, short answer, and long answer questions. Include answer key and marking rubric.`,
    
    worksheet: (topic: string, grade: number, subject: string) =>
        `Create a practice worksheet for "${topic}" for Class ${grade} ${subject} with fill-in-the-blanks, matching, short questions, and practice problems.`,
    
    study_guide: (topic: string, grade: number, subject: string) =>
        `Create a comprehensive study guide for "${topic}" for Class ${grade} ${subject} with key vocabulary, main concepts, summary, self-test questions, and study tips.`
}

// Preview modes
type PreviewMode = 'edit' | 'preview' | 'split'

export default function ContentCreator() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = Boolean(id)

    const { grades, subjects } = useMasterData()
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Form state
    const [title, setTitle] = useState('')
    const [contentType, setContentType] = useState('lesson_plan')
    const [description, setDescription] = useState('')
    const [grade, setGrade] = useState<number | null>(null)
    const [subject, setSubject] = useState('')
    const [topic, setTopic] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [contentJson, setContentJson] = useState<any>({})

    // UI state
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    
    // Enhanced UI state
    const [previewMode, setPreviewMode] = useState<PreviewMode>('split')
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showAIAssist, setShowAIAssist] = useState(false)
    const [aiGenerating, setAiGenerating] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')
    const [copied, setCopied] = useState(false)
    const [contentTypeExpanded, setContentTypeExpanded] = useState(true)
    const [wordCount, setWordCount] = useState(0)
    const [characterCount, setCharacterCount] = useState(0)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Calculate word/char count
    useEffect(() => {
        const words = description.trim().split(/\s+/).filter(w => w.length > 0).length
        setWordCount(words)
        setCharacterCount(description.length)
        setHasUnsavedChanges(true)
    }, [description])

    // Load existing content if editing
    useEffect(() => {
        if (isEditing && id) {
            loadContent(parseInt(id))
        }
    }, [id, isEditing])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault()
                handlePrint()
            }
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen])

    const loadContent = async (contentId: number) => {
        setLoading(true)
        try {
            const data = await contentApi.getById(contentId)
            setTitle(data.title)
            setContentType(data.content_type)
            setDescription(data.description)
            setGrade(data.grade)
            setSubject(data.subject || '')
            setTopic(data.topic || '')
            setTags(data.tags || [])
            setContentJson(data.content_json || {})
            setHasUnsavedChanges(false)
        } catch (err) {
            setError('Failed to load content')
        } finally {
            setLoading(false)
        }
    }

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    const handleSave = async (silent = false) => {
        if (!title.trim() || !description.trim()) {
            if (!silent) setError('Title and description are required')
            return
        }

        setSaving(true)
        if (!silent) setError('')
        if (!silent) setSuccess('')

        try {
            const data = {
                title: title.trim(),
                content_type: contentType,
                description: description.trim(),
                content_json: contentJson,
                grade: grade || undefined,
                subject: subject || undefined,
                topic: topic || undefined,
                tags: tags.length > 0 ? tags : undefined
            }

            if (isEditing && id) {
                await contentApi.update(parseInt(id), data)
                if (!silent) setSuccess('Content saved successfully!')
            } else {
                const result = await contentApi.create(data)
                if (!silent) setSuccess('Content created successfully!')
                navigate(`/teacher/content/edit/${result.id}`, { replace: true })
            }
            setLastSaved(new Date())
            setHasUnsavedChanges(false)
        } catch (err: any) {
            if (!silent) setError(err.response?.data?.detail || 'Failed to save content')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            setError('Title and description are required before submitting')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            let contentId = id
            if (!isEditing) {
                const data = {
                    title: title.trim(),
                    content_type: contentType,
                    description: description.trim(),
                    content_json: contentJson,
                    grade: grade || undefined,
                    subject: subject || undefined,
                    topic: topic || undefined,
                    tags: tags.length > 0 ? tags : undefined,
                    generate_pdf: true,
                    vectorize: true
                }
                const result = await contentApi.create(data)
                contentId = result.id
            }

            await contentApi.submit(parseInt(contentId as string))
            setSuccess('Content submitted for review!')
            setTimeout(() => {
                navigate('/teacher/my-content')
            }, 1500)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit content')
        } finally {
            setSubmitting(false)
        }
    }

    // Insert markdown formatting
    const insertMarkdown = (syntax: string, placeholder = '') => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = description.substring(start, end)
        const textToInsert = selectedText || placeholder

        let newText: string
        let cursorOffset: number

        switch (syntax) {
            case 'bold':
                newText = `**${textToInsert}**`
                cursorOffset = 2
                break
            case 'italic':
                newText = `*${textToInsert}*`
                cursorOffset = 1
                break
            case 'h1':
                newText = `\n# ${textToInsert}\n`
                cursorOffset = 3
                break
            case 'h2':
                newText = `\n## ${textToInsert}\n`
                cursorOffset = 4
                break
            case 'ul':
                newText = `\n- ${textToInsert}\n`
                cursorOffset = 3
                break
            case 'ol':
                newText = `\n1. ${textToInsert}\n`
                cursorOffset = 4
                break
            case 'code':
                newText = `\`${textToInsert}\``
                cursorOffset = 1
                break
            case 'quote':
                newText = `\n> ${textToInsert}\n`
                cursorOffset = 3
                break
            case 'link':
                newText = `[${textToInsert}](url)`
                cursorOffset = selectedText ? textToInsert.length + 3 : 1
                break
            case 'table':
                newText = `\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n`
                cursorOffset = 3
                break
            default:
                return
        }

        const newDescription = description.substring(0, start) + newText + description.substring(end)
        setDescription(newDescription)

        setTimeout(() => {
            textarea.focus()
            if (selectedText) {
                textarea.selectionStart = start + newText.length
                textarea.selectionEnd = start + newText.length
            } else {
                textarea.selectionStart = start + cursorOffset
                textarea.selectionEnd = start + cursorOffset + (placeholder?.length || 0)
            }
        }, 0)
    }

    // Apply template
    const applyTemplate = (templateKey: string) => {
        const template = contentTemplates[templateKey]
        if (template) {
            setDescription(template)
        }
    }

    // Generate content with AI
    const generateWithAI = async () => {
        if (!topic && !aiPrompt) {
            setError('Please enter a topic or AI prompt')
            return
        }

        setAiGenerating(true)
        setError('')

        try {
            const promptFn = aiPromptTemplates[contentType]
            const prompt = aiPrompt || (promptFn ? promptFn(
                topic || title,
                grade || 6,
                subject || 'General'
            ) : `Create content about "${topic || title}"`)

            const response = await aiApi.ask({
                input_text: prompt,
                mode: contentType === 'lesson_plan' ? 'plan' : contentType === 'explanation' ? 'explain' : 'assist',
                grade: grade || undefined,
                subject: subject || undefined,
                language: 'en'
            })

            if (response.content) {
                setDescription(response.content)
                setContentJson({
                    ...contentJson,
                    ai_generated: true,
                    generation_prompt: prompt,
                    generated_at: new Date().toISOString()
                })
            }
            setShowAIAssist(false)
            setAiPrompt('')
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to generate content')
        } finally {
            setAiGenerating(false)
        }
    }

    // Copy to clipboard
    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(description)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Print functionality
    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title || 'Content'}</title>
                    <style>
                        body { 
                            font-family: 'Georgia', serif; 
                            line-height: 1.8; 
                            max-width: 800px; 
                            margin: 0 auto; 
                            padding: 40px;
                        }
                        h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        h2 { font-size: 20px; margin-top: 30px; color: #333; }
                        h3 { font-size: 16px; margin-top: 20px; }
                        ul, ol { padding-left: 20px; }
                        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
                        blockquote { border-left: 4px solid #ddd; margin: 20px 0; padding-left: 20px; color: #666; }
                        .metadata { color: #666; font-size: 14px; margin-bottom: 30px; }
                        @media print { body { padding: 20px; } }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <div class="metadata">
                        <strong>Type:</strong> ${contentTypes.find(t => t.value === contentType)?.label || contentType}<br/>
                        ${grade ? `<strong>Grade:</strong> Class ${grade}<br/>` : ''}
                        ${subject ? `<strong>Subject:</strong> ${subject}<br/>` : ''}
                        ${topic ? `<strong>Topic:</strong> ${topic}<br/>` : ''}
                    </div>
                    <div id="content">${description.replace(/\n/g, '<br/>')}</div>
                </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.print()
        }
    }

    // Download as markdown
    const downloadMarkdown = () => {
        const content = `# ${title}\n\n${description}`
        const blob = new Blob([content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.md`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    const selectedContentType = contentTypes.find(t => t.value === contentType)

    return (
        <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6 overflow-auto' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEditing ? 'Edit Content' : 'Create New Content'}
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span>Share teaching materials with educators</span>
                            {lastSaved && (
                                <span className="flex items-center gap-1">
                                    <Check className="w-3 h-3 text-green-500" />
                                    Saved {lastSaved.toLocaleTimeString()}
                                </span>
                            )}
                            {hasUnsavedChanges && <span className="text-amber-500">• Unsaved changes</span>}
                        </div>
                    </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Print (Ctrl+P)"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                    <button
                        onClick={downloadMarkdown}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Download as Markdown"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit for Review
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                    <X className="w-5 h-5 cursor-pointer" onClick={() => setError('')} />
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {success}
                </div>
            )}

            {/* Content Type Selection - Collapsible */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => setContentTypeExpanded(!contentTypeExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Content Type</h2>
                        {selectedContentType && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {selectedContentType.label}
                            </span>
                        )}
                    </div>
                    {contentTypeExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {contentTypeExpanded && (
                    <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {contentTypes.map((type) => {
                            const Icon = type.icon
                            const isSelected = contentType === type.value
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => setContentType(type.value)}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 group ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                >
                                    <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {type.label}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center hidden md:block">
                                        {type.description}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Sidebar - Metadata */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Title & Metadata */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Content Details
                        </h3>
                        
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Photosynthesis - 5E Lesson Plan"
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Grade */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <GraduationCap className="w-4 h-4 inline mr-1" />
                                Grade
                            </label>
                            <select
                                value={grade || ''}
                                onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Select Grade</option>
                                {grades.map((g: any) => (
                                    <option key={g.id} value={g.grade_number}>Class {g.grade_number}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <BookOpen className="w-4 h-4 inline mr-1" />
                                Subject
                            </label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Select Subject</option>
                                {subjects.map((s: any) => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Topic */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Target className="w-4 h-4 inline mr-1" />
                                Topic
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Photosynthesis"
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-blue-900 dark:hover:text-blue-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    placeholder="Add tag"
                                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                />
                                <button
                                    onClick={handleAddTag}
                                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AI Assistant */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">AI Content Assistant</h3>
                                <p className="text-xs text-gray-500">Generate content with AI</p>
                            </div>
                        </div>

                        {showAIAssist ? (
                            <div className="space-y-3">
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder={`Describe what you want to create, or leave empty to auto-generate based on topic...`}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={generateWithAI}
                                        disabled={aiGenerating}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                        {aiGenerating ? 'Generating...' : 'Generate'}
                                    </button>
                                    <button
                                        onClick={() => setShowAIAssist(false)}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAIAssist(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate with AI
                            </button>
                        )}
                    </div>

                    {/* Templates */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <LayoutTemplate className="w-5 h-5 text-amber-500" />
                                Templates
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Start with a pre-built structure
                        </p>
                        <button
                            onClick={() => applyTemplate(contentType)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Apply {selectedContentType?.label} Template
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{wordCount}</div>
                                <div className="text-xs text-gray-500">Words</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{characterCount}</div>
                                <div className="text-xs text-gray-500">Characters</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Editor Toolbar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            {/* Preview Mode Toggle */}
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setPreviewMode('edit')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                                        previewMode === 'edit'
                                            ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                                    }`}
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setPreviewMode('split')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                                        previewMode === 'split'
                                            ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                                    }`}
                                >
                                    <Split className="w-4 h-4" />
                                    Split
                                </button>
                                <button
                                    onClick={() => setPreviewMode('preview')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                                        previewMode === 'preview'
                                            ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                                    }`}
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                            </div>

                            {/* Formatting Tools */}
                            {(previewMode === 'edit' || previewMode === 'split') && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => insertMarkdown('bold', 'bold text')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Bold"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => insertMarkdown('italic', 'italic text')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Italic"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
                                    <button
                                        onClick={() => insertMarkdown('h1', 'Heading')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Heading 1"
                                    >
                                        <Heading1 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => insertMarkdown('h2', 'Heading')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Heading 2"
                                    >
                                        <Heading2 className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
                                    <button
                                        onClick={() => insertMarkdown('ul', 'List item')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Bullet List"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => insertMarkdown('ol', 'List item')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Numbered List"
                                    >
                                        <ListOrdered className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
                                    <button
                                        onClick={() => insertMarkdown('code', 'code')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Inline Code"
                                    >
                                        <Code className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => insertMarkdown('quote', 'Quote')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Quote"
                                    >
                                        <Quote className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => insertMarkdown('link', 'link text')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Link"
                                    >
                                        <Link2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => insertMarkdown('table')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        title="Table"
                                    >
                                        <Table className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Copy Button */}
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Editor/Preview Container */}
                    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${
                        previewMode === 'split' ? 'grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700' : ''
                    }`}>
                        {/* Editor */}
                        {(previewMode === 'edit' || previewMode === 'split') && (
                            <div className="p-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Content (Markdown supported)
                                </label>
                                <textarea
                                    ref={textareaRef}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Write your content here... Use Markdown for formatting."
                                    rows={previewMode === 'split' ? 25 : 30}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                                    style={{ minHeight: previewMode === 'split' ? '600px' : '700px' }}
                                />
                            </div>
                        )}

                        {/* Preview */}
                        {(previewMode === 'preview' || previewMode === 'split') && (
                            <div className="p-6 overflow-auto" style={{ maxHeight: previewMode === 'split' ? '700px' : '800px' }}>
                                {/* Preview Header */}
                                <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </div>
                                    {title && (
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
                                    )}
                                    <div className="flex flex-wrap gap-2 text-sm">
                                        {selectedContentType && (
                                            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                {selectedContentType.label}
                                            </span>
                                        )}
                                        {grade && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">Class {grade}</span>}
                                        {subject && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{subject}</span>}
                                        {topic && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{topic}</span>}
                                    </div>
                                </div>

                                {/* Rendered Content */}
                                {description ? (
                                    <MarkdownRenderer content={description} />
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Start writing to see preview</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
