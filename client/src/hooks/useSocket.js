import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [privateState, setPrivateState] = useState(null);
  const [roleData, setRoleData] = useState(null);
  const [voteResult, setVoteResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room_update', (data) => {
      const { private: priv, ...publicState } = data;
      setGameState(publicState);
      if (priv) setPrivateState(priv);
    });

    socket.on('role_assigned', (data) => {
      setRoleData(data);
    });

    socket.on('vote_result', (data) => {
      setVoteResult(data);
      setTimeout(() => setVoteResult(null), 4000);
    });

    socket.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event, data) => {
    return new Promise((resolve) => {
      socketRef.current?.emit(event, data, resolve);
    });
  }, []);

  const getSocketId = useCallback(() => {
    return socketRef.current?.id;
  }, []);

  return {
    connected,
    gameState,
    privateState,
    roleData,
    voteResult,
    error,
    setError,
    emit,
    getSocketId,
  };
}
