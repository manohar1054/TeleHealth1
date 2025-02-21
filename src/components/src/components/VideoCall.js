import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';

const VideoCall = ({ roomId }) => {
  const [myPeerId, setMyPeerId] = useState('');
  const [peerId, setPeerId] = useState('');
  const videoGridRef = useRef();
  const myVideoRef = useRef();
  const socket = io('http://localhost:5000');
  const peer = new Peer();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      addVideoStream(myVideoRef.current, stream);

      peer.on('call', (call) => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });

      socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream);
      });
    });

    peer.on('open', (id) => {
      setMyPeerId(id);
      socket.emit('join-room', roomId, id);
    });
  }, []);

  const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
  };

  const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGridRef.current.append(video);
  };

  return (
    <div>
      <div ref={videoGridRef} className="grid grid-cols-2 gap-4"></div>
      <video ref={myVideoRef} muted className="w-full h-auto"></video>
    </div>
  );
};

export default VideoCall;
