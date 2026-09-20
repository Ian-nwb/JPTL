import React, { useState, useRef } from 'react';
import { X, Wrench, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, Clock, Camera, Upload, Paperclip, Loader2, Trash2 } from 'lucide-react';
import { tenantApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ISSUE_CATEGORIES = [
  { key: 'Plumbing', label: 'Plumbing / Leak' },
  { key: 'HVAC', label: 'HVAC / AC & Heating' },
  { key: 'Appliance', label: 'Kitchen Appliance' },
  { key: 'Electrical', label: 'Electrical / Lights' },
  { key: 'General', label: 'Locks & Security' },
  { key: 'Other', label: 'Other Repair' },
];

export const ReportIssueModal = ({
  isOpen,
  onClose,
  tenant,
  unit,
  onTicketSubmitted = () => {},
}) => {
  const toast = useToast();
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [permissionToEnter, setPermissionToEnter] = useState(true);
  const [hasPets, setHasPets] = useState(false);
  const [preferredTime, setPreferredTime] = useState('afternoon');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFilesChosen = (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 5);
    if (valid.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...valid].slice(0, 5));
    const newPreviews = valid.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: `${(f.size / 1024).toFixed(0)} KB`,
    }));
    setFilePreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      const target = prev[index];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    let uploadedPhotoUrls = [];

    try {
      if (selectedFiles.length > 0) {
        const uploadRes = await tenantApi.uploadPhotos(selectedFiles);
        if (uploadRes?.photoUrls?.length > 0) {
          uploadedPhotoUrls = uploadRes.photoUrls;
        }
      }
    } catch (err) {
      console.warn('Photo upload fallback:', err.message);
      uploadedPhotoUrls = filePreviews.map((p) => p.url);
    }

    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'submitted',
      unitId: unit?.id || tenant?.unitId || 'unit-101',
      unitLabel: unit?.label || tenant?.unitLabel || 'Unit 14B',
      propertyId: unit?.propertyId || tenant?.propertyId || 'prop-1',
      propertyName: unit?.propertyName || tenant?.propertyName || 'Aura Sky Towers',
      tenantId: tenant?.id || 'usr-tenant-1',
      tenantName: tenant?.name || 'Sophia Lin',
      permissionToEnter,
      hasPets,
      preferredTime,
      photoUrls: uploadedPhotoUrls,
      attachments: filePreviews.map((p) => p.name),
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'submitted',
          changedBy: tenant?.name || 'Resident',
          userRole: 'tenant',
          timestamp: new Date().toISOString(),
          note: 'Maintenance ticket created by resident with media attachments',
        },
      ],
    };

    setIsSubmitting(false);
    onTicketSubmitted(newTicket);
    toast.success(`Repair ticket "${newTicket.title}" submitted successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#10131F] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 top-shade modal-enter modal-enter-active apple-glass">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-800 btn-press"
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
            <h2 className="text-xl font-bold font-grotesk text-slate-900 dark:text-white">Request Maintenance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{unit?.label || 'Unit 14B'} &bull; Certified Technician Dispatch</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Category Chips */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ISSUE_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold btn-press text-center transition-all ${
                    category === cat.key
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Urgency Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'low', label: 'Low (Within 72h)' },
                { key: 'medium', label: 'Standard (24-48h)' },
                { key: 'high', label: 'Urgent (Same Day)' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => setPriority(p.key)}
                  className={`p-2 rounded-xl border text-xs font-semibold btn-press transition-all ${
                    priority === p.key
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Summary */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Summary</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master bathroom faucet dripping continuously"
              className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Details & Location in Unit</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe when this started and any specific instructions for the technician..."
              className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Photo & Video Attachment Dropzone */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Photos / Video Evidence</label>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesChosen(e.target.files);
                e.target.value = '';
              }}
            />
            <div
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) handleFilesChosen(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080B14]/50 text-center space-y-2 cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                <Camera className="w-4 h-4 text-indigo-500" />
                <span>Drag & drop photos or click to attach (up to 5)</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 font-mono text-xs btn-press inline-flex items-center gap-1"
              >
                <Upload className="w-3 h-3" /> Select Images
              </button>
            </div>

            {/* Attached file previews / thumbnails */}
            {filePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {filePreviews.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-20 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2 text-white text-xs">
                      <span className="truncate max-w-[80px] font-mono">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                        className="p-1 rounded-md bg-rose-500/80 hover:bg-rose-600 text-white"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkboxes: Permission to enter + Pets alert */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="entry-check"
                checked={permissionToEnter}
                onChange={(e) => setPermissionToEnter(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="entry-check" className="text-slate-700 dark:text-slate-300 cursor-pointer text-xs">
                Permission to enter unit if I am not home
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pets-check"
                checked={hasPets}
                onChange={(e) => setHasPets(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="pets-check" className="text-slate-700 dark:text-slate-300 cursor-pointer text-xs">
                Pets present in unit (Alert technician)
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 btn-press disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold font-grotesk btn-press shadow-md shadow-amber-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading & Submitting…</span>
                </>
              ) : (
                <span>Submit Service Ticket</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
