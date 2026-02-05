"""
PDF Service - Generate professional PDFs from AI-generated educational content
"""
import io
from datetime import datetime
from typing import Optional, Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, ListFlowable, ListItem, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import re


class PDFGenerationService:
    """Service for generating professional educational PDFs."""
    
    # Theme colors matching the platform
    COLORS = {
        'primary': colors.HexColor('#3B82F6'),      # Blue
        'secondary': colors.HexColor('#6366F1'),    # Indigo
        'success': colors.HexColor('#10B981'),      # Green
        'warning': colors.HexColor('#F59E0B'),      # Amber
        'danger': colors.HexColor('#EF4444'),       # Red
        'purple': colors.HexColor('#8B5CF6'),       # Purple
        'pink': colors.HexColor('#EC4899'),         # Pink
        'cyan': colors.HexColor('#06B6D4'),         # Cyan
        'dark': colors.HexColor('#1F2937'),         # Dark gray
        'light': colors.HexColor('#F3F4F6'),        # Light gray
        'text': colors.HexColor('#374151'),         # Text gray
    }
    
    SECTION_COLORS = {
        'conceptual_briefing': 'primary',
        'simple_explanation': 'success',
        'mnemonics_hooks': 'purple',
        'what_to_say': 'secondary',
        'specific_examples': 'success',
        'generic_examples': 'cyan',
        'visual_aid_idea': 'pink',
        'check_for_understanding': 'secondary',
        'common_misconceptions': 'danger',
        'oral_questions': 'primary',
        'learning_objectives': 'primary',
        'activities': 'success',
        'assessment': 'purple',
    }
    
    SECTION_EMOJIS = {
        'conceptual_briefing': '📚',
        'simple_explanation': '💡',
        'mnemonics_hooks': '🔗',
        'what_to_say': '🗣️',
        'specific_examples': '🌳',
        'generic_examples': '🌐',
        'visual_aid_idea': '🎨',
        'check_for_understanding': '❓',
        'common_misconceptions': '⚠️',
        'oral_questions': '💬',
        'learning_objectives': '🎯',
        'activities': '📝',
        'exit_questions': '✅',
        'understanding': '🤝',
        'immediate_action': '⚡',
        'quick_activity': '🏸',
        'bridge_the_gap': '🌉',
        'check_progress': '📈',
        'for_later': '🛡️',
    }
    
    SECTION_TITLES = {
        'conceptual_briefing': 'Conceptual Briefing',
        'simple_explanation': 'Simple Explanation',
        'mnemonics_hooks': 'Memory Hooks & Mnemonics',
        'what_to_say': 'What to Say in Class',
        'specific_examples': 'Contextual Examples (India)',
        'generic_examples': 'Generic Examples',
        'visual_aid_idea': 'Visual Aid / TLM Idea',
        'check_for_understanding': 'Check for Understanding',
        'common_misconceptions': 'Common Misconceptions',
        'oral_questions': 'Oral Questions to Ask',
        'learning_objectives': 'Learning Objectives',
        'activities': 'Classroom Activities',
        'exit_questions': 'Exit Questions',
        'understanding': 'Understanding the Challenge',
        'immediate_action': 'Immediate Action',
        'quick_activity': 'Quick Activity',
        'bridge_the_gap': 'Bridge to Lesson',
        'check_progress': 'Check Progress',
        'for_later': 'For Tomorrow',
        'multi_grade_adaptations': 'Multigrade Adaptations',
        'low_tlm_alternatives': 'Low-Resource Alternatives',
    }
    
    # Path to system fonts
    FONT_DIR = "/usr/share/fonts/truetype"
    
    def __init__(self):
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import os
        
        self.registered_fonts = set()
        self._register_fonts()
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _register_fonts(self):
        """Register Unicode-compatible fonts for regional languages."""
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import os
        
        # Multiple possible font paths for different environments
        font_paths = [
            self.FONT_DIR,
            "/usr/share/fonts/truetype/noto",
            "/usr/share/fonts/opentype/noto",
            "/usr/share/fonts/truetype",
            "/usr/share/fonts"
        ]
        
        def find_font(name):
            for path in font_paths:
                full_path = os.path.join(path, name)
                if os.path.exists(full_path):
                    return full_path
            return None

        try:
            # Register DejaVuSans as the primary Unicode-capable font
            dejavu_sans = find_font("dejavu/DejaVuSans.ttf") or find_font("DejaVuSans.ttf")
            dejavu_sans_bold = find_font("dejavu/DejaVuSans-Bold.ttf") or find_font("DejaVuSans-Bold.ttf")
            
            if dejavu_sans:
                pdfmetrics.registerFont(TTFont('DejaVuSans', dejavu_sans))
                if dejavu_sans_bold:
                    pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', dejavu_sans_bold))
                self.default_font = 'DejaVuSans'
                self.default_font_bold = 'DejaVuSans-Bold' if dejavu_sans_bold else 'DejaVuSans'
                self.registered_fonts.add('DejaVuSans')
                print(f"✅ Registered DejaVuSans font from {dejavu_sans}")
            else:
                self.default_font = 'Helvetica'
                self.default_font_bold = 'Helvetica-Bold'
                print("⚠️ DejaVuSans not found, falling back to Helvetica")

            # Font mappings for regional languages
            font_mappings = {
                'NotoSansDevanagari': ["NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari-Bold.ttf"],
                'NotoSansTelugu': ["NotoSansTelugu-Regular.ttf", "NotoSansTelugu-Bold.ttf"],
                'NotoSansTamil': ["NotoSansTamil-Regular.ttf", "NotoSansTamil-Bold.ttf"],
                'NotoSansKannada': ["NotoSansKannada-Regular.ttf", "NotoSansKannada-Bold.ttf"]
            }

            for font_name, files in font_mappings.items():
                reg_file = find_font(files[0]) or find_font(f"noto/{files[0]}")
                bold_file = find_font(files[1]) or find_font(f"noto/{files[1]}")
                
                if reg_file:
                    pdfmetrics.registerFont(TTFont(font_name, reg_file))
                    if bold_file:
                        pdfmetrics.registerFont(TTFont(f"{font_name}-Bold", bold_file))
                    self.registered_fonts.add(font_name)
                    print(f"✅ Registered {font_name} from {reg_file}")
                else:
                    print(f"❌ Could not find font files for {font_name} in paths: {font_paths}")

        except Exception as e:
            print(f"❌ Error registering fonts: {e}")
            self.default_font = 'Helvetica'
            self.default_font_bold = 'Helvetica-Bold'
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=self.COLORS['dark'],
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName=self.default_font_bold
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Normal'],
            fontSize=14,
            textColor=self.COLORS['text'],
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName=self.default_font
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=self.COLORS['primary'],
            spaceBefore=20,
            spaceAfter=10,
            fontName=self.default_font_bold
        ))
        
        # Custom body text style (use different name to avoid conflict)
        self.styles.add(ParagraphStyle(
            name='CustomBodyText',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=self.COLORS['text'],
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            leading=16,
            fontName=self.default_font
        ))
        
        # List item style
        self.styles.add(ParagraphStyle(
            name='ListItem',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=self.COLORS['text'],
            leftIndent=20,
            spaceAfter=4,
            leading=14,
            fontName=self.default_font
        ))
        
        # Highlight style
        self.styles.add(ParagraphStyle(
            name='Highlight',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=self.COLORS['dark'],
            backColor=self.COLORS['light'],
            borderPadding=10,
            spaceBefore=10,
            spaceAfter=10,
            leftIndent=20,
            rightIndent=20,
            leading=16,
            fontName=self.default_font
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.gray,
            alignment=TA_CENTER,
            fontName=self.default_font
        ))
    
    def _wrap_with_unicode_font(self, text: str) -> str:
        """Wrap text with appropriate font tags if Unicode characters are present."""
        if not text:
            return ""
        
        # Ranges for Indic scripts (using non-raw strings to ensure Unicode expansion)
        # Devanagari: 0900-097F
        # Tamil: 0B80-0BFF
        # Telugu: 0C00-0C7F
        # Kannada: 0C80-0CFF
        
        has_hi = bool(re.search('[\u0900-\u097F]', text))
        has_te = bool(re.search('[\u0c00-\u0c7f]', text))
        has_ta = bool(re.search('[\u0b80-\u0bff]', text))
        has_kn = bool(re.search('[\u0c80-\u0cff]', text))
        
        # Only wrap if the font was successfully registered
        if has_hi and 'NotoSansDevanagari' in self.registered_fonts:
            return f'<font face="NotoSansDevanagari">{text}</font>'
        if has_te and 'NotoSansTelugu' in self.registered_fonts:
            return f'<font face="NotoSansTelugu">{text}</font>'
        if has_ta and 'NotoSansTamil' in self.registered_fonts:
            return f'<font face="NotoSansTamil">{text}</font>'
        if has_kn and 'NotoSansKannada' in self.registered_fonts:
            return f'<font face="NotoSansKannada">{text}</font>'
            
        return text

    def _clean_markdown(self, text: str) -> str:
        """Convert markdown to plain text with basic formatting."""
        if not text:
            return ""
        
        # Convert bold markdown to reportlab bold tags
        text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
        text = re.sub(r'__(.+?)__', r'<b>\1</b>', text)
        
        # Convert italic markdown
        text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
        text = re.sub(r'_(.+?)_', r'<i>\1</i>', text)
        
        # Remove headers markdown (keep text)
        text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
        
        # Handle newlines
        text = text.replace('\n\n', '<br/><br/>')
        text = text.replace('\n', '<br/>')
        
        # Wrap with dynamic font for Unicode support
        text = self._wrap_with_unicode_font(text)
        
        return text

    def _create_section_header(self, section_key: str) -> Paragraph:
        """Create a styled section header."""
        emoji = self.SECTION_EMOJIS.get(section_key, '📌')
        title = self.SECTION_TITLES.get(section_key, section_key.replace('_', ' ').title())
        return Paragraph(f"{emoji} {title}", self.styles['SectionHeader'])
    
    def _create_numbered_list(self, items: List[Any]) -> ListFlowable:
        """Create a numbered list from items."""
        list_items = []
        for i, item in enumerate(items):
            if isinstance(item, str):
                text = self._clean_markdown(item)
            elif isinstance(item, dict):
                # Handle structured items
                parts = []
                if 'title' in item:
                    parts.append(f"<b>{item['title']}</b>")
                if 'description' in item:
                    parts.append(item['description'])
                if 'question' in item:
                    parts.append(item['question'])
                if 'level' in item:
                    parts.append(f"<i>({item['level']})</i>")
                text = ' - '.join(parts) if parts else str(item)
            else:
                text = str(item)
            
            list_items.append(ListItem(
                Paragraph(text, self.styles['ListItem']),
                bulletColor=self.COLORS['primary']
            ))
        
        return ListFlowable(list_items, bulletType='1')
    
    def _create_bullet_list(self, items: List[Any]) -> ListFlowable:
        """Create a bullet list from items."""
        list_items = []
        for item in items:
            if isinstance(item, str):
                text = self._clean_markdown(item)
            elif isinstance(item, dict):
                parts = []
                if 'title' in item:
                    parts.append(f"<b>{item['title']}</b>")
                if 'description' in item:
                    parts.append(item['description'])
                if 'content' in item:
                    parts.append(item['content'])
                if 'type' in item:
                    parts.insert(0, f"[{item['type']}]")
                text = ' '.join(parts) if parts else str(item)
            else:
                text = str(item)
            
            list_items.append(ListItem(
                Paragraph(text, self.styles['ListItem']),
                bulletColor=self.COLORS['success']
            ))
        
        return ListFlowable(list_items, bulletType='bullet')
    
    def _render_section(self, section_key: str, data: Any) -> List:
        """Render a section based on its type and data."""
        elements = []
        
        # Add section header
        elements.append(self._create_section_header(section_key))
        
        if isinstance(data, str):
            # Simple text section
            elements.append(Paragraph(self._clean_markdown(data), self.styles['CustomBodyText']))
        
        elif isinstance(data, list):
            # List section
            if section_key in ['check_for_understanding', 'oral_questions', 'exit_questions']:
                elements.append(self._create_numbered_list(data))
            else:
                elements.append(self._create_bullet_list(data))
        
        elif isinstance(data, dict):
            # Structured section (like visual_aid_idea)
            if 'title' in data or 'name' in data:
                title = data.get('title') or data.get('name', '')
                elements.append(Paragraph(f"<b>{title}</b>", self.styles['CustomBodyText']))
            
            if 'materials' in data:
                elements.append(Paragraph(f"<b>Materials:</b> {data['materials']}", self.styles['CustomBodyText']))
            
            if 'description' in data or 'instructions' in data:
                desc = data.get('description') or data.get('instructions', '')
                elements.append(Paragraph(self._clean_markdown(desc), self.styles['CustomBodyText']))
            
            if 'usage' in data:
                elements.append(Paragraph(f"<b>How to use:</b> {data['usage']}", self.styles['CustomBodyText']))
        
        elements.append(Spacer(1, 10))
        return elements
    
    def generate_content_pdf(
        self,
        title: str,
        content_type: str,
        description: str,
        structured_data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        author_name: Optional[str] = None,
    ) -> bytes:
        """
        Generate a professional PDF from educational content.
        
        Args:
            title: Content title
            content_type: Type of content (lesson_plan, activity, etc.)
            description: Text description/AI response
            structured_data: Structured JSON from AI response
            metadata: Additional metadata (grade, subject, topic, tags)
            author_name: Name of the content author
            
        Returns:
            PDF file as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        elements = []
        metadata = metadata or {}
        
        # Header section
        elements.append(Paragraph("Pathshala AI Teaching Assistant", self.styles['Footer']))
        elements.append(Spacer(1, 10))
        
        # Title
        elements.append(Paragraph(self._wrap_with_unicode_font(title), self.styles['CustomTitle']))
        
        # Metadata subtitle
        meta_parts = []
        if metadata.get('subject'):
            meta_parts.append(metadata['subject'])
        if metadata.get('grade'):
            meta_parts.append(f"Class {metadata['grade']}")
        meta_parts.append(content_type.replace('_', ' ').title())
        
        elements.append(Paragraph(self._wrap_with_unicode_font(" | ".join(meta_parts)), self.styles['Subtitle']))
        
        # Horizontal line
        elements.append(HRFlowable(
            width="100%",
            thickness=2,
            color=self.COLORS['primary'],
            spaceBefore=5,
            spaceAfter=20
        ))
        
        # If we have structured data, render each section
        if structured_data:
            # Define section order based on content type
            section_order = self._get_section_order(content_type, structured_data)
            
            for section_key in section_order:
                if section_key in structured_data and structured_data[section_key]:
                    elements.extend(self._render_section(section_key, structured_data[section_key]))
        else:
            # Just render the description as body text
            elements.append(Paragraph(self._clean_markdown(description), self.styles['CustomBodyText']))
        
        # Footer information
        elements.append(Spacer(1, 30))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=colors.lightgrey,
            spaceBefore=10,
            spaceAfter=10
        ))
        
        footer_parts = []
        if author_name:
            footer_parts.append(f"Created by: {author_name}")
        footer_parts.append(f"Generated: {datetime.now().strftime('%B %d, %Y')}")
        if metadata.get('tags'):
            footer_parts.append(f"Tags: {', '.join(metadata['tags'])}")
        
        elements.append(Paragraph(" | ".join(footer_parts), self.styles['Footer']))
        elements.append(Paragraph("Generated by Pathshala AI Teaching Assistant - Empowering Teachers Across India", self.styles['Footer']))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _get_section_order(self, content_type: str, structured_data: Dict) -> List[str]:
        """Get the order of sections based on content type."""
        # Check what mode the content was generated in
        has_explain = any(k in structured_data for k in ['conceptual_briefing', 'simple_explanation', 'specific_examples'])
        has_assist = any(k in structured_data for k in ['understanding', 'immediate_action', 'quick_activity'])
        has_plan = any(k in structured_data for k in ['learning_objectives', 'activities', 'exit_questions'])
        
        if has_plan:
            return [
                'learning_objectives',
                'duration_minutes',
                'activities',
                'multi_grade_adaptations',
                'low_tlm_alternatives',
                'exit_questions'
            ]
        elif has_assist:
            return [
                'understanding',
                'immediate_action',
                'mnemonics_hooks',
                'quick_activity',
                'bridge_the_gap',
                'check_progress',
                'for_later'
            ]
        else:  # explain mode or default
            return [
                'conceptual_briefing',
                'simple_explanation',
                'mnemonics_hooks',
                'what_to_say',
                'specific_examples',
                'generic_examples',
                'visual_aid_idea',
                'check_for_understanding',
                'common_misconceptions',
                'oral_questions'
            ]


# Singleton instance
_pdf_service: Optional[PDFGenerationService] = None


def get_pdf_service() -> PDFGenerationService:
    """Get PDF service instance."""
    global _pdf_service
    if _pdf_service is None:
        _pdf_service = PDFGenerationService()
    return _pdf_service
