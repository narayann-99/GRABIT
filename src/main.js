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
        
        const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
          method: 'GET',
          headers: {
            'X-Rapidapi-Key': 'e96d90efe0msh581f223f0ff179fp159deejsn0b5c37137d3d',
            'X-Rapidapi-Host': 'youtube-mp36.p.rapidapi.com',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error("API request failed");
        
        const data = await response.json();
        
        // Handle 'You are not subscribed' or other API errors
        if (data.message && data.message.includes("not subscribed")) {
            throw new Error("API Subscription Required: Please subscribe to youtube-mp36 on RapidAPI.");
        }

        // Handle processing status
        if (data.status === "processing") {
            alert("The audio is still processing on the server. Please try again in a few seconds.");
            downloadBtn.classList.remove('loading');
            downloadBtn.removeAttribute('disabled');
            return;
        }

        if (data.status !== "ok" && data.status !== "success") {
             // Some APIs return status: "fail" or similar
            if (!data.link) {
               throw new Error(data.msg || data.message || "Failed to fetch audio data");
            }
        }
        
        updateYouTubeResults(data, videoId);
        showResults();

      } catch (error) {
        console.error("Error fetching data:", error);
        alert(error.message || "Error processing YouTube link. Please check the URL and try again.");
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

  // Real Data Update for YouTube (youtube-mp36 API)
  function updateYouTubeResults(data, videoId) {
    resultPlatform.textContent = 'YOUTUBE MP3';
    
    // Update thumbnail using standard YouTube thumbnail URL
    videoThumbnail.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    document.getElementById('video-title').textContent = data.title || 'YouTube Audio';
    
    // Format duration from seconds
    const durationSec = data.duration ? parseInt(data.duration) : 0;
    const m = Math.floor(durationSec / 60);
    const s = durationSec % 60;
    const durationEl = document.getElementById('video-duration');
    if (durationEl) durationEl.textContent = durationSec > 0 ? `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : 'Audio';

    // Update Formats Lists
    const videoFormatsContainer = document.getElementById('video-formats');
    const audioFormatsContainer = document.getElementById('audio-formats');
    
    videoFormatsContainer.innerHTML = '<div class="muted-text">Video formats are not supported by the current MP3 API.</div>';
    audioFormatsContainer.innerHTML = '';
    
    if (data.link) {
      const size = formatBytes(data.filesize || data.size);
      audioFormatsContainer.innerHTML = `
        <div class="format-item">
          <span class="quality">High Quality MP3</span>
          <div class="action-group">
            <span class="size">${size !== 'N/A' ? size : ''}</span>
            <a href="${data.link}" target="_blank" rel="noopener noreferrer" class="dl-btn" style="display:flex;align-items:center;justify-content:center;text-decoration:none;"><i class="ph-bold ph-download-simple"></i></a>
          </div>
        </div>
      `;
    } else {
      audioFormatsContainer.innerHTML = '<div class="muted-text">Audio link not available.</div>';
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
