import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Search, Filter, Edit2, Trash2, X, Check,
  AlertCircle, RefreshCw, Mail, Phone, ShieldCheck, User, Building,
  CheckCircle2, Ban, Lock
} from 'lucide-react';
import {
  getUsers, createUser, updateUser, deleteUser, getUsersLookup
} from '../services/superadminApi';

export const UserManagementTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Dropdown Lookups (for assigning landlord to tenant)
  const [landlordsList, setLandlordsList] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'landlord',
    status: 'active',
    plan: 'starter',
    password: '',
    landlord: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUsers({
        role: roleFilter,
        status: statusFilter,
        search,
      });
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load platform users');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const data = await getUsersLookup();
      setLandlordsList(data.landlords || []);
    } catch (err) {
      console.error('Failed to load landlords lookup:', err);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    fetchLookups();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'landlord',
      status: 'active',
      plan: 'starter',
      password: '',
      landlord: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'landlord',
      status: u.status || 'active',
      plan: u.plan || 'starter',
      password: '', // Leave blank unless changing
      landlord: u.landlord?._id || u.landlord || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await updateUser(editingUser._id, payload);
        setSuccessMsg(`User "${formData.firstName} ${formData.lastName}" updated successfully.`);
      } else {
        if (!formData.password) {
          throw new Error('Password is required for new users');
        }
        await createUser(formData);
        setSuccessMsg(`User "${formData.firstName} ${formData.lastName}" created successfully.`);
      }
      setIsModalOpen(false);
      await fetchUsersData();
      await fetchLookups();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteUser(id);
      setSuccessMsg(`User "${name}" deleted successfully.`);
      await fetchUsersData();
      await fetchLookups();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Superadmin</span>;
      case 'landlord':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Landlord</span>;
      case 'tenant':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Tenant</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D111D] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-grotesk text-white">Platform Users Registry</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Direct database CRUD for Landlords, Tenants, and Superadmins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsersData}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition btn-press cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-grotesk text-xs flex items-center gap-2 transition btn-press shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="cursor-pointer text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="cursor-pointer text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0D111D] border border-slate-800 rounded-2xl p-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or phone number..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="landlord">Landlords</option>
            <option value="tenant">Tenants</option>
            <option value="superadmin">Superadmins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0D111D] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070A12] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5">Parent Landlord</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading platform users from database...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-grotesk text-xs">
                          {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-white font-grotesk font-semibold block text-sm">
                            {u.firstName} {u.lastName}
                          </strong>
                          <span className="text-[10px] text-slate-500">ID: {u._id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {u.landlord ? (
                        <span className="text-slate-300 font-medium">
                          {u.landlord.firstName} {u.landlord.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u._id, `${u.firstName} ${u.lastName}`)}
                          disabled={deletingId === u._id}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-rose-400 transition cursor-pointer disabled:opacity-50"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D111D] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold font-grotesk text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>{editingUser ? 'Edit Platform User' : 'Create New User'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="landlord">Landlord</option>
                    <option value="tenant">Tenant</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {formData.role === 'tenant' && (
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Assign Landlord (for Tenant)</label>
                  <select
                    value={formData.landlord}
                    onChange={(e) => setFormData({ ...formData, landlord: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">No Landlord Assigned</option>
                    {landlordsList.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.firstName} {l.lastName} ({l.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Min. 8 chars, 1 number'}
                  className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-grotesk cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagementTab;
