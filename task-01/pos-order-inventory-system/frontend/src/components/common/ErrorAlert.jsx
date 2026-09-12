import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorAlert = ({
  title = 'Something went wrong',
  message,
  errors = null,
  onRetry = null,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`p-4 rounded-2xl border border-rose-200 bg-rose-50/70 text-rose-900 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg bg-rose-100 text-rose-600 shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          {message && <p className="text-xs text-rose-700 mt-1">{message}</p>}

          {errors && errors.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:text-rose-900 cursor-pointer"
              >
                {showDetails ? 'Hide details' : 'Show details'}
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showDetails && (
                <ul className="mt-2 text-xs space-y-1 bg-white/70 p-2.5 rounded-lg border border-rose-200/60 font-mono">
                  {errors.map((err, idx) => (
                    <li key={idx} className="text-rose-800">
                      <span className="font-semibold">{err.field || 'Error'}:</span> {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            icon={RefreshCw}
            className="border-rose-300 text-rose-800 hover:bg-rose-100 hover:text-rose-900 shrink-0"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
