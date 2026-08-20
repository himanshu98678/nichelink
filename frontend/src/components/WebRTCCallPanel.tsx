import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, X } from 'lucide-react';
import { getSocket } from '../services/socket';
import { WEBRTC_ICE_SERVERS } from '../services/webrtc';

type CallType = 'voice' | 'video';
type CallStatus = 'incoming' | 'calling' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'failed';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

interface IncomingCall {
  callId: string;
  conversationId: string;
  callType: CallType;
  caller: Participant;
}

interface WebRTCCallPanelProps {
  conversationId: string;
  participant: Participant;
  callType: CallType;
  incomingCall?: IncomingCall;
  onClose: () => void;
}

const statusText: Record<CallStatus, string> = {
  incoming: 'Incoming call',
  calling: 'Calling...',
  connecting: 'Connecting...',
  connected: 'Connected',
  ended: 'Call ended',
  rejected: 'Call declined',
  failed: 'Call failed',
};

export const WebRTCCallPanel: React.FC<WebRTCCallPanelProps> = ({ conversationId, participant, callType, incomingCall, onClose }) => {
  const socket = getSocket();
  const [status, setStatus] = useState<CallStatus>(incomingCall ? 'incoming' : 'calling');
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(callType === 'video');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaPromiseRef = useRef<Promise<MediaStream | null> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callIdRef = useRef(incomingCall?.callId || '');
  const finishedRef = useRef(false);

  const closeMedia = () => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const finish = (event: 'call:end' | 'call:cancel' | 'call:reject', nextStatus: CallStatus) => {
    if (!finishedRef.current && socket && callIdRef.current) {
      socket.emit(event, { callId: callIdRef.current, conversationId });
    }
    finishedRef.current = true;
    closeMedia();
    setStatus(nextStatus);
  };

  const addPendingCandidates = async (peer: RTCPeerConnection) => {
    for (const candidate of pendingCandidatesRef.current.splice(0)) {
      await peer.addIceCandidate(candidate);
    }
  };

  const createPeer = () => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({ iceServers: WEBRTC_ICE_SERVERS });
    peer.onicecandidate = (event) => {
      if (event.candidate && socket && callIdRef.current) {
        socket.emit('call:ice-candidate', { callId: callIdRef.current, conversationId, candidate: event.candidate.toJSON() });
      }
    };
    peer.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setStatus('connected');
      if (['failed', 'disconnected', 'closed'].includes(peer.connectionState) && !finishedRef.current) {
        setError('The peer connection was interrupted.');
        finish('call:end', 'failed');
      }
    };
    peerRef.current = peer;
    localStreamRef.current?.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current!));
    return peer;
  };

  const requestMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (mediaPromiseRef.current) return mediaPromiseRef.current;
    mediaPromiseRef.current = (async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (mediaError: any) {
      setError(mediaError?.name === 'NotAllowedError' ? 'Microphone or camera permission was denied.' : 'Unable to access your microphone or camera.');
      setStatus('failed');
      finishedRef.current = true;
      if (socket && callIdRef.current) socket.emit(incomingCall ? 'call:reject' : 'call:cancel', { callId: callIdRef.current, conversationId });
      return null;
    }
    })();
    const stream = await mediaPromiseRef.current;
    mediaPromiseRef.current = null;
    return stream;
  };

  const createOffer = async () => {
    const peer = peerRef.current;
    if (!peer || !socket) return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('call:offer', { callId: callIdRef.current, conversationId, offer });
    setStatus('connecting');
  };

  const acceptIncoming = async () => {
    if (!socket || !incomingCall) return;
    const stream = await requestMedia();
    if (!stream) return;
    createPeer();
    socket.emit('call:accept', { callId: incomingCall.callId, conversationId }, (response: { success: boolean; error?: string }) => {
      if (!response?.success) { setError(response?.error || 'Unable to accept call.'); setStatus('failed'); }
      else setStatus('connecting');
    });
  };

  useEffect(() => {
    if (!socket) { setError('Real-time connection is unavailable.'); setStatus('failed'); return undefined; }
    const onAccepted = async (payload: any) => {
      if (payload?.conversationId !== conversationId || payload.callId !== callIdRef.current) return;
      const stream = await requestMedia();
      if (!stream) return;
      createPeer();
      await createOffer();
    };
    const onOffer = async (payload: any) => {
      if (payload?.conversationId !== conversationId || payload.callId !== callIdRef.current || !payload.offer) return;
      const peer = peerRef.current;
      if (!peer) return;
      await peer.setRemoteDescription(payload.offer);
      await addPendingCandidates(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('call:answer', { callId: callIdRef.current, conversationId, answer });
      setStatus('connecting');
    };
    const onAnswer = async (payload: any) => {
      if (payload?.conversationId !== conversationId || payload.callId !== callIdRef.current || !payload.answer || !peerRef.current) return;
      await peerRef.current.setRemoteDescription(payload.answer);
      await addPendingCandidates(peerRef.current);
    };
    const onCandidate = async (payload: any) => {
      if (payload?.conversationId !== conversationId || payload.callId !== callIdRef.current || !payload.candidate) return;
      if (peerRef.current?.remoteDescription) await peerRef.current.addIceCandidate(payload.candidate);
      else pendingCandidatesRef.current.push(payload.candidate);
    };
    const onEnded = (payload: any) => {
      if (payload?.conversationId === conversationId && payload.callId === callIdRef.current) { finishedRef.current = true; closeMedia(); setStatus('ended'); }
    };
    const onRejected = (payload: any) => {
      if (payload?.conversationId === conversationId && payload.callId === callIdRef.current) { finishedRef.current = true; closeMedia(); setStatus('rejected'); }
    };
    const onCancelled = onRejected;

    socket.on('call:accepted', onAccepted);
    socket.on('call:offer', onOffer);
    socket.on('call:answer', onAnswer);
    socket.on('call:ice-candidate', onCandidate);
    socket.on('call:ended', onEnded);
    socket.on('call:rejected', onRejected);
    socket.on('call:cancelled', onCancelled);

    if (!incomingCall) {
      socket.emit('call:initiate', { conversationId, callType }, (response: { success: boolean; callId?: string; error?: string }) => {
        if (!response?.success || !response.callId) { setError(response?.error || 'Unable to start call.'); setStatus('failed'); return; }
        callIdRef.current = response.callId;
        requestMedia().then((stream) => { if (stream) createPeer(); });
      });
    }

    return () => {
      socket.off('call:accepted', onAccepted);
      socket.off('call:offer', onOffer);
      socket.off('call:answer', onAnswer);
      socket.off('call:ice-candidate', onCandidate);
      socket.off('call:ended', onEnded);
      socket.off('call:rejected', onRejected);
      socket.off('call:cancelled', onCancelled);
      if (!finishedRef.current && callIdRef.current) socket.emit(incomingCall ? 'call:reject' : 'call:end', { callId: callIdRef.current, conversationId });
      closeMedia();
    };
  }, [conversationId, callType, incomingCall, socket]);

  useEffect(() => {
    if (status === 'ended' || status === 'rejected' || status === 'failed') {
      const timeout = window.setTimeout(onClose, 1800);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [status, onClose]);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); }
  };
  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCameraEnabled(track.enabled); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl text-white">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800"><div><p className="text-xs uppercase tracking-widest text-slate-400">{callType} call</p><h2 className="font-bold">{participant.name}</h2></div><button onClick={() => finish(incomingCall ? 'call:reject' : 'call:cancel', 'ended')} className="p-2 text-slate-400 hover:text-white" title="Close call"><X className="w-5 h-5" /></button></div>
        <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
          {callType === 'video' ? <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-center"><div className="w-20 h-20 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto"><Phone className="w-8 h-8 text-indigo-300" /></div><p className="mt-4 text-sm text-slate-300">{statusText[status]}</p></div>}
          {callType === 'video' && <video ref={localVideoRef} autoPlay muted playsInline className="absolute right-4 bottom-4 w-32 sm:w-44 aspect-video object-cover rounded-lg border border-white/30 bg-slate-800" />}
          {callType === 'video' && status !== 'connected' && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">{statusText[status]}</div>}
        </div>
        <div className="px-5 py-4 space-y-3"><p className="text-center text-xs text-slate-400">{error || statusText[status]}</p><div className="flex items-center justify-center gap-3">
          {status === 'incoming' ? <><button onClick={acceptIncoming} className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400" title="Accept call"><Phone className="w-5 h-5" /></button><button onClick={() => finish('call:reject', 'rejected')} className="p-3 rounded-full bg-rose-500 hover:bg-rose-400" title="Reject call"><PhoneOff className="w-5 h-5" /></button></> : <><button onClick={toggleMute} className={`p-3 rounded-full ${muted ? 'bg-rose-500' : 'bg-slate-700'}`} title={muted ? 'Unmute microphone' : 'Mute microphone'}>{muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>{callType === 'video' && <button onClick={toggleCamera} className={`p-3 rounded-full ${!cameraEnabled ? 'bg-rose-500' : 'bg-slate-700'}`} title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}>{cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}</button>}<button onClick={() => finish('call:end', 'ended')} className="p-3 rounded-full bg-rose-500 hover:bg-rose-400" title="End call"><PhoneOff className="w-5 h-5" /></button></>}
        </div></div>
      </div>
    </div>
  );
};