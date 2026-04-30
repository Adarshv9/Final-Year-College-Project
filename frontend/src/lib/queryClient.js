// Configures React Query caching and request behavior.

import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {


      retry: 1,
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});

export default queryClient;