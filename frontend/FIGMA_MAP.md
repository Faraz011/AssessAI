# Figma Design System & Component Map

## File Info

- **Figma Design File**: VedaAI - Hiring Assignment
- **File URL**: https://www.figma.com/design/2PifuhfsyGdRvvFOug4Sjo/VedaAI---Hiring-Assignment
- **Last Updated**: 2025-05-21
- **Status**: Section 0 - Initial Framework

---

## Design System Tokens

All design tokens have been extracted and exported in [frontend/src/styles/tokens.ts](../src/styles/tokens.ts).

### Color Palette

| Token        | Value     | Usage                            |
| ------------ | --------- | -------------------------------- |
| Primary      | `#0ea5e9` | Buttons, links, active states    |
| Success      | `#10b981` | Success badges, validated states |
| Warning      | `#f59e0b` | Warning messages, caution states |
| Error        | `#ef4444` | Error messages, deletions        |
| Text Primary | `#1f2937` | Body text, headings              |
| Surface      | `#ffffff` | Cards, containers                |

### Typography

| Token           | Value             | Usage            |
| --------------- | ----------------- | ---------------- |
| Font Family     | System sans-serif | All text         |
| Size - Display  | 36px (4xl)        | Page titles      |
| Size - Heading  | 24px (2xl)        | Section headings |
| Size - Body     | 16px (base)       | Body content     |
| Size - Small    | 14px (sm)         | Labels, captions |
| Weight - Bold   | 700               | Headings         |
| Weight - Medium | 500               | Emphasis         |
| Weight - Normal | 400               | Body text        |

### Spacing & Sizing

- **Base Unit**: 4px (1 rem = 16px)
- **Padding**: 4px, 8px, 12px, 16px, 24px, 32px
- **Margins**: 4px, 8px, 12px, 16px, 24px, 32px
- **Gap**: 4px, 8px, 12px, 16px, 24px

### Border Radius

| Token  | Value  | Usage             |
| ------ | ------ | ----------------- |
| Small  | 2px    | Tight controls    |
| Base   | 4px    | Input fields      |
| Medium | 6px    | Cards, containers |
| Large  | 8px    | Modals, panels    |
| Full   | 9999px | Badges, pills     |

---

## Screen Mappings (Node ID → React Component)

### Screen 1: Assignment Creation Form

**Node ID**: `[Frame-Assignment-Creation]`  
**Component**: [AssignmentForm.tsx](../src/components/AssignmentForm.tsx)  
**Route**: `/` (homepage)  
**Description**: Main form for creating a new assessment assignment.

**Sub-components**:

- **Input**: `[Frame-Input-TextMultiline]` → [FileDropzone.tsx](../src/components/FileDropzone.tsx)
- **Chips**: `[Frame-QuestionType-Chips]` → [QuestionTypeChips.tsx](../src/components/QuestionTypeChips.tsx)
- **Spinner**: `[Frame-SectionCount-Input]` → [SectionCountInput.tsx](../src/components/SectionCountInput.tsx)
- **Button - Primary**: `[Frame-Button-Primary]` → [ui/Button.tsx](../src/components/ui/Button.tsx)
- **Form Layout**: [layout.tsx](../src/app/layout.tsx)

**Form Fields**:

1. Document Upload (PDF/TXT)
2. Question Types (MCQ, Short Answer, Essay, Fill-in-the-blank)
3. Section Count (number input with increment/decrement)
4. Difficulty Distribution (sliders)
5. Student Info (checkboxes)
6. Submit Button

---

### Screen 2: Generation/Loading State

**Node ID**: `[Frame-Generation-Loading]`  
**Component**: [JobStatusCard.tsx](../src/components/JobStatusCard.tsx)  
**Route**: `/output/[jobId]` (dynamic)  
**Description**: Real-time status display while question paper is being generated.

**Sub-components**:

- **Progress Bar**: `[Frame-Progress-Bar]` → [JobStatusCard.tsx](../src/components/JobStatusCard.tsx)
- **Status Badge**: `[Frame-Status-Badge]` → [ui/Badge.tsx](../src/components/ui/Badge.tsx)
- **Loading Spinner**: `[Frame-Spinner]` → [JobStatusCard.tsx](../src/components/JobStatusCard.tsx)
- **Cost Display**: `[Frame-Cost-Display]` → [JobStatusCard.tsx](../src/components/JobStatusCard.tsx)

**Display Elements**:

