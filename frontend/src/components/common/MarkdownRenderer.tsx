import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
    content: string
    className?: string
}

/**
 * Reusable markdown renderer component with proper formatting support.
 * Handles: headers, bold/italic, lists, code blocks, tables, links
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    if (!content) return null

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headers
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-bold mt-5 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-base font-semibold mt-3 mb-2">
                            {children}
                        </h4>
                    ),

                    // Paragraphs
                    p: ({ children }) => (
                        <p className="mb-3 leading-relaxed">
                            {children}
                        </p>
                    ),

                    // Bold and emphasis
                    strong: ({ children }) => (
                        <strong className="font-bold">
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">
                            {children}
                        </em>
                    ),

                    // Lists
                    ul: ({ children }) => (
                        <ul className="list-none space-y-2 mb-4 ml-4">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-none space-y-2 mb-4 ml-4 counter-reset-item">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="flex items-start gap-2">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-current opacity-40 flex-shrink-0" />
                            <span className="flex-1">{children}</span>
                        </li>
                    ),

                    // Code blocks
                    code: ({ className, children }) => {
                        const isInline = !className
                        if (isInline) {
                            return (
                                <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-pink-600 dark:text-pink-400 rounded text-sm font-mono">
                                    {children}
                                </code>
                            )
                        }
                        return (
                            <code className="block bg-gray-900 dark:bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => (
                        <pre className="bg-gray-900 dark:bg-gray-800 rounded-lg overflow-x-auto my-4">
                            {children}
                        </pre>
                    ),

                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr>{children}</tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-3 text-sm">
                            {children}
                        </td>
                    ),

                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {children}
                        </a>
                    ),

                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg text-gray-700 dark:text-gray-300 italic">
                            {children}
                        </blockquote>
                    ),

                    // Horizontal rule
                    hr: () => (
                        <hr className="my-6 border-gray-200 dark:border-gray-700" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
