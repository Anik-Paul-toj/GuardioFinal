// WebRTC mesh manager with WebSocket signaling and AsyncStorage caching for React Native/Expo
import AsyncStorage from '@react-native-async-storage/async-storage';

// WebRTC polyfill for React Native - use react-native-webrtc if available, otherwise fallback to web APIs
let RTCPeerConnection: any;
let RTCSessionDescription: any;
let RTCIceCandidate: any;

// Try to use native WebRTC APIs (works on Expo web, may need react-native-webrtc for native)
if (typeof window !== 'undefined') {
  if (window.RTCPeerConnection) {
    RTCPeerConnection = window.RTCPeerConnection;
    RTCSessionDescription = window.RTCSessionDescription || (window as any).webkitRTCSessionDescription;
    RTCIceCandidate = window.RTCIceCandidate || (window as any).webkitRTCIceCandidate;
  }
}

// Fallback: try react-native-webrtc if available (for native platforms)
if (!RTCPeerConnection) {
  try {
    const webrtc = require('react-native-webrtc');
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    console.log('WebRTC loaded from react-native-webrtc');
  } catch (e) {
    // WebRTC not available - will throw error when trying to use
    console.warn('⚠️ WebRTC not available. WebRTC requires native modules and does not work in Expo Go.');
    console.warn('💡 To use WebRTC:');
    console.warn('   1. Create a development build: npx expo prebuild');
    console.warn('   2. Install react-native-webrtc: npm install react-native-webrtc');
    console.warn('   3. Rebuild your app');
  }
}

// Export whether WebRTC is available
export const isWebRTCAvailable = !!RTCPeerConnection;

export interface WebRTCMeshConfig {
  roomId?: string;
  signalingUrl?: string;
  onPeersChange?: (count: number) => void;
  onSOS?: (alert: any) => void;
  onConnectionStateChange?: (state: 'connecting' | 'connected' | 'disconnected') => void;
  iceServers?: RTCConfiguration['iceServers'];
}

interface PeerEntry {
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
}

export class WebRTCMesh {
  roomId: string;
  signalingUrl: string;
  socket: WebSocket | null;
  clientId: string | null;
  peers: Map<string, PeerEntry>;
  onPeersChange: (count: number) => void;
  onSOS: (alert: any) => void;
  onConnectionStateChange: (state: 'connecting' | 'connected' | 'disconnected') => void;
  iceServers: RTCConfiguration['iceServers'];

