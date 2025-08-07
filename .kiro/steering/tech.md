# Technology Stack

## Framework & Runtime
- **Next.js 15** with App Router for full-stack React development
- **React 18** with server and client components
- **TypeScript 5** for type safety and developer experience
- **Node.js 18+** runtime environment

## Styling & UI
- **Tailwind CSS 3** for utility-first styling
- **SVG** for mathematical visualizations and animations
- **CSS-in-JS** only when dynamic styles are required
- Custom `cn` utility combining `clsx` and `tailwind-merge`

## Architecture Patterns
- **ECS (Entity Component System)** for data management
- **Event-driven architecture** for system communication
- **Component-based design** with clear separation of concerns
- **Query system** for efficient data retrieval

## Testing & Quality
- **Vitest** for unit testing with jsdom environment
- **Playwright** for E2E testing
- **React Testing Library** for component testing
- **ESLint** with TypeScript and React rules
- **Prettier** for code formatting
- **Husky** for git hooks with lint-staged

## Development Tools
- **Storybook** for component documentation
- **MSW (Mock Service Worker)** for API mocking
- **TypeScript path aliases** (`@/*` patterns)
- **Hot reload** and **Fast Refresh** for development

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run E2E tests
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

### Documentation
```bash
npm run storybook    # Start Storybook dev server
npm run build-storybook # Build Storybook
```

## Performance Considerations
- Server-side rendering by default
- Client components only when necessary (`'use client'`)
- Lazy loading for heavy components
- Memoization with `React.memo`, `useMemo`, `useCallback`
- SVG optimization for mathematical visualizations