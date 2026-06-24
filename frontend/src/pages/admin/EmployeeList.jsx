import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import FilterBar from '../../components/ui/FilterBar';
import {
  getEmployees,
  deactivateEmployee,
  activateEmployee,
} from '../../services/employeeService';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const res = await getEmployees(params);
      setEmployees(res.data || res.employees || []);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleToggleStatus = async (emp) => {
    try {
      if (emp.status === 'active') {
        await deactivateEmployee(emp.id || emp._id);
        toast.success(`${emp.name} deactivated`);
      } else {
        await activateEmployee(emp.id || emp._id);
        toast.success(`${emp.name} activated`);
      }
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
    setConfirmDialog(null);
  };

  const confirmToggle = (emp) => {
    const isActive = emp.status === 'active';
    setConfirmDialog({
      title: isActive ? 'Deactivate Employee' : 'Activate Employee',
      message: `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} ${emp.name}?`,
      type: isActive ? 'danger' : 'warning',
      onConfirm: () => handleToggleStatus(emp),
    });
  };

  const filterConfig = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      options: [
        { value: 'Sales', label: 'Sales' },
        { value: 'Operations', label: 'Operations' },
        { value: 'Quality', label: 'Quality' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  const columns = [
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    {
      key: 'role',
      label: 'Role',
      render: (val) => <StatusBadge status={val || 'employee'} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/employees/${row.id || row._id}`}
            className="px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
          >
            View
          </Link>
          <Link
            to={`/admin/employees/${row.id || row._id}`}
            className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => confirmToggle(row)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              row.status === 'active'
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50'
            }`}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employees</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage all employees</p>
        </div>
        <Link
          to="/admin/employees/new"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <span>+</span> Add Employee
        </Link>
      </div>

      <FilterBar filters={filterConfig} onFilter={setFilters} />

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="No employees found."
        searchable={false}
      />

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
