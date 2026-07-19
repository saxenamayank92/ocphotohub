import React, { useState, useRef } from 'react';
import heic2any from 'heic2any';
import confetti from 'canvas-confetti';
import {
  Upload, Image as ImageIcon, Camera,
  AlertCircle, Sparkles, RefreshCw, Plus, X
} from 'lucide-react';

export default function PhotoUpload({ user, onUploadSuccess, addToast }) {
  const [uploadQueue, setUploadQueue] = useState([]); // [{ id, fileName, previewUrl, caption, category, aiSuggestions, isGeneratingCaption }]
  const [globalCategory, setGlobalCategory] = useState('General'); // Default category for new files

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef(null);

  const categories = ['General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events'];

  // AI captions library based on categories
  const aiCaptionsLibrary = {
    Tennis: [
      'Serving up some heat on the Oakville courts today! 🎾',
      'Mixed doubles action under a perfect blue sky.',
      'Rallying into the weekend at the courts. Game, set, match!'
    ],
    Golf: [
      'Chasing birdies on the gorgeous 18th green. ⛳',
      'Early morning tee time looking spectacular.',
      'Perfect swing, perfect day, perfect club life.'
    ],
    Dining: [
      'Patio season is officially open at the Oakville Bistro! 🍽️',
      'Cheers to sunset drinks and delicious bites by the harbor.',
      'Unwinding with an exquisite culinary evening at the lounge.'
    ],
    Events: [
      'Celebrating the annual Oakville Reception in style. ✨',
      'Dressed to impress under the evening gala lights.',
      'Toasting to great friends and memories at the club social.'
    ],
    Clubhouse: [
      'Sunset reflections over the harbor from the clubhouse deck.',
      'Relaxing afternoon vibes in the historic lounge.',
      'The heart of the club looking stunning today.'
    ],
    General: [
      'Making lifelong memories at the Oakville Club.',
      'Beautiful days and even better company.',
      'Weekend relaxation at our favorite harbor spot.'
    ]
  };

  const handleSuggestCaptionForItem = (itemId, itemCategory) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, isGeneratingCaption: true, aiSuggestions: [] };
      }
      return item;
    }));

    setTimeout(() => {
      const suggestions = aiCaptionsLibrary[itemCategory] || aiCaptionsLibrary.General;
      setUploadQueue(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            isGeneratingCaption: false,
            aiSuggestions: suggestions
          };
        }
        return item;
      }));
      addToast('AI captions generated for this photo!', 'success');
    }, 1200);
  };

  const handleSelectSuggestionForItem = (itemId, text) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, caption: text, aiSuggestions: [] };
      }
      return item;
    }));
  };

  const handleCategoryChangeForItem = (itemId, newCategory) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, category: newCategory, aiSuggestions: [] };
      }
      return item;
    }));
  };

  const handleCaptionChangeForItem = (itemId, newCaption) => {
    setUploadQueue(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, caption: newCaption };
      }
      return item;
    }));
  };

  const handleRemoveFromQueue = (itemId) => {
    setUploadQueue(prev => prev.filter(item => item.id !== itemId));
    addToast('Photo removed from upload queue.', 'info');
  };

  const handleClearQueue = () => {
    setUploadQueue([]);
    addToast('Cleared entire upload queue.', 'info');
  };

  // Resizes and compresses image to base64 JPEG format
  const compressImage = (imageFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
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
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image into canvas.'));
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
    });
  };

  const processMultipleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    setIsLoading(true);
    setError('');

    const filesArray = Array.from(fileList);
    addToast(`Preparing and optimizing ${filesArray.length} photos...`, 'info');

    let processedCount = 0;

    for (let i = 0; i < filesArray.length; i++) {
      const rawFile = filesArray[i];
      const isImage = rawFile.type.startsWith('image/');
      const isHeic = rawFile.name.toLowerCase().endsWith('.heic') || rawFile.name.toLowerCase().endsWith('.heif') || rawFile.type === 'image/heic' || rawFile.type === 'image/heif';

      if (!isImage && !isHeic) {
        addToast(`Skipped: ${rawFile.name} (not a valid image format)`, 'error');
        continue;
      }

      setLoadingStatus(`Optimizing photo ${i + 1} of ${filesArray.length}...`);

      try {
        let fileToCompress = rawFile;

        if (isHeic) {
          try {
            const convertedBlob = await heic2any({
              blob: rawFile,
              toType: 'image/jpeg',
              quality: 0.8
            });

            const actualBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            fileToCompress = new File(
              [actualBlob],
              rawFile.name.replace(/\.(heic|heif)$/i, '.jpg'),
              { type: 'image/jpeg' }
            );
          } catch (heicErr) {
            console.error('HEIC conversion failed', heicErr);
            addToast(`Could not convert HEIC format for: ${rawFile.name}`, 'error');
            continue;
          }
        }

        const compressedBase64 = await compressImage(fileToCompress);

        // Push a new item into the upload queue
        const queueItem = {
          id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          originalName: rawFile.name,
          previewUrl: compressedBase64,
          caption: '',
          category: globalCategory, // inherits current global dropdown category
          aiSuggestions: [],
          isGeneratingCaption: false
        };

        setUploadQueue(prev => [...prev, queueItem]);
        processedCount++;
      } catch (err) {
        console.error(err);
        addToast(`Failed to process photo: ${rawFile.name}`, 'error');
      }
    }

    setIsLoading(false);
    setLoadingStatus('');
    if (processedCount > 0) {
      addToast(`Added ${processedCount} photos to the upload queue!`, 'success');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
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
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    if (uploadQueue.length === 0) {
      setError('Please add at least one photo to the queue.');
      return;
    }

    setIsLoading(true);

    try {
      const dateStamp = new Date().toISOString().split('T')[0];
      const cleanLastName = user.lastName.replace(/[^a-zA-Z0-9]/g, '');

      for (let i = 0; i < uploadQueue.length; i++) {
        const item = uploadQueue[i];
        setLoadingStatus(`Uploading photo ${i + 1} of ${uploadQueue.length}...`);

        const randomHex = Math.random().toString(36).substr(2, 6);
        const contextFileName = `Oakville_${item.category}_${cleanLastName}_${dateStamp}_${randomHex}.jpg`;

        const photoObject = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: item.previewUrl,
          fileName: contextFileName,
          caption: item.caption.trim() || `${item.category} scene at the club`,
          category: item.category,
          uploaderName: `${user.firstName} ${user.lastName}`,
          uploaderId: user.memberNumber,
          createdAt: new Date().toISOString(),
          hearts: 0,
          heartUsers: []
        };

        // Fire parent upload (which manages local DB or Firebase Cloud Storage uploads)
        await onUploadSuccess(photoObject);
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.8 },
        colors: ['#231F54', '#C5A059', '#FBF9F5', '#E0BC75']
      });

      addToast(`Successfully uploaded ${uploadQueue.length} photos to the hub!`, 'success');
      setUploadQueue([]);
    } catch (err) {
      console.error(err);
      addToast('Error uploading photo queue.', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  return (
    <div className="upload-card animate-fade-in">
      <h2 className="upload-title">Share Your Club Moments</h2>
      <p className="upload-subtitle">
        Drag and drop multiple photos below to prepare a bulk upload. Add category tags and caption them before posting.
      </p>

      {error && (
        <div className="login-error" style={{ marginBottom: '16px' }} role="alert">
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

      {/* Upload Zone (Accepts Multiple Files) */}
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
          multiple // Enables multiple file picking
        />
        <div className="upload-icon-wrapper">
          <Upload size={32} />
        </div>
        <div className="drag-drop-text">Drag & drop your photo(s) here</div>
        <div className="drag-drop-hint">or click/tap to pick multiple files from your computer or phone library</div>

        <div className="upload-feature-list" style={{ display: 'flex', gap: '16px', marginTop: '8px', color: 'var(--club-gold-dark)', justifyContent: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500' }}>
            <Camera size={12} /> Camera Roll
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500' }}>
            <ImageIcon size={12} /> HEIC/iPhone compatible
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500' }}>
            <Plus size={12} /> Bulk Uploading
          </span>
        </div>
      </div>

      {/* Global Category Selector for upcoming additions */}
      {uploadQueue.length === 0 && (
        <div className="form-group" style={{ marginTop: '20px', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
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
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Visual Upload Queue Dashboard */}
      {uploadQueue.length > 0 && (
        <form className="upload-queue-form" onSubmit={handleSubmitAll}>
          <div className="upload-queue-heading">
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--club-green-dark)' }}>
              Upload Queue ({uploadQueue.length} {uploadQueue.length === 1 ? 'photo' : 'photos'} ready)
            </span>
            <button
              type="button"
              className="btn-text"
              style={{ color: 'var(--club-danger)', fontWeight: '600', fontSize: '12px' }}
              onClick={handleClearQueue}
            >
              Clear All
            </button>
          </div>

          {/* Queue Scroll Container */}
          <div className="upload-queue-list">
            {uploadQueue.map((item, idx) => (
              <div
                key={item.id}
                className={`upload-queue-item ${idx === uploadQueue.length - 1 ? 'last' : ''}`}
              >
                {/* Image Preview with Trash Overlay */}
                <div className="upload-queue-preview">
                  <img
                    src={item.previewUrl}
                    alt={`Queue item ${idx}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(220, 53, 69, 0.9)',
                      border: 'none',
                      color: 'var(--club-white)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'var(--transition-fast)'
                    }}
                    onClick={() => handleRemoveFromQueue(item.id)}
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Form fields for this queue item */}
                <div className="upload-queue-fields">
                  <div className="upload-queue-field-row">
                    <div className="upload-category-field">
                      <select
                        className="select-field"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                        value={item.category}
                        onChange={(e) => handleCategoryChangeForItem(item.id, e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="upload-caption-field">
                      <input
                        type="text"
                        className="input-field"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        placeholder={`Caption for photo ${idx + 1}...`}
                        value={item.caption}
                        onChange={(e) => handleCaptionChangeForItem(item.id, e.target.value)}
                        maxLength={120}
                      />
                    </div>

                    <div className="upload-suggest-field">
                      <button
                        type="button"
                        className="btn-text"
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          color: 'var(--club-gold-dark)',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                        onClick={() => handleSuggestCaptionForItem(item.id, item.category)}
                        disabled={item.isGeneratingCaption}
                      >
                        {item.isGeneratingCaption ? (
                          <RefreshCw size={10} className="spinner" />
                        ) : (
                          <Sparkles size={10} />
                        )}
                        Suggest
                      </button>
                    </div>
                  </div>

                  {/* AI suggestion panel for this item */}
                  {item.aiSuggestions.length > 0 && (
                    <div
                      style={{
                        background: 'var(--club-gray-light)',
                        border: '1px solid var(--club-gray)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        animation: 'fadeIn 0.2s ease',
                        marginTop: '2px'
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--club-gray-dark)' }}>
                        Select Caption:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.aiSuggestions.map((text, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            style={{
                              background: 'var(--club-white)',
                              border: '1px solid var(--club-gray)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '5px 8px',
                              fontSize: '11px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              color: 'var(--club-charcoal)',
                              transition: 'var(--transition-fast)'
                            }}
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

          {/* Action Row */}
          <div className="upload-action-row">
            <button
              type="button"
              onClick={triggerFileInput}
              className="btn-secondary upload-add-button"
            >
              <Plus size={16} /> Add More Photos
            </button>
            <button type="submit" className="btn-gold upload-submit-button">
              Upload All ({uploadQueue.length} {uploadQueue.length === 1 ? 'Photo' : 'Photos'})
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