  constructor({
    roomId = 'sos_room',
    signalingUrl,
    onPeersChange,
    onSOS,
    onConnectionStateChange,
    iceServers,
  }: WebRTCMeshConfig = {}) {
    this.roomId = roomId;
    
    // Default signaling URL - for React Native, use localhost or configurable IP
    if (!signalingUrl) {
      // In React Native, you might want to use your computer's IP address
      // For now, default to localhost:8080
      this.signalingUrl = 'ws://localhost:8080';
    } else {
      this.signalingUrl = signalingUrl;
    }
    
    this.socket = null;
    this.clientId = null;
    this.peers = new Map();
    this.onPeersChange = onPeersChange || (() => {});
    this.onSOS = onSOS || (() => {});
    this.onConnectionStateChange = onConnectionStateChange || (() => {});
    this.iceServers = iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }];
  }

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private peerCountInterval: ReturnType<typeof setInterval> | null = null;

  connect() {
    // Check if WebRTC is available before connecting
    if (!RTCPeerConnection) {
      console.error('⚠️ Cannot connect: WebRTC is not available. This requires a custom development build (not Expo Go).');
      this.onConnectionStateChange('disconnected');
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
    
    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Don't reconnect if we've exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max WebSocket reconnect attempts reached. Please check if the signaling server is running.');
      this.onConnectionStateChange('disconnected');
      return;
    }

    try {
      console.log(`Connecting to signaling server: ${this.signalingUrl}`);
      this.onConnectionStateChange('connecting');
      this.socket = new WebSocket(this.signalingUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0; // Reset on successful connection
        this.onConnectionStateChange('connected');
        this.socket?.send(JSON.stringify({ type: 'join', roomId: this.roomId }));
        
        // Start periodic peer count updates to catch state changes
        if (this.peerCountInterval) {
          clearInterval(this.peerCountInterval);
        }
        this.peerCountInterval = setInterval(() => {
          const count = this.getPeerCount();
          this.onPeersChange(count);
        }, 1000); // Update every second
      };
      
      this.socket.onmessage = async (evt) => {
        try {
          const data = typeof evt.data === 'string' ? evt.data : evt.data.toString();
          const msg = JSON.parse(data);
          if (msg.type === 'hello') {
            this.clientId = msg.clientId;
            console.log('Received client ID:', this.clientId);
          } else if (msg.type === 'peers') {
            const others = msg.peers.filter((id: string) => id !== this.clientId);
            console.log(`Received peers list: ${others.length} peers (excluding self)`);
            for (const id of others) {
              // Simple glare avoidance: only the higher id initiates
              const shouldInitiate = this.clientId && Number(this.clientId) > Number(id);
              console.log(`Peer ${id}: shouldInitiate=${shouldInitiate}, hasPeer=${this.peers.has(id)}`);
              if (shouldInitiate && !this.peers.has(id)) {
                console.log(`Creating offer to peer ${id}`);
                await this._createOfferTo(id);
              } else if (!shouldInitiate && !this.peers.has(id)) {
                // Wait for the other peer to initiate, but ensure we have a peer entry
                console.log(`Waiting for peer ${id} to initiate connection`);
                await this._ensurePeer(id);
              }
            }
            // Update peer count after processing all peers
            // Use multiple timeouts to catch delayed connections
            setTimeout(() => {
              this.onPeersChange(this.getPeerCount());
            }, 100);
            setTimeout(() => {
              this.onPeersChange(this.getPeerCount());
            }, 500);
            setTimeout(() => {
              this.onPeersChange(this.getPeerCount());
            }, 2000);
          } else if (msg.type === 'signal') {
            await this._handleSignal(msg.from, msg.payload);
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        // WebSocket error events don't provide detailed info in React Native
        // The actual error details will be in the onclose event
        console.log(`WebSocket connection error to ${this.signalingUrl}. Check if signaling server is running.`);
        // Error will trigger onclose, so we handle reconnection there
      };
      
      this.socket.onclose = (event) => {
        const code = event.code;
        const reason = event.reason || 'unknown';
        
        // Provide user-friendly error messages based on close codes
        let errorMessage = '';
        if (code === 1000) {
          // Normal closure - no error
          console.log(`WebSocket closed normally`);
        } else if (code === 1006) {
          // Abnormal closure (usually connection refused or network error)
          errorMessage = `Connection failed. Is the signaling server running at ${this.signalingUrl}?`;
          console.log(`WebSocket connection failed: ${errorMessage}`);
        } else {
          errorMessage = `WebSocket closed (code: ${code}, reason: ${reason})`;
          console.log(errorMessage);
        }
        
        this.onConnectionStateChange('disconnected');
        
        // Don't reconnect if it was a normal closure or if we're disconnected
        if (code === 1000) {
          return;
        }

        // Don't reconnect if we've exceeded max attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn(`Max reconnection attempts reached. ${errorMessage || 'Please check your connection and signaling server.'}`);
          return;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, etc., max 30s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.onConnectionStateChange('connecting');
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, delay);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.onConnectionStateChange('disconnected');
      // Retry after delay
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;
      this.onConnectionStateChange('connecting');
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  async _ensurePeer(id: string): Promise<PeerEntry> {
    if (this.peers.has(id)) return this.peers.get(id)!;
    
    if (!RTCPeerConnection) {
      const errorMsg = 'RTCPeerConnection is not available. WebRTC requires react-native-webrtc and a custom development build (not Expo Go).';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    const stateUpdate = () => {
      const count = this.getPeerCount();
      console.log(`Peer ${id} state changed. Total peers: ${count}`);
      // Use setTimeout to ensure state has settled
      setTimeout(() => {
        this.onPeersChange(this.getPeerCount());
      }, 100);
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`Peer ${id} connection state: ${pc.connectionState}`);
      stateUpdate();
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log(`Peer ${id} ICE connection state: ${pc.iceConnectionState}`);
      stateUpdate();
    };
    
    pc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) {
        console.log(`Sending ICE candidate to ${id}`);
        this._sendSignal(id, { type: 'candidate', candidate: e.candidate });
      } else {
        console.log(`ICE gathering complete for ${id}`);
      }
    };
    
    pc.ondatachannel = (evt: RTCDataChannelEvent) => {
      console.log(`Received data channel from ${id}`);
      const dc = evt.channel;
      this._attachDC(id, pc, dc);
    };
    
    const entry: PeerEntry = { pc, dc: null };
    this.peers.set(id, entry);
    return entry;
  }

  _attachDC(id: string, pc: RTCPeerConnection, dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';
    dc.onopen = () => {
      console.log(`Data channel opened with peer ${id}`);
      // Update immediately and again after a short delay to ensure state is stable
      const count = this.getPeerCount();
      console.log(`Total connected peers: ${count}`);
      this.onPeersChange(count);
      setTimeout(() => {
        this.onPeersChange(this.getPeerCount());
      }, 200);
    };
    dc.onclose = () => {
      console.log(`Data channel closed with peer ${id}`);
      const count = this.getPeerCount();
      console.log(`Total connected peers: ${count}`);
      this.onPeersChange(count);
      setTimeout(() => {
        this.onPeersChange(this.getPeerCount());
      }, 200);
    };
    dc.onerror = (error) => {
      console.error(`Data channel error with peer ${id}:`, error);
    };
    dc.onmessage = (evt) => {
      try {
        const data = typeof evt.data === 'string' ? evt.data : new TextDecoder().decode(evt.data as ArrayBuffer);
        const msg = JSON.parse(data);
        if (msg.kind === 'sos') {
          this.onSOS(msg.data);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    const entry = this.peers.get(id);
    if (entry) {
      entry.dc = dc;
    } else {
      this.peers.set(id, { pc, dc });
    }
  }

  async _createOfferTo(id: string) {
    const { pc } = await this._ensurePeer(id);
    const dc = pc.createDataChannel('sos');
    this._attachDC(id, pc, dc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this._sendSignal(id, { type: 'offer', sdp: offer });
  }

  async _handleSignal(from: string, payload: any) {
    const entry = await this._ensurePeer(from);
    const pc = entry.pc;
    
    if (payload.type === 'offer') {
      // Only accept offers when stable to avoid glare
      if (pc.signalingState !== 'stable') return;
      try {
        if (!RTCSessionDescription) {
          throw new Error('RTCSessionDescription is not available');
        }
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await this._sendSignal(from, { type: 'answer', sdp: answer });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    } else if (payload.type === 'answer') {
      // Only set answer if we are in have-local-offer state
      if (pc.signalingState !== 'have-local-offer') return;
      try {
        if (!RTCSessionDescription) {
          throw new Error('RTCSessionDescription is not available');
        }
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    } else if (payload.type === 'candidate') {
      // Add candidates only after remote description set
      if (!pc.remoteDescription) return;
      try {
        if (!RTCIceCandidate) {
          throw new Error('RTCIceCandidate is not available');
        }
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  async _sendSignal(to: string, payload: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: 'signal', roomId: this.roomId, to, payload }));
  }

  getPeerCount(): number {
    let count = 0;
    for (const [id, { pc, dc }] of this.peers.entries()) {
      // Check if peer connection is established AND data channel is open
      // We require:
      // 1. Connection state is 'connected' (not just 'connecting')
      // 2. ICE connection is 'connected' or 'completed'
      // 3. Data channel exists and is open
      const isConnected = pc.connectionState === 'connected' &&
                          (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') &&
                          dc && dc.readyState === 'open';
      
      if (isConnected) {
        count++;
        console.log(`Peer ${id} is connected (connectionState: ${pc.connectionState}, iceState: ${pc.iceConnectionState}, dcState: ${dc.readyState})`);
      } else {
        console.log(`Peer ${id} not fully connected (connectionState: ${pc.connectionState}, iceState: ${pc.iceConnectionState}, dcState: ${dc?.readyState || 'null'})`);
      }
    }
    console.log(`Current peer count: ${count}`);
    return count;
  }

  broadcastSOS(sos: any) {
    const data = JSON.stringify({ kind: 'sos', data: sos });
    for (const { dc } of this.peers.values()) {
      if (dc && dc.readyState === 'open') {
        try {
          dc.send(data);
        } catch (error) {
          console.error('Error sending SOS:', error);
        }
      }
    }
  }

  disconnect() {
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Clear peer count interval
    if (this.peerCountInterval) {
      clearInterval(this.peerCountInterval);
      this.peerCountInterval = null;
    }
    
    this.onConnectionStateChange('disconnected');
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect'); // Normal closure
      this.socket = null;
    }
    for (const { pc } of this.peers.values()) {
      pc.close();
    }
    this.peers.clear();
    this.reconnectAttempts = 0;
    this.onPeersChange(0);
  }
}

// AsyncStorage-based storage for pending alerts (replaces IndexedDB)
export const sosStorage = {
  async addPending(alert: any): Promise<void> {
    try {
      const pending = await this.getAllPending();
      const id = Date.now().toString();
      pending.push({ ...alert, id });
      await AsyncStorage.setItem('sos_pending', JSON.stringify(pending));
    } catch (error) {
      console.error('Error adding pending alert:', error);
    }
  },

  async getAllPending(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('sos_pending');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending alerts:', error);
      return [];
    }
  },

  async clearPending(): Promise<void> {
    try {
      await AsyncStorage.removeItem('sos_pending');
    } catch (error) {
      console.error('Error clearing pending alerts:', error);
    }
  },
};

