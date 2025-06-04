import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * 404 Not Found page component
 */
function NotFound(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-gray-400" />
          <h1 className="mt-4 text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h2>
          <p className="mt-4 text-lg text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
          <Link to="/customers" className="btn-outline">
            Browse Customers
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please{' '}
            <a href="mailto:support@example.com" className="text-connect-600 hover:text-connect-500">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;