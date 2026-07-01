import React, { useState, useEffect, useRef } from 'react';
import { uploadAdvertisementImage } from '../../../services/advertisementService';

const AdvertisementUploadForm = ({ editingAd, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    bg_color: '#c0392b',
    duration: 10,
    is_active: true,
    display_order: 1
  });
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingAd) {
      setFormData({
        title: editingAd?.title || '',
        description: editingAd?.description || '',
        image_url: editingAd?.image_url || '',
        video_url: editingAd?.video_url || '',
        bg_color: editingAd?.bg_color || '#c0392b',
        duration: editingAd?.duration || 10,
        is_active: editingAd?.is_active ?? true,
        display_order: editingAd?.display_order || 1
      });
      if (editingAd?.video_url) {
        setMediaType('video');
        setVideoPreview(editingAd?.video_url);
      } else if (editingAd?.image_url) {
        setMediaType('image');
        setImagePreview(editingAd?.image_url);
      }
    }
  }, [editingAd]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors?.[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (file) => {
    if (!file) return;
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (mediaType === 'image') {
      if (!imageTypes?.includes(file?.type)) {
        setErrors(prev => ({ ...prev, media: 'Only JPG, PNG, GIF, WEBP images are supported' }));
        return;
      }
      if (file?.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, media: 'Image size must be less than 5MB' }));
        return;
      }
      // Store the file object for upload; show local preview
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e?.target?.result);
      };
      reader?.readAsDataURL(file);
      // Clear any previously saved URL so we know a new file was chosen
      setFormData(prev => ({ ...prev, image_url: '', video_url: '' }));
    } else {
      if (!videoTypes?.includes(file?.type)) {
        setErrors(prev => ({ ...prev, media: 'Only MP4, WebM, OGG videos are supported' }));
        return;
      }
      if (file?.size > 50 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, media: 'Video size must be less than 50MB' }));
        return;
      }
      // For video keep base64 preview (videos are handled separately)
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e?.target?.result;
        setVideoPreview(dataUrl);
        setFormData(prev => ({ ...prev, video_url: dataUrl, image_url: '' }));
      };
      reader?.readAsDataURL(file);
    }
    if (errors?.media) setErrors(prev => ({ ...prev, media: '' }));
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setDragOver(false);
    const file = e?.dataTransfer?.files?.[0];
    handleFileChange(file);
  };

  const handleMediaTypeSwitch = (type) => {
    setMediaType(type);
    setSelectedFile(null);
    setErrors(prev => ({ ...prev, media: '' }));
    if (fileInputRef?.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors = {};
    if (!formData?.title?.trim()) newErrors.title = 'Title is required';
    if (mediaType === 'image' && !formData?.image_url?.trim() && !selectedFile) newErrors.media = 'Please upload an image or provide a URL';
    if (mediaType === 'video' && !formData?.video_url?.trim()) newErrors.media = 'Please upload a video or provide a URL';
    if (formData?.duration < 3 || formData?.duration > 60) newErrors.duration = 'Duration must be between 3 and 60 seconds';
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    let finalFormData = { ...formData };

    // If a new image file was selected, upload it to Supabase Storage first
    if (mediaType === 'image' && selectedFile) {
      try {
        setUploading(true);
        const publicUrl = await uploadAdvertisementImage(selectedFile);
        finalFormData = { ...finalFormData, image_url: publicUrl, video_url: '' };
      } catch (err) {
        setErrors(prev => ({ ...prev, media: 'Image upload failed. Please try again.' }));
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    onSave(finalFormData);
  };

  const acceptAttr = mediaType === 'image' ? 'image/*' : 'video/mp4,video/webm,video/ogg';

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData?.title}
              onChange={handleChange}
              placeholder="Advertisement title"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors?.title && <p className="text-red-500 text-xs mt-1">{errors?.title}</p>}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Display Duration (seconds) *</label>
            <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden bg-background">
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.max(3, (parseInt(formData?.duration) || 10) - 1);
                  setFormData(prev => ({ ...prev, duration: newVal }));
                  if (errors?.duration) setErrors(prev => ({ ...prev, duration: '' }));
                }}
                className="flex items-center justify-center w-10 h-10 text-lg font-bold text-foreground bg-muted hover:bg-muted/80 transition-colors border-r border-border select-none"
                aria-label="Decrease duration"
              >
                −
              </button>
              <div className="flex-1 flex items-center justify-center gap-1 px-2">
                <span className="text-base font-semibold text-foreground tabular-nums">{formData?.duration}</span>
                <span className="text-xs text-muted-foreground">sec</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.min(60, (parseInt(formData?.duration) || 10) + 1);
                  setFormData(prev => ({ ...prev, duration: newVal }));
                  if (errors?.duration) setErrors(prev => ({ ...prev, duration: '' }));
                }}
                className="flex items-center justify-center w-10 h-10 text-lg font-bold text-foreground bg-muted hover:bg-muted/80 transition-colors border-l border-border select-none"
                aria-label="Increase duration"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Min 3s · Max 60s</p>
            {errors?.duration && <p className="text-red-500 text-xs mt-1">{errors?.duration}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            name="description"
            value={formData?.description}
            onChange={handleChange}
            rows={2}
            placeholder="Short description or tagline"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Media Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Advertisement Media *</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleMediaTypeSwitch('image')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mediaType === 'image' ?'bg-primary text-primary-foreground border-primary' :'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Image
            </button>
            <button
              type="button"
              onClick={() => handleMediaTypeSwitch('video')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mediaType === 'video' ?'bg-primary text-primary-foreground border-primary' :'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Video
            </button>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => { e?.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef?.current?.click()}
          >
            {mediaType === 'image' && imagePreview ? (
              <div className="flex flex-col items-center gap-2">
                <img src={imagePreview} alt="Preview" className="max-h-32 object-contain rounded-lg" />
                <p className="text-xs text-muted-foreground">Click to change image</p>
              </div>
            ) : mediaType === 'video' && videoPreview ? (
              <div className="flex flex-col items-center gap-2">
                <video
                  src={videoPreview}
                  className="max-h-32 rounded-lg"
                  controls
                  onClick={(e) => e?.stopPropagation()}
                />
                <p className="text-xs text-muted-foreground">Click to change video</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {mediaType === 'image' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                )}
                <p className="text-sm">Drag & drop or click to upload</p>
                <p className="text-xs">
                  {mediaType === 'image' ? 'JPG, PNG, GIF, WEBP up to 5MB' : 'MP4, WebM, OGG up to 50MB'}
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              className="hidden"
              onChange={(e) => handleFileChange(e?.target?.files?.[0])}
            />
          </div>

          {/* URL input */}
          <div className="mt-2">
            {mediaType === 'image' ? (
              <input
                type="text"
                name="image_url"
                value={formData?.image_url?.startsWith('data:') ? '' : formData?.image_url}
                onChange={(e) => {
                  handleChange(e);
                  if (e?.target?.value) setImagePreview(e?.target?.value);
                }}
                placeholder="Or paste image URL here"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            ) : (
              <input
                type="text"
                name="video_url"
                value={formData?.video_url?.startsWith('data:') ? '' : formData?.video_url}
                onChange={(e) => {
                  handleChange(e);
                  if (e?.target?.value) setVideoPreview(e?.target?.value);
                }}
                placeholder="Or paste video URL here (MP4)"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
          </div>
          {errors?.media && <p className="text-red-500 text-xs mt-1">{errors?.media}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="bg_color"
                value={formData?.bg_color}
                onChange={handleChange}
                className="w-10 h-10 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                name="bg_color"
                value={formData?.bg_color}
                onChange={handleChange}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Display Order</label>
            <input
              type="number"
              name="display_order"
              value={formData?.display_order}
              onChange={handleChange}
              min="1"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData?.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <span className="text-sm font-medium text-foreground">Active (show to parents)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading image...</>
            ) : saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              editingAd ? 'Update Advertisement' : 'Save Advertisement'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg font-medium border border-border text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvertisementUploadForm;
