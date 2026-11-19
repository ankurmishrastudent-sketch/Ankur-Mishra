import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let parsedMessage = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        parsedMessage = `${parsed.error} (Operation: ${parsed.operationType || 'unknown'} on ${parsed.path || 'unknown'})`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: parsedMessage };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8] dark:bg-[#0B0D10] px-6 py-12">
          <div className="max-w-lg w-full rounded-2xl border border-[#E4E4E7] dark:border-[#23272F] bg-white dark:bg-[#12161C] p-8">
            <h1 className="font-display text-2xl font-semibold text-[#111315] dark:text-[#F3F4F6] mb-3">
              Something went wrong
            </h1>
            <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed mb-6 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
