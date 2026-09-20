import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Edit2, Trash2, X, Check,
  AlertCircle, RefreshCw, MapPin, User, Layers
} from 'lucide-react';
import {
  getProperties, createProperty, updateProperty, deleteProperty, getUsersLookup
} from '../services/superadminApi';
import { Skeleton } from './ui/SkeletonLoader';

const CATEGORIES = ['Residential', 'Luxury', 'Studio', 'Penthouse', 'Commercial'];

export const PropertiesTab = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Dropdown Lookups
  const [landlords, setLandlords] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    category: 'Residential',
    landlord: '',
    unitsCount: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  const fetchPropertiesData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProperties({ search, category: categoryFilter });
      setProperties(data.properties || []);
    } catch (err) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const data = await getUsersLookup();
      setLandlords(data.landlords || []);
    } catch (err) {
      console.error('Failed to load landlords lookup:', err);
    }
  };

  useEffect(() => {
    fetchPropertiesData();
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchLookups();
  }, []);

  const openCreateModal = () => {
    setEditingProperty(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      category: 'Residential',
      landlord: landlords[0]?._id || '',
      unitsCount: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prop) => {
    setEditingProperty(prop);
    setFormData({
      name: prop.name || '',
      address: prop.address || '',
      city: prop.city || '',
      category: prop.category || 'Residential',
      landlord: prop.landlord?._id || prop.landlord || '',
      unitsCount: prop.unitsCount || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      if (editingProperty) {
        await updateProperty(editingProperty._id, formData);
        setSuccessMsg(`Property "${formData.name}" updated successfully.`);
      } else {
        await createProperty(formData);
        setSuccessMsg(`Property "${formData.name}" created successfully.`);
      }
      setIsModalOpen(false);
      await fetchPropertiesData();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete property "${name}" and all associated units?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteProperty(id);
      setSuccessMsg(`Property "${name}" deleted successfully.`);
      await fetchPropertiesData();
    } catch (err) {
      setError(err.message || 'Failed to delete property');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D111D] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-grotesk text-white">Properties Registry</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Global management of real estate complexes, buildings, and property portfolios across all landlords.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPropertiesData}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition btn-press cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-grotesk text-xs flex items-center gap-2 transition btn-press shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Property</span>
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
            placeholder="Search by property name, address, or city..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-[#0D111D] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070A12] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Property</th>
                <th className="py-3.5 px-5">Location</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Assigned Landlord</th>
                <th className="py-3.5 px-5 text-center">Units</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && properties.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-36" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-20 rounded-full" /></td>
                    <td className="py-3.5 px-5"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3.5 px-5 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="py-3.5 px-5 text-right"><Skeleton className="h-7 w-16 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No properties found matching criteria.
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property._id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-grotesk">
                          {property.name.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-white font-grotesk font-semibold block text-sm">
                            {property.name}
                          </strong>
                          <span className="text-[10px] text-slate-500">ID: {property._id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{property.address}, {property.city}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {property.category || 'Residential'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {property.landlord ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {property.landlord.firstName} {property.landlord.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {property.unitsCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(property)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-400 transition cursor-pointer"
                          title="Edit Property"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(property._id, property.name)}
                          disabled={deletingId === property._id}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-rose-400 transition cursor-pointer disabled:opacity-50"
                          title="Delete Property"
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
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>{editingProperty ? 'Edit Property' : 'Create New Property'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Property Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pacific Grand Tower"
                  className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Street Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 104 Ocean View Blvd"
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Santa Monica"
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Assign Landlord</label>
                  <select
                    required
                    value={formData.landlord}
                    onChange={(e) => setFormData({ ...formData, landlord: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select a Landlord</option>
                    {landlords.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.firstName} {l.lastName} ({l.email})
                      </option>
                    ))}
                  </select>
                </div>
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
                  {submitting ? 'Saving...' : editingProperty ? 'Save Changes' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PropertiesTab;
