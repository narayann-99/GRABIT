import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('video-url');
  const platformIndicator = document.getElementById('platform-indicator');
  const downloadForm = document.getElementById('download-form');
  const downloadBtn = document.getElementById('download-btn');
  const resultsSection = document.getElementById('results-section');
  const resultPlatform = document.getElementById('result-platform');
  const videoThumbnail = document.getElementById('video-thumbnail');
  
  // Platform Detection
  const detectPlatform = (url) => {
    url = url.toLowerCase();
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    return null;
  };

  // Handle Input Changes for Indicator
  urlInput.addEventListener('input', (e) => {
    const url = e.target.value;
    const platform = detectPlatform(url);
    
    // Reset Classes
    platformIndicator.className = 'platform-indicator';
    
    if (platform) {
      platformIndicator.classList.remove('hidden');
      platformIndicator.classList.add(`show-${platform}`);
    } else {
      if (url.length > 0) {
        platformIndicator.classList.add('hidden');
      } else {
        platformIndicator.classList.add('hidden');
      }
    }
  });

  // Function to extract YouTube Video ID
  function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Handle Form Submit
  downloadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value;
    const platform = detectPlatform(url) || 'Unknown';
    
    // Set UI to loading state
    downloadBtn.classList.add('loading');
    downloadBtn.setAttribute('disabled', 'true');
    resultsSection.classList.remove('show');
    
    setTimeout(() => {
        resultsSection.classList.add('hidden');
    }, 300); // Wait for transition

    const showResults = () => {
      // Restore Button State
      downloadBtn.classList.remove('loading');
      downloadBtn.removeAttribute('disabled');
      // Show Results
      resultsSection.classList.remove('hidden');
      // small delay to allow display block to apply before animating opacity
      setTimeout(() => {
          resultsSection.classList.add('show');
          // scroll to results
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    };

    if (platform === 'youtube') {
      try {
        const videoId = extractYouTubeId(url);
        if (!videoId) throw new Error("Invalid YouTube URL");
        
        const response = await fetch(`https://yt-api.p.rapidapi.com/dl?id=${videoId}`, {
          method: 'GET',
          headers: {
            'X-Rapidapi-Key': 'e96d90efe0msh581f223f0ff179fp159deejsn0b5c37137d3d',
            'X-Rapidapi-Host': 'yt-api.p.rapidapi.com',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error("API request failed");
        
        const data = await response.json();
        if (data.status !== "OK") {
            throw new Error(data.message || "Failed to fetch video data");
        }
        
        updateYouTubeResults(data);
        showResults();

      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Error processing YouTube link. Please check the URL and try again.");
        downloadBtn.classList.remove('loading');
        downloadBtn.removeAttribute('disabled');
      }
    } else {
      // Simulate API Call / Processing Delay (1.5 seconds) for other platforms
      setTimeout(() => {
        updateMockResults(platform);
        showResults();
      }, 1500);
    }
  });

  // Format byte size helper
  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0 || bytes === "0") return 'N/A';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Real Data Update for YouTube
  function updateYouTubeResults(data) {
    resultPlatform.textContent = 'YOUTUBE';
    
    // Update thumbnail, title, and duration
    videoThumbnail.src = data.thumbnail?.[data.thumbnail.length - 1]?.url || data.thumbnail?.[0]?.url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop&sat=-100';
    document.getElementById('video-title').textContent = data.title || 'YouTube Video';
    
    // Format duration from seconds
    const durationSec = data.lengthSeconds ? parseInt(data.lengthSeconds) : 0;
    const m = Math.floor(durationSec / 60);
    const s = durationSec % 60;
    const durationEl = document.getElementById('video-duration');
    if (durationEl) durationEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Update Formats Lists
    const videoFormatsContainer = document.getElementById('video-formats');
    const audioFormatsContainer = document.getElementById('audio-formats');
    
    videoFormatsContainer.innerHTML = '';
    audioFormatsContainer.innerHTML = '';
    
    // Filter and display video formats
    if (data.formats && Array.isArray(data.formats)) {
      // standard formats usually have both video and audio
      const videoFormats = data.formats;
      if (videoFormats.length > 0) {
        videoFormats.forEach(f => {
          const size = formatBytes(f.contentLength);
          const ext = f.mimeType ? f.mimeType.split(';')[0].split('/')[1].toUpperCase() : 'MP4';
          videoFormatsContainer.innerHTML += `
            <div class="format-item">
              <span class="quality">${f.qualityLabel || 'Standard'} ${ext}</span>
              <div class="action-group">
                <span class="size">${size}</span>
                <a href="${f.url}" target="_blank" rel="noopener noreferrer" class="dl-btn" style="display:flex;align-items:center;justify-content:center;text-decoration:none;"><i class="ph-bold ph-download-simple"></i></a>
              </div>
            </div>
          `;
        });
      } else {
        videoFormatsContainer.innerHTML = '<div class="muted-text">No standard video formats found.</div>';
      }
    }

    // Filter and display audio formats
    if (data.adaptiveFormats && Array.isArray(data.adaptiveFormats)) {
      const audioFormats = data.adaptiveFormats.filter(f => f.mimeType && f.mimeType.includes('audio'));
      if (audioFormats.length > 0) {
        audioFormats.forEach(f => {
          const size = formatBytes(f.contentLength);
          const bitrate = f.averageBitrate || f.bitrate;
          const kbps = bitrate ? Math.round(bitrate / 1000) + ' kbps' : 'Audio';
          const ext = f.mimeType ? f.mimeType.split(';')[0].split('/')[1].toUpperCase() : 'MP3';
          audioFormatsContainer.innerHTML += `
            <div class="format-item">
              <span class="quality">${kbps} ${ext}</span>
              <div class="action-group">
                <span class="size">${size}</span>
                <a href="${f.url}" target="_blank" rel="noopener noreferrer" class="dl-btn" style="display:flex;align-items:center;justify-content:center;text-decoration:none;"><i class="ph-bold ph-download-simple"></i></a>
              </div>
            </div>
          `;
        });
      } else {
        audioFormatsContainer.innerHTML = '<div class="muted-text">No audio formats found.</div>';
      }
    }
  }
  
  // Mock Data Updates for non-YouTube
  function updateMockResults(platform) {
    resultPlatform.textContent = platform !== 'Unknown' ? platform.toUpperCase() : 'WEB MEDIA';
    
    // Using slightly desaturated editorial images for the mock
    if (platform === 'youtube') {
      videoThumbnail.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop&sat=-100';
    } else if (platform === 'instagram') {
      videoThumbnail.src = 'https://images.unsplash.com/photo-1611262588024-d12430b98920?q=80&w=1000&auto=format&fit=crop&sat=-100';
    } else if (platform === 'facebook') {
      videoThumbnail.src = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1000&auto=format&fit=crop&sat=-100';
    } else {
      videoThumbnail.src = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1000&auto=format&fit=crop&sat=-100';
    }
  }
});
