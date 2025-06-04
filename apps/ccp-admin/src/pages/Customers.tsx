import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CloudArrowUpIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useCustomers } from '@/services';

/**
 * Status badge component
 */
function StatusBadge({
  status,
}: {
  status: 'active' | 'inactive' | 'pending';
}): React.ReactElement {
  const styles = {
    active: 'badge-success',
    inactive: 'badge-gray',
    pending: 'badge-warning',
  };

  return (
    <span className={`badge ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/**
 * Environment badge component
 */
function EnvironmentBadge({
  environment,
}: {
  environment: 'development' | 'staging' | 'production';
}): React.ReactElement {
  const styles = {
    development: 'badge-warning',
    staging: 'badge-primary',
    production: 'badge-success',
  };

  return (
    <span className={`badge ${styles[environment]}`}>
      {environment.charAt(0).toUpperCase() + environment.slice(1)}
    </span>
  );
}

/**
 * Customers page component
 */
function Customers(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'pending' | 'all'>(
    'all'
  );

  const { data } = useCustomers();
  const customers = data?.items ?? [];
  const summary = data?.summary;

  // Filter customers based on search and status
  const filteredCustomers = useMemo(
    () =>
      customers.filter(customer => {
        const matchesSearch =
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.branding.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase());

        const status = customer.isActive ? 'active' : 'inactive';
        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [customers, searchTerm, statusFilter]
  );

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-3xl font-bold text-gray-900'>Customer Management</h2>
          <p className='mt-2 text-gray-600'>Manage customer configurations and deployments</p>
        </div>
        <button className='btn-primary'>
          <PlusIcon className='h-5 w-5 mr-2' />
          Add Customer
        </button>
      </div>

      {/* Filters and search */}
      <div className='card p-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Search */}
          <div className='flex-1'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type='text'
                className='input pl-10'
                placeholder='Search customers...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status filter */}
          <div className='sm:w-48'>
            <select
              className='input'
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as 'active' | 'inactive' | 'pending' | 'all')
              }
            >
              <option value='all'>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
              <option value='pending'>Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className='flex justify-between items-center text-sm text-gray-600'>
        <span>
          Showing {filteredCustomers.length} of {customers.length} customers
        </span>
        <span>
          Total: {summary?.totalActive ?? 0} active, {summary?.totalInactive ?? 0} inactive
        </span>
      </div>

      {/* Customer table */}
      <div className='card overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='table'>
            <thead className='table-header'>
              <tr>
                <th className='table-header-cell'>Customer</th>
                <th className='table-header-cell'>Status</th>
                <th className='table-header-cell'>Environment</th>
                <th className='table-header-cell'>Modules</th>
                <th className='table-header-cell'>Last Deployment</th>
                <th className='table-header-cell'>Updated</th>
                <th className='table-header-cell'>Actions</th>
              </tr>
            </thead>
            <tbody className='table-body'>
              {filteredCustomers.map(customer => (
                <tr key={customer.customer_id} className='table-body-row'>
                  <td className='table-body-cell'>
                    <div>
                      <div className='font-medium text-gray-900'>{customer.name}</div>
                      <div className='text-gray-500'>{customer.branding.company_name}</div>
                      <div className='text-xs text-gray-400'>{customer.customer_id}</div>
                    </div>
                  </td>
                  <td className='table-body-cell'>
                    <StatusBadge status={customer.isActive ? 'active' : 'inactive'} />
                  </td>
                  <td className='table-body-cell'>
                    <EnvironmentBadge environment={customer.deployment.environment} />
                  </td>
                  <td className='table-body-cell'>
                    <span className='text-gray-900 font-medium'>{customer.modules.length}</span>
                    <span className='text-gray-500 text-sm ml-1'>modules</span>
                  </td>
                  <td className='table-body-cell'>
                    <div className='text-gray-900'>N/A</div>
                  </td>
                  <td className='table-body-cell'>
                    <div className='text-gray-900'>
                      {new Date(customer.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className='table-body-cell'>
                    <div className='flex items-center space-x-2'>
                      <Link
                        to={`/customers/${customer.customer_id}`}
                        className='p-1 text-gray-400 hover:text-connect-600 hover:bg-connect-50 rounded'
                        title='View details'
                      >
                        <EyeIcon className='h-4 w-4' />
                      </Link>
                      <button
                        className='p-1 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded'
                        title='Edit configuration'
                      >
                        <PencilIcon className='h-4 w-4' />
                      </button>
                      <button
                        className='p-1 text-gray-400 hover:text-connect-600 hover:bg-connect-50 rounded'
                        title='Deploy configuration'
                      >
                        <CloudArrowUpIcon className='h-4 w-4' />
                      </button>
                      <button
                        className='p-1 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded'
                        title='Delete customer'
                      >
                        <TrashIcon className='h-4 w-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredCustomers.length === 0 && (
          <div className='text-center py-12'>
            <UserGroupIcon className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No customers found</h3>
            <p className='mt-1 text-sm text-gray-500'>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first customer configuration.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className='mt-6'>
                <button className='btn-primary'>
                  <PlusIcon className='h-5 w-5 mr-2' />
                  Add Customer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
