import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import Button from '../components/common/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-rose-200 shadow-card">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                Application Error
              </span>
              <h2 className="text-2xl font-bold text-slate-900">An unexpected error occurred</h2>
              <p className="text-sm text-slate-500">
                Our application encountered an error while rendering this view.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-xl text-left font-mono text-xs text-slate-700 overflow-x-auto border border-slate-200">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={this.handleReload}
                className="w-full sm:w-auto"
              >
                Reload Application
              </Button>
              <Button
                variant="outline"
                icon={Home}
                onClick={this.handleReset}
                className="w-full sm:w-auto"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
