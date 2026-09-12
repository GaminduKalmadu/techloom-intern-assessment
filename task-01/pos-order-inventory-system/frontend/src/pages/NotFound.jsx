import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-card">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
            404 Error
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
          <p className="text-sm text-slate-500">
            The page or feature you are trying to access does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" icon={Home} className="w-full">
              Back to Dashboard
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <Button variant="outline" icon={ArrowLeft} className="w-full">
              Go Back
            </Button>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
