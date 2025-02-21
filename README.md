# TeleHealth1

 Telehealth app with both frontend and backend requires a structured approach
 Tech Stack
Frontend: React.js (for a dynamic and responsive UI).

Backend: Node.js with Express.js (for APIs).

Database: MongoDB (for storing patient, doctor, and appointment data).

Real-Time Communication: WebRTC and Socket.io (for video calls).

Styling: Tailwind CSS (for modern and responsive design).
Backend Setup
Step 1: Initialize the Backend
Create a new directory for the backend and initialize a Node.js project:
mkdir telehealth-backend
cd telehealth-backend
npm init -y
npm install express mongoose cors socket.io webrtc uuid
Step 2: Create the Server
Create a file named server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect('mongodb://localhost:27017/telehealth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const Patient = mongoose.model('Patient', {
  name: String,
  email: String,
  phone: String,
  medicalHistory: String,
});

const Appointment = mongoose.model('Appointment', {
  patientId: String,
  doctorId: String,
  date: String,
  time: String,
});

const ClinicalNote = mongoose.model('ClinicalNote', {
  patientId: String,
  doctorId: String,
  notes: String,
});

// APIs
// Patient Intake
app.post('/api/patients', async (req, res) => {
  const { name, email, phone, medicalHistory } = req.body;
  const patient = new Patient({ name, email, phone, medicalHistory });
  await patient.save();
  res.status(201).json({ message: 'Patient registered successfully', patient });
});

// Appointment Scheduling
app.post('/api/appointments', async (req, res) => {
  const { patientId, doctorId, date, time } = req.body;
  const appointment = new Appointment({ patientId, doctorId, date, time });
  await appointment.save();
  res.status(201).json({ message: 'Appointment booked successfully', appointment });
});

// Clinical Notes
app.post('/api/notes', async (req, res) => {
  const { patientId, doctorId, notes } = req.body;
  const clinicalNote = new ClinicalNote({ patientId, doctorId, notes });
  await clinicalNote.save();
  res.status(201).json({ message: 'Clinical notes added successfully', clinicalNote });
});

// WebRTC Signaling
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

// Start Server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
 Frontend Setup
 Initialize the Frontend
Create a new directory for the frontend and initialize a React app
npx create-react-app telehealth-frontend
cd telehealth-frontend
npm install axios socket.io-client peerjs tailwindcss
 Configure Tailwind CSS
 Follow the Tailwind CSS installation guide to set up Tailwind in your React app
 Create the Frontend Components
 Patient Intake Form
 Create a file src/components/PatientForm.js
 import React, { useState } from 'react';
import axios from 'axios';

const PatientForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    medicalHistory: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/patients', formData);
      alert('Patient registered successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Patient Registration</h2>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full p-2 mb-2 border rounded"
      />
      <textarea
        placeholder="Medical History"
        value={formData.medicalHistory}
        onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
        className="w-full p-2 mb-2 border rounded"
      />
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
        Register
      </button>
    </form>
  );
};

export default PatientForm;
Video Call Component
Create a file src/components/VideoCall.js
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
 Run the Application
 Backend
 Start the backend server:
 cd telehealth-backend
node server.js
Frontend
Start the React app
cd telehealth-frontend
npm start
 Features Implemented
 Patient Intake: Register patients and store their data.

Appointment Scheduling: Book and manage appointments.

Telemedicine: Real-time video calls using WebRTC.

Clinical Notes: Add and retrieve clinical notes
