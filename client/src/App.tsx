import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { store, RootState, AppDispatch } from '@/store';
import { fetchMe } from '@/store/authSlice';
import { fetchNotifications } from '@/store/notifSlice';
import { useSocket } from '@/hooks/useSocket';

// Pages
import LandingPage from '@/pages/Landing';
import { LoginPage, RegisterPage } from '@/pages/auth/AuthPages';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/student/Dashboard';
import { NotesPage, UploadNotePage } from '@/pages/notes/NotesPages';
import { BlogsPage, BlogEditorPage } from '@/pages/blogs/BlogsPages';
import { LeaderboardPage, AIAssistantPage, RoadmapsPage } from '@/pages/misc/MiscPages';
import {
  ProfilePage, DiscussionsPage, ChatPage,
  AdminPanel, SettingsPage,
} from '@/pages/AllPages';
import { ProtectedRoute, OAuthCallback } from '@/components/auth/ProtectedRoute';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function AppCore() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, user } = useSelector((s: RootState) => s.auth);

  // Boot: fetch user if token exists
  useEffect(() => {
    if (accessToken) {
      dispatch(fetchMe());
    }
  }, []);

  // Fetch notifications when user loads
  useEffect(() => {
    if (user) dispatch(fetchNotifications());
  }, [user]);

  // Connect socket
  useSocket(accessToken);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* App (protected) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/upload" element={<UploadNotePage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/new" element={<BlogEditorPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/roadmaps" element={<RoadmapsPage />} />
          <Route path="/ai" element={<AIAssistantPage />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:userId" element={<ChatPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
          } />

          {/* Teacher dashboard (same as student for now, role-gated) */}
          <Route path="/teacher" element={
            <ProtectedRoute roles={['teacher', 'admin']}><Dashboard /></ProtectedRoute>
          } />
        </Route>

        {/* Public browse (optional auth) */}
        <Route path="/explore" element={<AppLayout />}>
          <Route index element={<NotesPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#161b22', border: '1px solid #30363d', color: '#f0f6fc' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0d1117' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0d1117' } },
        }}
      />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppCore />
      </QueryClientProvider>
    </Provider>
  );
}
