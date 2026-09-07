import type { ReactNode } from 'react';

interface AppShellProps {
  brand: ReactNode;
  children: ReactNode;
  navigation: ReactNode;
  aside?: ReactNode;
}

export function AppShell({ brand, children, navigation, aside }: AppShellProps) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-white px-4 py-3 text-plum-900 focus:not-sr-only"
      >
        Skip to content
      </a>
      <header className="bg-plum-950 text-white">
        <div className="mx-auto flex min-h-20 max-w-[1480px] items-center gap-5 px-5 sm:gap-8 sm:px-8 lg:px-12">
          {brand}
          <span className="h-8 w-px bg-white/15" aria-hidden="true" />
          {navigation}
          {aside ? <div className="ml-auto hidden sm:block">{aside}</div> : null}
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1480px] px-5 py-8 focus:outline-none sm:px-8 lg:px-12 lg:py-10"
      >
        {children}
      </main>
    </>
  );
}
