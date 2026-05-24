# Learning Materials Components

This directory contains components for the learning materials system, including a reusable base component for all learning materials.

## BaseLearningMaterial Component

The `BaseLearningMaterial` component is a reusable UI component that provides a consistent interface for all learning materials. It includes:

- **Video Player Section**: Supports YouTube video embeds and fallback to BaseVideoPlayer
- **Content Display**: Structured content with objectives and key points
- **Quiz System**: Interactive quizzes with scoring
- **Session Management**: Expandable sidebar with course content
- **Progress Tracking**: Session completion and progress indicators

### Usage

```tsx
import { BaseLearningMaterial } from '@/components/learning/base-learning-material';

interface DropdownItem {
  id: string;
  title: string;
  isExpanded?: boolean;
  children?: DropdownItem[];
}

interface LessonContentItem {
  title: string;
  description: string;
  content: string;
  objectives: string[];
  keyPoints: string[];
  quiz?: QuizContent;
  videoUrl?: string; // YouTube video URL
}

// Define your sessions structure
const sessionsStructure: DropdownItem[] = [
  {
    id: 'main-topic',
    title: 'Main Topic »',
    children: [
      { id: 'session-1', title: 'Session 1: Introduction' },
      { id: 'session-2', title: 'Session 2: Core Concepts' }
    ]
  }
];

// Define your content data
const contentData: Record<string, LessonContentItem> = {
  'session-1': {
    title: 'Session 1: Introduction',
    description: 'Introduction to the topic',
    content: 'Your content here...',
    objectives: ['Objective 1', 'Objective 2'],
    keyPoints: ['Key point 1', 'Key point 2'],
    videoUrl: 'https://www.youtube.com/embed/YOUR_VIDEO_ID'
  }
};

export default function YourLearningMaterial() {
  return (
    <BaseLearningMaterial
      title="Your Learning Material Title"
      description="Description of your learning material"
      difficulty="Beginner" // or "Intermediate" or "Advanced"
      duration="30 min"
      sessionsStructure={sessionsStructure}
      contentData={contentData}
    />
  );
}
```

### Features

#### Video Player
- Supports YouTube video embeds via `videoUrl` property
- Falls back to BaseVideoPlayer if no video URL is provided
- Responsive design with aspect ratio maintenance

#### Content Structure
- **Title and Description**: Clear session identification
- **Content**: Rich text content with proper formatting
- **Objectives**: Learning objectives with checkmarks
- **Key Points**: Important takeaways in a grid layout

#### Quiz System
- Interactive multiple-choice questions
- Progress tracking through questions
- Score calculation and results display
- Retake functionality

#### Session Management
- Expandable sidebar with course content
- Session selection and navigation
- Progress indicators
- Session completion tracking

#### Navigation
- Back to lessons button
- Session navigation
- Breadcrumb-style navigation

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | The title of the learning material |
| `description` | `string` | Yes | Description of the learning material |
| `difficulty` | `'Beginner' \| 'Intermediate' \| 'Advanced'` | Yes | Difficulty level |
| `duration` | `string` | Yes | Estimated duration |
| `sessionsStructure` | `DropdownItem[]` | Yes | Structure of sessions and subsessions |
| `contentData` | `Record<string, LessonContentItem>` | Yes | Content for each session |
| `onBack` | `() => void` | No | Custom back navigation handler |

### Content Structure

Each `LessonContentItem` should include:

```tsx
interface LessonContentItem {
  title: string;           // Session title
  description: string;     // Session description
  content: string;         // Main content (supports markdown-like formatting)
  objectives: string[];    // Learning objectives
  keyPoints: string[];     // Key takeaways
  quiz?: QuizContent;      // Optional quiz
  videoUrl?: string;       // Optional YouTube video URL
}
```

### Video URLs

For YouTube videos, use the embed URL format:
```
https://www.youtube.com/embed/VIDEO_ID
```

### Styling

The component uses Tailwind CSS classes and is fully responsive. It follows the existing design system with:

- Consistent card layouts
- Proper spacing and typography
- Responsive grid layouts
- Accessible color schemes
- Interactive hover states

### Examples

See the following files for examples:
- `components/learning/Learning Materials/Crucial Conversations.tsx`
- `components/learning/Learning Materials/Storytelling.tsx`
- `app/learning-lessons/Start_lesson_global/page.tsx`
- `components/learning/learning-material-template.tsx`

### Migration

To migrate existing learning materials to use the base component:

1. Import the `BaseLearningMaterial` component
2. Define your sessions structure and content data
3. Replace the existing component with the base component
4. Add video URLs for YouTube videos
5. Test the functionality

This approach ensures consistency across all learning materials while reducing code duplication and maintenance overhead. 