1. Job ID
2. Status (Queued, Processing, Validating, Complete)
3. Progress percentage
4. Estimated cost (tokens × rate)
5. Processing time elapsed
6. Cancel button (if cancellable)
7. WebSocket live updates

---

### Screen 3: Output Question Paper

**Node ID**: `[Frame-Question-Paper]`  
**Component**: [QuestionPaper.tsx](../src/components/QuestionPaper.tsx)  
**Route**: `/output/[jobId]` (after generation complete)  
**Description**: Rendered exam paper with all sections and questions.

**Sub-components**:

- **Student Info Section**: `[Frame-StudentInfo-Section]` → [StudentInfoSection.tsx](../src/components/StudentInfoSection.tsx)
- **Question Card**: `[Frame-Question-Card]` → [ui/Card.tsx](../src/components/ui/Card.tsx)
- **Difficulty Badge**: `[Frame-Difficulty-Badge]` → [DifficultyBadge.tsx](../src/components/DifficultyBadge.tsx)
- **Regenerate Menu**: `[Frame-Regenerate-Menu]` → [RegenerateMenu.tsx](../src/components/RegenerateMenu.tsx)
- **Download Button**: `[Frame-Button-Download]` → [ui/Button.tsx](../src/components/ui/Button.tsx)

**Paper Structure**:

1. Header (student info, exam title, date)
2. Instructions section
3. Question sections (grouped by type)
4. Each question with:
   - Question text
   - Difficulty badge
   - Marks allocation
   - Options (for MCQ)
   - Blank space for answers
5. Footer (page numbers, marking scheme)

---

## UI Component Library Mappings

| Component          | Node ID                    | Location                                             | Props                                         |
| ------------------ | -------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| Button (Primary)   | `[Frame-Button-Primary]`   | [ui/Button.tsx](../src/components/ui/Button.tsx)     | `variant`, `size`, `disabled`, `children`     |
| Button (Secondary) | `[Frame-Button-Secondary]` | [ui/Button.tsx](../src/components/ui/Button.tsx)     | `variant`, `size`, `disabled`, `children`     |
| Input Field        | `[Frame-Input-Text]`       | [ui/Input.tsx](../src/components/ui/Input.tsx)       | `label`, `placeholder`, `error`, `disabled`   |
| Select/Dropdown    | `[Frame-Select-Dropdown]`  | [ui/Select.tsx](../src/components/ui/Select.tsx)     | `options`, `value`, `onChange`, `placeholder` |
| Badge              | `[Frame-Badge-Neutral]`    | [ui/Badge.tsx](../src/components/ui/Badge.tsx)       | `variant`, `children`                         |
| Card               | `[Frame-Card]`             | [ui/Card.tsx](../src/components/ui/Card.tsx)         | `children`, `padding`, `border`               |
| Checkbox           | `[Frame-Checkbox]`         | [ui/Checkbox.tsx](../src/components/ui/Checkbox.tsx) | `label`, `checked`, `onChange`, `disabled`    |
| Text Chip          | `[Frame-Chip-Text]`        | [ui/Chip.tsx](../src/components/ui/Chip.tsx)         | `label`, `selected`, `onClick`, `variant`     |

---

## Design System Variables

### CSS Variables (Tailwind)

All tokens are mapped to Tailwind CSS configuration:

- Colors: `--color-primary`, `--color-success`, etc.
- Spacing: `--spacing-*`
- Typography: `--font-*`, `--text-size-*`
- Shadows: `--shadow-*`
- Border Radius: `--radius-*`

### TypeScript Interfaces (types/index.ts)

All design tokens are exported as TypeScript types for component prop validation.

---

## Asset References

No external assets (icons, illustrations) are mapped at this stage.  
Icons will use Lucide React throughout the application.

---

## Implementation Notes

### Color Contrast

All color combinations meet WCAG AA standards for accessibility.

### Responsive Design

- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Components scale appropriately across breakpoints

### State Variants

- Hover states: Lighter/darker tint of base color
- Active states: More saturated color
- Disabled states: Gray (--color-disabled)
- Error states: Error color (--color-error)

---

## Revision History

| Date       | Author       | Changes                   |
| ---------- | ------------ | ------------------------- |
| 2025-05-21 | AI Assistant | Initial setup - Section 0 |

---

## Contact

For design system updates or component changes, refer to the Figma file.  
For implementation questions, see the [architecture/design-doc.md](../architecture/design-doc.md).
