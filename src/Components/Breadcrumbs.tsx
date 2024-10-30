import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const pathNameMap: { [key: string]: string } = {
    invoicecreation: 'Invoice Creation',
    invoices: 'Invoices',
  };

  return (
    <nav className="fixed top-4 left-4 text-sm text-gray-600 bg-white p-2 rounded shadow">
      
      <ul className="flex items-center space-x-2">
        <li>
          <Link to="/" className="text-blue-600 hover:underline">
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const path = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = pathNameMap[value] || value;

          return (
            <li key={path} className="flex items-center">
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="font-semibold text-gray-800">{displayName}</span>
              ) : (
                <Link to={path} className="text-blue-600 hover:underline">
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default Breadcrumbs;
