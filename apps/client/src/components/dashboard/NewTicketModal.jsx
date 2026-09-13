import React, { useState, useRef } from 'react';
import { X, Wrench, Building2, ImagePlus, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { landlordApi } from '../../services/api';

export const NewTicketModal = ({
  isOpen,
  onClose,
  properties = [],
  units = [],
  onTicketCreated = () => {},
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?._id || properties[0]?.id || '');
  const [selectedUnitId, setSelectedUnitId]     = useState('');
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState('HVAC');
  const [priority, setPriority]     = useState('medium');

  // Photo state
  const [photoFiles, setPhotoFiles]     = useState([]);   // raw File objects
  const [photoPreviews, setPhotoPreviews] = useState([]); // data-URL previews
  const fileInputRef = useRef(null);

  // Submit state
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const filteredUnits = units.filter(
    (u) => !selectedPropertyId || u.propertyId === selectedPropertyId || u.property === selectedPropertyId
  );

  /* ─── Photo handling ─── */
  const handlePhotoChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const remaining = 5 - photoFiles.length;
    const toAdd = selected.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPhotoPreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });

    setPhotoFiles((prev) => [...prev, ...toAdd]);
    // reset input so same file can be re-selected after removal
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedUnitId) return;
    setLoading(true);
    setError('');

    try {
      // 1. Upload photos to Cloudinary (if any)
      let photoUrls = [];
      if (photoFiles.length > 0) {
        const uploadRes = await landlordApi.uploadTicketPhotos(photoFiles);
        photoUrls = uploadRes.photoUrls || [];
      }

      // 2. Create ticket via API
      const res = await landlordApi.createTicket({
        title:       title.trim(),
        description: description.trim(),
        category,
        priority,
        unitId:      selectedUnitId,
        photoUrls,
      });

      const created = res.data || res;

      // 3. Build display-ready ticket for optimistic UI
      const unit = units.find((u) => (u._id || u.id) === selectedUnitId);
      const prop = properties.find((p) => (p._id || p.id) === selectedPropertyId);

      onTicketCreated({
        ...created,
        id:           created._id || created.id,
        unitLabel:    unit?.label || 'Unit',
        propertyName: prop?.name  || 'Property',
        tenantName:   unit?.tenantName || 'Landlord',
        photoUrls,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        resetForm();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPropertyId(properties[0]?._id || properties[0]?.id || '');
    setSelectedUnitId('');
    setTitle('');
    setDescription('');
    setCategory('HVAC');
    setPriority('medium');
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setError('');
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#10131F] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 top-shade modal-enter modal-enter-active">

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-800 btn-press disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-grotesk text-slate-900 dark:text-white">Log Maintenance Request</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">File a service dispatch ticket for a unit.</p>
          </div>
        </div>

        {/* Success state */}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Ticket dispatched successfully!</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">

          {/* Property */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => { setSelectedPropertyId(e.target.value); setSelectedUnitId(''); }}
              className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Select Property --</option>
              {properties.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Select Unit --</option>
              {filteredUnits.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id}>{u.label} ({u.status})</option>
              ))}
            </select>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="HVAC">HVAC</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="General">General Repair</option>
                <option value="Appliances">Appliances</option>
                <option value="Structural">Structural</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High Emergency</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master bedroom AC unit blowing warm air"
              className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description & Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail observations or special access instructions..."
              className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Photos <span className="font-normal text-slate-400 dark:text-slate-500">(up to 5 images)</span>
            </label>

            {/* Previews */}
            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                    <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <XCircle className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload trigger */}
            {photoFiles.length < 5 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-colors"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>Add Photos</span>
                </button>
              </>
            )}
          </div>

          {/* Footer CTAs */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 btn-press disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !selectedUnitId}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold font-grotesk btn-press shadow-md shadow-amber-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {photoFiles.length > 0 ? 'Uploading…' : 'Dispatching…'}
                </>
              ) : (
                'Dispatch Ticket'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
