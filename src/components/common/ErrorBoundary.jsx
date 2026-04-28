import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
          <div className="bg-surface-card border border-white/[0.04] p-8 rounded-2xl max-w-md w-full text-center">
            <div className="w-14 h-14 bg-urgent-high/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Something went wrong
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              The application encountered an unexpected error.
            </p>
            <button
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
