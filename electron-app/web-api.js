// Web-compatible API that mimics Electron IPC using HTTP/WebSocket
// This file should only be loaded when running in browser (not Electron)
(function() {
  'use strict';
  
  let socket = null;
  let outputCallbacks = [];
  let socketReady = false;

  // Initialize WebSocket connection
  function initWebSocket() {
    if (typeof io === 'undefined') {
      console.warn('Socket.IO not loaded yet');
      return;
    }
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      socket = io(wsUrl, {
        transports: ['websocket', 'polling']
      });
      
      socket.on('connect', () => {
        socketReady = true;
        console.log('WebSocket connected');
      });
      
      socket.on('disconnect', () => {
        socketReady = false;
        console.log('WebSocket disconnected');
      });
      
      socket.on('zeno-output', (data) => {
        outputCallbacks.forEach(callback => {
          try {
            callback(data);
          } catch (e) {
            console.error('Error in output callback:', e);
          }
        });
      });
      
      socket.on('zeno-complete', (data) => {
        // Handle completion if needed
        console.log('Zeno process completed:', data);
      });
      
      socket.on('zeno-error', (data) => {
        // Handle errors if needed
        console.error('Zeno process error:', data);
      });
      
      // Set up hot reload listener
      socket.on('reload', () => {
        console.log('🔄 Reloading page...');
        window.location.reload();
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Initialize WebSocket when Socket.IO is available
  if (typeof io !== 'undefined') {
    initWebSocket();
  } else {
    // Wait for Socket.IO to load
    const checkSocketIO = setInterval(() => {
      if (typeof io !== 'undefined') {
        clearInterval(checkSocketIO);
        initWebSocket();
      }
    }, 50);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkSocketIO);
      if (typeof io === 'undefined') {
        console.error('Socket.IO failed to load');
      }
    }, 5000);
  }

// Web-compatible electronAPI
window.electronAPI = {
  runZeno: async (options) => {
    const response = await fetch('/api/run-zeno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    return response.json();
  },
  
  stopZeno: async () => {
    const response = await fetch('/api/stop-zeno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },
  
  onZenoOutput: (callback) => {
    outputCallbacks.push(callback);
  },
  
  removeZenoOutputListener: () => {
    outputCallbacks = [];
  },
  
  openExternal: (url) => {
    window.open(url, '_blank');
    return Promise.resolve();
  },
  
  openChatWindow: () => {
    // In web mode, open chat in a new window or modal
    window.open('/chat.html', 'chat', 'width=800,height=600');
    return Promise.resolve({ success: true });
  },
  
  closeChatWindow: () => {
    // Close chat window if opened
    return Promise.resolve({ success: true });
  },
  
  isChatWindowOpen: () => {
    // Check if chat window is open
    return Promise.resolve({ open: false });
  }
};

})(); // End IIFE
