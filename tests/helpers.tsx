import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/providers/ThemeProvider';

/**
 * Creates a fresh QueryClient for each test to avoid cache sharing.
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperOptions {
  readonly initialThemeMode?: 'light' | 'dark' | 'system';
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  readonly wrapperOptions?: WrapperOptions;
}

/**
 * Renders a component wrapped with all necessary providers for testing.
 * Includes ThemeProvider and QueryProvider by default.
 */
function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> {
  const { wrapperOptions, ...renderOptions } = options;
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialMode={wrapperOptions?.initialThemeMode ?? 'system'}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export { renderWithProviders, createTestQueryClient };
export type { WrapperOptions, CustomRenderOptions };
