import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

/**
 * Robust, production-grade Error Boundary that completely prevents
 * white screen crashes across the entire application.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopy = () => {
    const text = `Error: ${this.state.error?.message || 'Unknown error'}\n\nStack:\n${
      this.state.error?.stack || ''
    }\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  render() {
    if (this.state.hasError) {
      const isCompact = this.props.compact;
      const customFallback = this.props.fallback;

      if (customFallback) {
        return typeof customFallback === 'function'
          ? customFallback({ error: this.state.error, reset: this.handleReset })
          : customFallback;
      }

      // Compact view for widgets/cards
      if (isCompact) {
        return (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Widget failed to load</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              {this.state.error?.message || 'An unexpected rendering error occurred in this component.'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        );
      }

      // Full-page or major section fallback
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground">
                The application encountered an unexpected error while displaying this view. The system prevented a blank screen and preserved your session.
              </p>
            </div>

            {/* Error Message Pill */}
            <div className="p-3.5 rounded-xl bg-secondary/60 border border-border text-left font-mono text-xs text-rose-400 break-words">
              <strong>Error:</strong> {this.state.error?.message || 'Unknown runtime exception'}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </a>
            </div>

            {/* Expandable Technical Details */}
            <div className="pt-2 border-t border-border/70 text-left">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-between w-full py-1 cursor-pointer"
              >
                <span className="font-semibold">Technical Diagnostic Details</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Stack Trace</span>
                    <button
                      type="button"
                      onClick={this.handleCopy}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Trace</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 text-[11px] font-mono overflow-x-auto max-h-52 border border-border">
                    {this.state.error?.stack || 'No stack trace available'}
                    {this.state.errorInfo?.componentStack || ''}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
