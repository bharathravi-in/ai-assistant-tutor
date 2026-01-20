import MarkdownRenderer from './MarkdownRenderer'

interface StructuredResponseProps {
    content: string
}

// Helper function to ensure content is always a string
function ensureString(content: any): string {
    if (!content) return ''
    if (typeof content === 'string') return content
    if (typeof content === 'object') {
        // Handle nested response structures
        if (content.content) return ensureString(content.content)
        if (content.text) return ensureString(content.text)
        if (content.response) return ensureString(content.response)
        // Try to stringify arrays of objects (like mnemonics)
        if (Array.isArray(content)) {
            return content.map((item, idx) => {
                if (typeof item === 'string') return item
                if (typeof item === 'object') {
                    // Format objects like {type: 'x', content: 'y'} nicely
                    const type = item.type || item.title || `Item ${idx + 1}`
                    const text = item.content || item.text || item.description || ''
                    return `**${type}:** ${text}`
                }
                return String(item)
            }).join('\n\n')
        }
        return JSON.stringify(content, null, 2)
    }
    return String(content)
}

// Process content to handle embedded Python dict/object patterns
function processContent(content: string): string {
    if (!content) return ''

    // Pattern 1: Match {'type': 'X', 'content': 'Y'} format
    // Handles both single and double quotes, various whitespace
    content = content.replace(
        /\{['"]type['"]\s*:\s*['"]([^'"]+)['"],?\s*['"]content['"]\s*:\s*['"]([^'"]+)['"]\s*\}/g,
        '**$1:** $2'
    )

    // Pattern 2: Match {'content': 'X', 'type': 'Y'} format (reversed order)
    content = content.replace(
        /\{['"]content['"]\s*:\s*['"]([^'"]+)['"],?\s*['"]type['"]\s*:\s*['"]([^'"]+)['"]\s*\}/g,
        '**$2:** $1'
    )

    // Pattern 3: Match standalone dict items in lists: + {'type': 'X', ...}
    content = content.replace(
        /[+\-•]\s*\{/g,
        '- **'
    )

    // Clean up any remaining braces that might create formatting issues
    // Only clean if they look like dict patterns
    content = content.replace(
        /\}\s*(,\s*\+\s*\{|\s*,?\s*$)/gm,
        ''
    )

    // Fix any double asterisks that may have been created
    content = content.replace(/\*\*\*\*/g, '**')

    return content
}

export default function StructuredResponse({ content }: StructuredResponseProps) {
    // Convert content to string and process any embedded objects
    const stringContent = ensureString(content)
    const processedContent = processContent(stringContent)

    return <MarkdownRenderer content={processedContent} />
}
