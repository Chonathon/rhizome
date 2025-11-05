# Rhizome

An interactive music discovery and visualization application that maps relationships between music genres and artists using force-directed graphs.

## About

Rhizome helps you explore the interconnected world of music through visual graphs. Like a rhizome plant structure, it visualizes the complex networks between genres, subgenres, and artists, allowing you to discover new music through their relationships and influences.

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6** - Build tool with HMR
- **React Router 7** - Client-side routing
- **Tailwind CSS 4** - Styling framework
- **Framer Motion 12** - Animations
- **React Force Graph 2D** - Graph visualizations
- **D3 Force** - Physics simulation
- **ShadCN UI/Radix UI** - Component primitives
- **Better Auth** - Authentication
- **Lucide React** - Icons
- **Next Themes** - Theme management

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rizhome.git
cd rizhome
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Available Scripts

- `npm run dev` - Start the development server with network access
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality


## Backend Integration

The frontend connects to the Rhizome API server:
- Production: `https://rhizome-server-production.up.railway.app`
- Development: `https://rhizome-server-development.up.railway.app`

Vite proxy is configured for local development to handle CORS.

## Contributing

We welcome contributions and feedback! If you encounter issues with the music data (incorrect genre relationships, missing artists, etc.), please use the in-app feedback tools or open an issue on GitHub.
