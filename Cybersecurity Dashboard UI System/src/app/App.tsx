/**
 * App Component
 * =============
 * Root component that wraps the entire application in React Router's
 * `RouterProvider`. All route definitions are imported from `./routes.ts`.
 * This component is mounted by `main.tsx` into the DOM root.
 */
import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}
