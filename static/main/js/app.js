// Forge bridge is automatically available via window.__bridge in Custom UI
// With resolver, we use invoke to call the resolver function
// The resolver function name is defined in manifest.yml as 'global-page-handler'

// Wait for bridge to be ready
function waitForBridge(maxAttempts = 50, delay = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkBridge = () => {
      console.log(`Checking bridge (attempt ${attempts + 1}/${maxAttempts})...`, {
        hasBridge: !!window.__bridge,
        hasInvoke: !!(window.__bridge && window.__bridge.invoke),
        hasCallBridge: !!(window.__bridge && window.__bridge.callBridge),
      });
      
      if (window.__bridge && (window.__bridge.invoke || window.__bridge.callBridge)) {
        console.log('Bridge is ready!', {
          hasInvoke: !!window.__bridge.invoke,
          hasCallBridge: !!window.__bridge.callBridge,
        });
        resolve();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkBridge, delay);
      } else {
        console.error('Bridge not available after all attempts');
        reject(new Error('Forge bridge not available after waiting. Make sure you are running in a Forge environment.'));
      }
    };
    checkBridge();
  });
}

function getInvoke() {
  // Check if bridge is available
  if (window.__bridge && window.__bridge.invoke) {
    return window.__bridge.invoke.bind(window.__bridge);
  }
  // Fallback to callBridge if invoke is not available
  if (window.__bridge && window.__bridge.callBridge) {
    return (functionName, payload) => {
      return new Promise((resolve, reject) => {
        try {
          window.__bridge.callBridge(functionName, payload, (error, result) => {
            if (error) {
              reject(new Error(error.message || String(error)));
            } else {
              resolve(result);
            }
          });
        } catch (err) {
          reject(err);
        }
      });
    };
  }
  throw new Error('Forge bridge not available. Make sure you are running in a Forge environment.');
}

let currentFeedId = null;
let currentMappingTopic = null;
let config = null;

// Load configuration on page load, after bridge is ready
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await waitForBridge();
    loadConfiguration();
  } catch (error) {
    console.error('Failed to initialize bridge:', error);
    
    // Check if it's a tunnel connection error
    const errorMessage = error.message || String(error);
    if (errorMessage.includes('blocked') || errorMessage.includes('private network') || errorMessage.includes('connection')) {
      showStatus('⚠️ Tunnel connection blocked. Please reload the page (F5 or Cmd+R) to allow the connection to your local tunnel.', 'error');
    } else {
      showStatus('Error: Failed to initialize Forge bridge. Please refresh the page.', 'error');
    }
  }
});

