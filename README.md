# Intent Marketplace - Modern UI

A beautiful, responsive Intent-Based Skill & Collaboration Marketplace built with **Next.js**, **React 18**, **Tailwind CSS**, **TypeScript**, and **Express.js**.

⚠️ **Note:** This project now uses a separate Express backend for authentication. See [Backend Setup Guide](./BACKEND_SETUP.md) to run both servers.

## Features

✨ **Modern Design**
- Clean, minimal interface with soft pastel green color palette (#E5EEE4)
- Responsive design (mobile, tablet, desktop)
- Smooth transitions and subtle animations
- Professional typography and spacing

🎯 **Pages & Components**
- **Login/Register** - Secure authentication UI
- **Dashboard** - Intent listing with search and filtering
- **Create Intent** - Form to post new projects
- **Skills** - Browse and discover collaborators
- **Chat** - Real-time messaging interface
- **Reusable Components** - Button, Input, Card, Avatar, Badge, Header

⚙️ **Backend Architecture**
- Express.js server with MVC pattern
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Supabase PostgreSQL database
- Input validation and error handling

🚀 **Technology Stack**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- TypeScript
- Lucide React Icons

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project

### Installation

1. **Clone the repository and navigate to the project:**
```bash
cd intent
```

2. **Install frontend dependencies:**
```bash
npm install
# or
yarn install
```

3. **Install backend dependencies:**
```bash
cd server
npm install
cd ..
```

4. **Configure environment variables:**
   - Backend: Copy `server/.env.example` to `server/.env` and fill in Supabase credentials
   - Frontend: Already configured in `.env.local` to point to `http://localhost:5000`

5. **Run both servers:**

**Terminal 1 - Backend (Express):**
```bash
cd server
npm run dev
# Listening on http://localhost:5000
```

**Terminal 2 - Frontend (Next.js):**
```bash
npm run dev
# or
yarn dev
# Listening on http://localhost:3001
```

6. **Open your browser:**
Navigate to http://localhost:3001

### Quick Start

For a faster setup, both servers can be started in separate terminals:

```bash
# Build script for production
npm run build
npm start
```

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed backend configuration and troubleshooting.

## Project Structure

```
intent/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Login/Register page
│   ├── globals.css              # Global styles & Tailwind imports
│   ├── dashboard/               # Dashboard page
│   │   └── page.tsx
│   ├── create/                  # Create Intent page
│   │   └── page.tsx
│   ├── skills/                  # Skills listing page
│   │   └── page.tsx
│   └── chat/                    # Chat page
│       └── page.tsx
├── components/                   # Reusable components
│   ├── Avatar.tsx              # User avatar component
│   ├── Badge.tsx               # Badge component
│   ├── Button.tsx              # Button component
│   ├── Card.tsx                # Card component
│   ├── Header.tsx              # Navigation header
│   └── Input.tsx               # Input field component
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── next.config.js               # Next.js configuration
└── package.json                 # Project dependencies
```

## Color Palette

- **Primary (Sage Light)**: #E5EEE4
- **Text Dark**: #1F2937
- **Background**: #FFFFFF
- **Secondary**: #D4E6D3
- **Accents**: Various gray shades

## Component API

### Button
```tsx
<Button 
  variant="primary" | "secondary" | "outline" | "ghost"
  size="sm" | "md" | "lg"
  fullWidth={false}
  onClick={handleClick}
>
  Click me
</Button>
```

### Input
```tsx
<Input 
  label="Email"
  name="email"
  type="email"
  placeholder="you@example.com"
  error="Error message"
  helperText="Helper text"
  icon={<MailIcon />}
/>
```

### Card
```tsx
<Card 
  hoverEffect={false}
  onClick={handleClick}
  className="custom-class"
>
  Card content
</Card>
```

### Avatar
```tsx
<Avatar 
  name="John Doe"
  src="https://..."
  size="sm" | "md" | "lg" | "xl"
/>
```

### Badge
```tsx
<Badge variant="sage" | "gray" | "blue" | "green" | "red">
  Badge text
</Badge>
```

## Features Implemented

### Login/Register Page
- Toggle between login and register forms
- Form validation
- Social login options
- Responsive design
- Email and password fields with icons

### Dashboard
- Search and filter intents
- Intent cards with rich information
- Sort by status (Looking, In Progress, Completed)
- Statistics cards
- Member avatars with overflow handling
- Budget and timeline information

### Create Intent Form
- Multi-step form design
- Skill adding/removing
- File upload area
- Form validation with error messages
- Category selection
- Budget and timeline inputs

### Skills Page
- Collaborator cards
- Rating and reviews display
- Availability status
- Top skills with proficiency levels
- Sorting by rating and price
- Search functionality

### Chat Interface
- Conversation list with unread badges
- Online/offline status indicators
- Message history
- Real-time message sending
- User avatars and presence indicators
- Call and video call buttons
- Responsive layout

## Styling

The project uses Tailwind CSS with custom configuration for:
- Sage color palette
- Custom shadows (subtle, soft)
- Border radius utilities
- Extended spacing

### Custom Tailwind Classes
```css
/* Colors */
bg-sage-light      /* #E5EEE4 */
text-sage-dark     /* #1F2937 */

/* Shadows */
shadow-subtle      /* Light shadow */
shadow-soft        /* Medium shadow */

/* Border Radius */
rounded-soft       /* 12px radius */
```

## Usage Examples

### Creating a new page with Header

```tsx
import Header from '@/components/Header'
import Button from '@/components/Button'

export default function NewPage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900">Welcome</h1>
        <Button variant="primary" size="lg">Get Started</Button>
      </main>
    </div>
  )
}
```

## Responsive Design

All pages are built with mobile-first approach using Tailwind CSS breakpoints:
- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up

## Building for Production

```bash
npm run build
npm run start
```

## Best Practices

1. **Component Reusability** - Use existing components instead of creating new ones
2. **Tailwind Classes** - Leverage Tailwind for consistency
3. **TypeScript** - Use proper typing for props
4. **Accessibility** - Ensure semantic HTML and proper ARIA labels
5. **Responsive** - Test on different screen sizes

## Future Enhancements

- Dark mode support
- Animations and transitions
- API integration
- Authentication system
- Real-time notifications
- Advanced filtering and sorting
- User profiles
- Project templates
- Analytics dashboard

## License

MIT License - feel free to use for your projects

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using Next.js and Tailwind CSS
