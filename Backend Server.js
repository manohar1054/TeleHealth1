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