async function callBackend(action, payload = {}) {
  try {
    console.log('=== CALLING BACKEND ===', { action, payload });
    
    // Ensure bridge is ready before calling
    await waitForBridge();
    console.log('Bridge is ready, getting invoke function');
    
    const invoke = getInvoke();
    console.log('Invoke function obtained:', typeof invoke);
    
    const callPayload = {
      action,
      ...payload
    };
    console.log('Calling invoke with:', {
      functionName: 'global-page-handler',
      payload: callPayload
    });
    
    // When using resolver with Custom UI, bridge automatically handles the routing
    // We just pass the payload directly - bridge will wrap it with functionKey
    // The resolver function name is 'global-page-handler' (defined in manifest.yml resolver.function)
    const result = await invoke('global-page-handler', callPayload);
    
    console.log('=== BACKEND RESULT ===', result);
    return result;
  } catch (error) {
    console.error('=== BACKEND ERROR ===', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    showStatus('Error: ' + (error.message || String(error)), 'error');
    throw error;
  }
}

async function loadConfiguration() {
  try {
    const result = await callBackend('getConfig');
    config = result.config;
    renderFeeds();
    renderMappings();
    renderSettings();
    showStatus('Configuration loaded', 'success');
  } catch (error) {
    showStatus('Failed to load configuration', 'error');
  }
}

function renderFeeds() {
  const container = document.getElementById('feeds-list');
  container.innerHTML = '';
  
  config.feeds.forEach(feed => {
    const div = document.createElement('div');
    div.className = 'list-item';
    
    const enabledBadge = feed.enabled 
      ? '<span class="enabled-badge">✓ Enabled</span>' 
      : '<span class="disabled-badge">Disabled</span>';
    
    const keywordTags = feed.keywords.map(k => 
      `<span class="keyword-tag">${escapeHtml(k)}</span>`
    ).join('');
    
    div.innerHTML = `
      <div class="list-item-header">
        <div>
          <span class="list-item-title">${escapeHtml(feed.name)}</span>
          ${enabledBadge}
        </div>
        <div>
          <button class="secondary" data-feed-id="${escapeHtml(feed.id)}" data-action="edit-feed">Edit</button>
          <button class="danger" data-feed-id="${escapeHtml(feed.id)}" data-action="delete-feed">Delete</button>
        </div>
      </div>
      <div class="feed-url">${escapeHtml(feed.url)}</div>
      <div class="keywords">
        ${keywordTags}
      </div>
    `;
    
    // Add event listeners
    div.querySelector('[data-action="edit-feed"]').addEventListener('click', () => editFeed(feed.id));
    div.querySelector('[data-action="delete-feed"]').addEventListener('click', () => deleteFeed(feed.id));
    
    container.appendChild(div);
  });
}

function renderMappings() {
  const container = document.getElementById('mappings-list');
  container.innerHTML = '';
  
  config.topicMappings.forEach(mapping => {
    const div = document.createElement('div');
    div.className = 'list-item';
    
    const parentInfo = mapping.parentPageTitle 
      ? `<span class="mapping-info">→ Parent: ${escapeHtml(mapping.parentPageTitle)}</span>` 
      : '';
    
    div.innerHTML = `
      <div class="list-item-header">
        <div>
          <span class="list-item-title">${escapeHtml(mapping.topic)}</span>
          <span class="mapping-info">→ Space: ${escapeHtml(mapping.spaceKey)}</span>
          ${parentInfo}
        </div>
        <div>
          <button class="secondary" data-topic="${escapeHtml(mapping.topic)}" data-action="edit-mapping">Edit</button>
          <button class="danger" data-topic="${escapeHtml(mapping.topic)}" data-action="delete-mapping">Delete</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    div.querySelector('[data-action="edit-mapping"]').addEventListener('click', () => editMapping(mapping.topic));
    div.querySelector('[data-action="delete-mapping"]').addEventListener('click', () => deleteMapping(mapping.topic));
    
    container.appendChild(div);
  });
}

function renderSettings() {
  document.getElementById('schedule-interval').value = config.scheduleInterval;
  document.getElementById('ai-summarization').checked = config.enableAISummarization;
  document.getElementById('dedup-window').value = config.deduplicationWindow;
}

function showAddFeedForm() {
  currentFeedId = null;
  document.getElementById('feed-name').value = '';
  document.getElementById('feed-url').value = '';
  document.getElementById('feed-keywords').value = '';
  document.getElementById('feed-enabled').checked = true;
  document.getElementById('feed-form').classList.remove('hidden');
}

function editFeed(feedId) {
  const feed = config.feeds.find(f => f.id === feedId);
  if (!feed) return;
  
  currentFeedId = feedId;
  document.getElementById('feed-name').value = feed.name;
  document.getElementById('feed-url').value = feed.url;
  document.getElementById('feed-keywords').value = feed.keywords.join('\n');
  document.getElementById('feed-enabled').checked = feed.enabled;
  document.getElementById('feed-form').classList.remove('hidden');
}

function cancelFeedForm() {
  document.getElementById('feed-form').classList.add('hidden');
  currentFeedId = null;
}

async function saveFeed() {
  const name = document.getElementById('feed-name').value.trim();
  const url = document.getElementById('feed-url').value.trim();
  const keywordsText = document.getElementById('feed-keywords').value.trim();
  const enabled = document.getElementById('feed-enabled').checked;

  if (!name || !url) {
    showStatus('Please fill in all required fields', 'error');
    return;
  }

  const keywords = keywordsText.split('\n').map(k => k.trim()).filter(k => k);

  const feed = {
    id: currentFeedId || `feed-${Date.now()}`,
    name,
    url,
    keywords,
    enabled,
  };

  try {
    console.log('Saving feed:', feed);
    const result = await callBackend('upsertFeed', { feed });
    console.log('Save feed result:', result);
    
    if (result.error) {
      showStatus('Failed to save feed: ' + result.error, 'error');
      return;
    }
    
    showStatus('Feed saved successfully', 'success');
    cancelFeedForm();
    loadConfiguration();
  } catch (error) {
    console.error('Error saving feed:', error);
    showStatus('Failed to save feed: ' + (error.message || String(error)), 'error');
  }
}

async function deleteFeed(feedId) {
  if (!confirm('Are you sure you want to delete this feed?')) return;

  try {
    await callBackend('removeFeed', { feedId });
    showStatus('Feed deleted', 'success');
    loadConfiguration();
  } catch (error) {
    showStatus('Failed to delete feed', 'error');
  }
}

function showAddMappingForm() {
  currentMappingTopic = null;
  document.getElementById('mapping-topic').value = '';
  document.getElementById('mapping-space').value = '';
  document.getElementById('mapping-parent').value = '';
  document.getElementById('mapping-form').classList.remove('hidden');
}

function editMapping(topic) {
  const mapping = config.topicMappings.find(m => m.topic === topic);
  if (!mapping) return;
  
  currentMappingTopic = topic;
  document.getElementById('mapping-topic').value = mapping.topic;
  document.getElementById('mapping-space').value = mapping.spaceKey;
  document.getElementById('mapping-parent').value = mapping.parentPageTitle || '';
  document.getElementById('mapping-form').classList.remove('hidden');
}

function cancelMappingForm() {
  document.getElementById('mapping-form').classList.add('hidden');
  currentMappingTopic = null;
}

async function saveMapping() {
  const topic = document.getElementById('mapping-topic').value.trim();
  const spaceKey = document.getElementById('mapping-space').value.trim();
  const parentPageTitle = document.getElementById('mapping-parent').value.trim();

  if (!topic || !spaceKey) {
    showStatus('Please fill in topic and space key', 'error');
    return;
  }

  const mapping = {
    topic,
    spaceKey,
    ...(parentPageTitle && { parentPageTitle }),
  };

  try {
    await callBackend('upsertTopicMapping', { mapping });
    showStatus('Mapping saved successfully', 'success');
    cancelMappingForm();
    loadConfiguration();
  } catch (error) {
    showStatus('Failed to save mapping', 'error');
  }
}

async function deleteMapping(topic) {
  if (!confirm('Are you sure you want to delete this mapping?')) return;

  try {
    await callBackend('removeTopicMapping', { topic });
    showStatus('Mapping deleted', 'success');
    loadConfiguration();
  } catch (error) {
    showStatus('Failed to delete mapping', 'error');
  }
}

async function saveSettings() {
  const scheduleInterval = parseInt(document.getElementById('schedule-interval').value);
  const enableAISummarization = document.getElementById('ai-summarization').checked;
  const deduplicationWindow = parseInt(document.getElementById('dedup-window').value);

  config.scheduleInterval = scheduleInterval;
  config.enableAISummarization = enableAISummarization;
  config.deduplicationWindow = deduplicationWindow;

  try {
    await callBackend('saveConfig', { config });
    showStatus('Settings saved successfully', 'success');
  } catch (error) {
    showStatus('Failed to save settings', 'error');
  }
}

async function processFeedsNow() {
  try {
    showStatus('Processing feeds...', 'success');
    const result = await callBackend('processFeeds');
    if (result.success) {
      showStatus(
        `Processing complete: ${result.result.publishedItems} published, ${result.result.skippedItems} skipped`,
        'success'
      );
    } else {
      showStatus('Processing failed', 'error');
    }
  } catch (error) {
    showStatus('Failed to process feeds', 'error');
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally available
window.showAddFeedForm = showAddFeedForm;
window.saveFeed = saveFeed;
window.cancelFeedForm = cancelFeedForm;
window.showAddMappingForm = showAddMappingForm;
window.saveMapping = saveMapping;
window.cancelMappingForm = cancelMappingForm;
window.saveSettings = saveSettings;
window.processFeedsNow = processFeedsNow;
window.loadConfiguration = loadConfiguration;

