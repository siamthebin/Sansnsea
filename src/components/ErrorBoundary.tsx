import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      let isFirestoreError = false;
      let firestoreErrorInfo = null;

      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError && parsedError.operationType) {
          isFirestoreError = true;
          firestoreErrorInfo = parsedError;
        }
      } catch (e) {
        // Not a JSON string, which is fine
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong.
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We're sorry, but an error occurred while processing your request.
              </p>
            </div>
            
            {isFirestoreError ? (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Database Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p><strong>Operation:</strong> {firestoreErrorInfo.operationType}</p>
                      <p><strong>Path:</strong> {firestoreErrorInfo.path}</p>
                      <p><strong>Error:</strong> {firestoreErrorInfo.error}</p>
                      {firestoreErrorInfo.error.includes('Missing or insufficient permissions') && (
                        <p className="mt-2 font-semibold">You do not have permission to perform this action. Please check your account role or try logging in again.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this.props as any).children;
  }
}
