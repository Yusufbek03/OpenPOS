import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/login';
import { KitchenPage } from './pages/kitchen-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, retry: 2, refetchOnWindowFocus: false },
  },
});

function isAuthenticated() {
  return !!localStorage.getItem('kitchen_token');
}

export function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  if (!authed) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<KitchenPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
