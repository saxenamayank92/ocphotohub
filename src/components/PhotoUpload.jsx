import React, { useEffect, useState, useRef } from 'react';
import {
  Upload, Image as ImageIcon, Camera,
  AlertCircle, Sparkles, RefreshCw, Plus, X, Sliders, Check
} from 'lucide-react';
import { clubBrand } from '../brand';

export default function PhotoUpload({ user, onUploadSuccess, addToast }) {
  const [uploadQueue, setUploadQueue] = useState([]); // [{ id, fileName, previewUrl, originalFile, caption, category, aiSuggestions, isGeneratingCaption, filterPreset, brightness, contrast, saturation, vignette }]
  const [globalCategory, setGlobalCategory] = useState('General');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  // Active Studio Modal State
  const [editingItemId, setEditingItemId] = useState(null);
  const [studioFilter, setStudioFilter] = useState('normal');
  const [studioBrightness, setStudioBrightness] = useState(100);
  const [studioContrast, setStudioContrast] = useState(100);
  const [studioSaturation, setStudioSaturation] = useState(100);
  const [studioVignette, setStudioVignette] = useState(0);

  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef(new Set());
  const canvasRef = useRef(null);

  const categories = ['General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events'];

  const filterPresets = [
    { id: 'normal', name: 'Original', b: 100, c: 100, s: 100, v: 0 },
    { id: 'sunset', name: '🌅 Sunset', b: 105, c: 110, s: 135, v: 20 },
    { id: 'emerald', name: '⛳ Emerald', b: 100, c: 115, s: 140, v: 10 },
    { id: 'vintage', name: '📷 Vintage', b: 110, c: 90, s: 75, v: 30 },
    { id: 'nordic', name: '❄️ Nordic', b: 102, c: 120, s: 85, v: 15 },
    { id: 'bw', name: '🖤 Mono', b: 105, c: 130, s: 0, v: 25 },
    { id: 'soft', name: '💫 Soft Glow', b: 115, c: 95, s: 110, v: 5 }
  ];

  useEffect(() => () => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
  }, []);

  const revokePreview = (item) => {
    if (!item?.previewUrl || !previewUrlsRef.current.has(item.previewUrl)) return;
    URL.revokeObjectURL(item.previewUrl);
    previewUrlsRef.current.delete(item.previewUrl);
  };

  const withTimeout = (promise, milliseconds, message) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), milliseconds))
  ]);

  const aiCaptionsLibrary = {
    Tennis: [
      `Serving up some heat on the ${clubBrand.shortName} courts today! 🎾`,
      'Mixed doubles action under a perfect blue sky.',
      'Rallying into the weekend at the courts. Game, set, match!'
    ],
    Golf: [
      'Chasing birdies on the gorgeous 18th green. ⛳',
      'Early morning tee time looking spectacular.',
      'Perfect swing, perfect day, perfect club life.'
    ],
    Dining: [
      `Patio season is officially open at ${clubBrand.shortName}! 🍽️`,
      'Cheers to sunset drinks and delicious bites by the harbor.',
      'Unwinding with an exquisite culinary evening at the lounge.'
    ],
    Events: [
      `Celebrating the annual ${clubBrand.shortName} reception in style. ✨`,
      'Dressed to impress under the evening gala lights.',
      'Toasting to great friends and memories at the club social.'
    ],
    Clubhouse: [
      'Sunset reflections over the harbor from the clubhouse deck.',
      'Relaxing afternoon vibes in the historic lounge.',
      'The heart of the club looking stunning today.'
    ],
    General: [
      `Making lifelong memories at ${clubBrand.name}.`,
      'Beautiful days and even better company.',
      'Weekend relaxation at our favorite harbor spot.'
    ]
  };

  const handleSuggestCaptionForItem = (itemId, itemCategory) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, isGeneratingCaption: true, aiSuggestions: [] };
      return item;
    }));

    setTimeout(() => {
      const suggestions = aiCaptionsLibrary[itemCategory] || aiCaptionsLibrary.General;
      setUploadQueue(prev => prev.map(item => {
        if (item.id === itemId) {
          return { ...item, isGeneratingCaption: false, aiSuggestions: suggestions };
        }
        return item;
      }));
      addToast('AI captions generated for this photo!', 'success');
    }, 1000);
  };

  const handleSelectSuggestionForItem = (itemId, text) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, caption: text, aiSuggestions: [] };
      return item;
    }));
  };

  const handleCategoryChangeForItem = (itemId, newCategory) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, category: newCategory, aiSuggestions: [] };
      return item;
    }));
  };

  const handleCaptionChangeForItem = (itemId, newCaption) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, caption: newCaption };
      return item;
    }));
  };

  const handleRemoveFromQueue = (itemId) => {
    setUploadQueue(prev => {
      revokePreview(prev.find(item => item.id === itemId));
      return prev.filter(item => item.id !== itemId);
    });
    addToast('Photo removed from upload queue.', 'info');
  };

  const handleClearQueue = () => {
    uploadQueue.forEach(revokePreview);
    setUploadQueue([]);
    addToast('Cleared entire upload queue.', 'info');
  };

  // Canvas renderer with custom CSS filters and vignette effect
  const renderFilteredImageBlob = (imageFile, settings = {}) => {
    const {
      brightness = 100,
      contrast = 100,
      saturation = 100,
      vignette = 0
    } = settings;

    return new Promise((resolve, reject) => {
      const sourceUrl = URL.createObjectURL(imageFile);
      const img = new Image();
      img.src = sourceUrl;
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
          ctx.drawImage(img, 0, 0, width, height);

          // Add vignette overlay if specified
          if (vignette > 0) {
            const outerRadius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
            const gradient = ctx.createRadialGradient(
              width / 2, height / 2, outerRadius * 0.4,
              width / 2, height / 2, outerRadius
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${(vignette / 100) * 0.7})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          }

          canvas.toBlob(blob => {
            URL.revokeObjectURL(sourceUrl);
            if (!blob) reject(new Error('Failed to compress photo.'));
            else resolve(blob);
          }, 'image/jpeg', 0.85);
        } catch (error) {
          URL.revokeObjectURL(sourceUrl);
          reject(error);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error('Failed to load image onto canvas.'));
      };
    });
  };

  const processMultipleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    setIsLoading(true);
    setError('');

    const filesArray = Array.from(fileList);
    addToast(`Optimizing ${filesArray.length} photo(s)...`, 'info');

    let processedCount = 0;

    for (let i = 0; i < filesArray.length; i++) {
      const rawFile = filesArray[i];
      if (rawFile.size > 40 * 1024 * 1024) {
        addToast(`Skipped: ${rawFile.name} (> 40MB)`, 'error');
        continue;
      }
      const isImage = rawFile.type.startsWith('image/');
      const isHeic = rawFile.name.toLowerCase().endsWith('.heic') || rawFile.name.toLowerCase().endsWith('.heif');

      if (!isImage && !isHeic) {
        addToast(`Skipped: ${rawFile.name} (unsupported format)`, 'error');
        continue;
      }

      setLoadingStatus(`Processing photo ${i + 1} of ${filesArray.length}...`);

      try {
        let fileToCompress = rawFile;

        if (isHeic) {
          try {
            setLoadingStatus(`Converting iPhone photo ${i + 1} of ${filesArray.length}…`);
            const { default: heic2any } = await withTimeout(import('heic2any'), 15000, 'HEIC converter timeout.');
            const convertedBlob = await withTimeout(heic2any({
              blob: rawFile,
              toType: 'image/jpeg',
              quality: 0.85
            }), 30000, 'HEIC conversion timeout.');

            const actualBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            fileToCompress = new File([actualBlob], rawFile.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
          } catch (heicErr) {
            console.error('HEIC failed', heicErr);
            addToast(`Could not process HEIC: ${rawFile.name}`, 'error');
            continue;
          }
        }

        const compressedBlob = await renderFilteredImageBlob(fileToCompress);
        const previewUrl = URL.createObjectURL(compressedBlob);
        previewUrlsRef.current.add(previewUrl);

        const queueItem = {
          id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          originalFile: fileToCompress,
          previewUrl,
          blob: compressedBlob,
          caption: '',
          category: globalCategory,
          aiSuggestions: [],
          isGeneratingCaption: false,
          filterPreset: 'normal',
          brightness: 100,
          contrast: 100,
          saturation: 100,
          vignette: 0
        };

        setUploadQueue(prev => [...prev, queueItem]);
        processedCount++;
      } catch (err) {
        console.error(err);
        addToast(`Failed processing: ${rawFile.name}`, 'error');
      }
    }

    setIsLoading(false);
    setLoadingStatus('');
    if (processedCount > 0) {
      addToast(`Added ${processedCount} photo(s) to upload queue!`, 'success');
    }
  };

  // Studio Edit Handlers
  const handleOpenStudio = (item) => {
    setEditingItemId(item.id);
    setStudioFilter(item.filterPreset || 'normal');
    setStudioBrightness(item.brightness ?? 100);
    setStudioContrast(item.contrast ?? 100);
    setStudioSaturation(item.saturation ?? 100);
    setStudioVignette(item.vignette ?? 0);
  };

  const handleApplyPreset = (preset) => {
    setStudioFilter(preset.id);
    setStudioBrightness(preset.b);
    setStudioContrast(preset.c);
    setStudioSaturation(preset.s);
    setStudioVignette(preset.v);
  };

  const handleSaveStudioChanges = async () => {
    const item = uploadQueue.find(q => q.id === editingItemId);
    if (!item) return;

    setIsLoading(true);
    setLoadingStatus('Rendering photo studio adjustments...');

    try {
      const newBlob = await renderFilteredImageBlob(item.originalFile, {
        brightness: studioBrightness,
        contrast: studioContrast,
        saturation: studioSaturation,
        vignette: studioVignette
      });

      revokePreview(item);
      const newPreviewUrl = URL.createObjectURL(newBlob);
      previewUrlsRef.current.add(newPreviewUrl);

      setUploadQueue(prev => prev.map(q => {
        if (q.id === editingItemId) {
          return {
            ...q,
            blob: newBlob,
            previewUrl: newPreviewUrl,
            filterPreset: studioFilter,
            brightness: studioBrightness,
            contrast: studioContrast,
            saturation: studioSaturation,
            vignette: studioVignette
          };
        }
        return q;
      }));

      addToast('Photo studio adjustments applied!', 'success');
    } catch (e) {
      console.error(e);
      addToast('Could not apply studio filter.', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
      setEditingItemId(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processMultipleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    if (uploadQueue.length === 0) return setError('Please add photos to upload.');

    setIsLoading(true);

    try {
      const dateStamp = new Date().toISOString().split('T')[0];
      const cleanLastName = user.lastName.replace(/[^a-zA-Z0-9]/g, '');

      for (let i = 0; i < uploadQueue.length; i++) {
        const item = uploadQueue[i];
        setLoadingStatus(`Uploading photo ${i + 1} of ${uploadQueue.length}...`);

        const randomHex = Math.random().toString(36).substr(2, 6);
        const cleanClubName = clubBrand.shortName.replace(/[^a-zA-Z0-9]/g, '');
        const contextFileName = `${cleanClubName}_${item.category}_${cleanLastName}_${dateStamp}_${randomHex}.jpg`;

        const photoObject = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: item.previewUrl,
          blob: item.blob,
          fileName: contextFileName,
          caption: item.caption.trim() || `${item.category} moment at the club`,
          category: item.category,
          uploaderName: `${user.firstName} ${user.lastName}`,
          uploaderId: user.memberNumber,
          createdAt: new Date().toISOString(),
          hearts: 0,
          heartUsers: []
        };

        await onUploadSuccess(photoObject);
      }

      const { default: confetti } = await import('canvas-confetti');
      confetti({ particleCount: 160, spread: 85, origin: { y: 0.85 } });

      addToast(`Successfully published ${uploadQueue.length} photo(s)!`, 'success');
      uploadQueue.forEach(revokePreview);
      setUploadQueue([]);
    } catch (err) {
      console.error(err);
      addToast('Error uploading photos.', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const editingItem = uploadQueue.find(q => q.id === editingItemId);

  return (
    <div className="upload-card animate-fade-in">
      <h2 className="upload-title">Share Your Club Moments</h2>
      <p className="upload-subtitle">
        Upload photos, apply pro color presets in our Photo Studio, tag categories, and share with fellow club members.
      </p>

      {error && (
        <div className="login-error" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span className="loading-text">{loadingStatus}</span>
        </div>
      )}

      {/* Drag & Drop Target */}
      <div
        className={`drag-drop-zone ${uploadQueue.length > 0 ? 'has-queue' : ''} ${isDragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          accept="image/*,.heic,.heif"
          onChange={handleFileChange}
          multiple
        />
        <div className="upload-icon-wrapper">
          <Upload size={32} />
        </div>
        <div className="drag-drop-text">Drag & drop photos here</div>
        <div className="drag-drop-hint">or click to choose photos from your device</div>

        <div className="upload-feature-list" style={{ display: 'flex', gap: '16px', marginTop: '10px', color: 'var(--club-gold-dark)', justifyContent: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500' }}>
            <Camera size={12} /> Camera Roll
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500' }}>
            <Sliders size={12} /> Pro Filters Studio
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500' }}>
            <ImageIcon size={12} /> HEIC Auto-Convert
          </span>
        </div>
      </div>

      {uploadQueue.length === 0 && (
        <div className="form-group" style={{ marginTop: '20px', maxWidth: '300px', margin: '20px auto 0' }}>
          <label htmlFor="globalCat" style={{ textAlign: 'center', display: 'block', fontWeight: '700', fontSize: '12px' }}>
            Default Category for Uploads
          </label>
          <select
            id="globalCat"
            className="select-field"
            value={globalCategory}
            onChange={(e) => setGlobalCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* Queue & Photo Studio Controls */}
      {uploadQueue.length > 0 && (
        <form className="upload-queue-form" onSubmit={handleSubmitAll}>
          <div className="upload-queue-heading">
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--club-green-dark)' }}>
              Upload Queue ({uploadQueue.length} ready)
            </span>
            <button
              type="button"
              className="btn-text"
              style={{ color: 'var(--club-danger)', fontWeight: '600', fontSize: '12px' }}
              onClick={handleClearQueue}
            >
              Clear Queue
            </button>
          </div>

          <div className="upload-queue-list">
            {uploadQueue.map((item, idx) => (
              <div key={item.id} className="upload-queue-item">
                <div className="upload-queue-preview">
                  <img src={item.previewUrl} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  
                  {/* Photo Studio Button Badge */}
                  <button
                    type="button"
                    className="studio-trigger-badge"
                    onClick={() => handleOpenStudio(item)}
                    title="Open Photo Studio Filters"
                  >
                    <Sliders size={11} /> Studio
                  </button>

                  <button
                    type="button"
                    className="queue-remove-btn"
                    onClick={() => handleRemoveFromQueue(item.id)}
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="upload-queue-fields">
                  <div className="upload-queue-field-row">
                    <select
                      className="select-field"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                      value={item.category}
                      onChange={(e) => handleCategoryChangeForItem(item.id, e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      placeholder="Add a caption..."
                      value={item.caption}
                      onChange={(e) => handleCaptionChangeForItem(item.id, e.target.value)}
                      maxLength={120}
                    />

                    <button
                      type="button"
                      className="btn-text"
                      style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--club-gold-dark)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}
                      onClick={() => handleSuggestCaptionForItem(item.id, item.category)}
                      disabled={item.isGeneratingCaption}
                    >
                      {item.isGeneratingCaption ? <RefreshCw size={10} className="spinner" /> : <Sparkles size={10} />}
                      AI Suggest
                    </button>
                  </div>

                  {item.aiSuggestions.length > 0 && (
                    <div className="ai-suggestions-box">
                      <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--club-gray-dark)' }}>AI Captions:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.aiSuggestions.map((text, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="suggestion-chip"
                            onClick={() => handleSelectSuggestionForItem(item.id, text)}
                          >
                            "{text}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="upload-action-row">
            <button type="button" onClick={triggerFileInput} className="btn-secondary upload-add-button">
              <Plus size={16} /> Add More
            </button>
            <button type="submit" className="btn-gold upload-submit-button">
              Publish All ({uploadQueue.length})
            </button>
          </div>
        </form>
      )}

      {/* PHOTO STUDIO MODAL */}
      {editingItem && (
        <div className="studio-modal-backdrop" onClick={() => setEditingItemId(null)}>
          <div className="studio-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <h3><Sliders size={18} /> Creative Photo Studio</h3>
              <button type="button" className="studio-close-btn" onClick={() => setEditingItemId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="studio-modal-body">
              {/* Studio Canvas Preview */}
              <div className="studio-preview-frame">
                <img
                  src={editingItem.previewUrl}
                  alt="Studio Edit Preview"
                  style={{
                    filter: `brightness(${studioBrightness}%) contrast(${studioContrast}%) saturate(${studioSaturation}%)`,
                    width: '100%',
                    maxHeight: '320px',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>

              {/* Presets Row */}
              <div className="studio-presets-row">
                <span className="studio-label">Filter Presets:</span>
                <div className="studio-presets-list">
                  {filterPresets.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-chip ${studioFilter === preset.id ? 'active' : ''}`}
                      onClick={() => handleApplyPreset(preset)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adjustments Sliders */}
              <div className="studio-sliders-grid">
                <div className="slider-group">
                  <label>Brightness ({studioBrightness}%)</label>
                  <input type="range" min="60" max="150" value={studioBrightness} onChange={e => setStudioBrightness(Number(e.target.value))} />
                </div>
                <div className="slider-group">
                  <label>Contrast ({studioContrast}%)</label>
                  <input type="range" min="60" max="150" value={studioContrast} onChange={e => setStudioContrast(Number(e.target.value))} />
                </div>
                <div className="slider-group">
                  <label>Saturation ({studioSaturation}%)</label>
                  <input type="range" min="0" max="200" value={studioSaturation} onChange={e => setStudioSaturation(Number(e.target.value))} />
                </div>
                <div className="slider-group">
                  <label>Vignette ({studioVignette}%)</label>
                  <input type="range" min="0" max="80" value={studioVignette} onChange={e => setStudioVignette(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="studio-modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setEditingItemId(null)}>Cancel</button>
              <button type="button" className="btn-gold" onClick={handleSaveStudioChanges}>
                <Check size={16} /> Apply Studio Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
