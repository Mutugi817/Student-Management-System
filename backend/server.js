const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student_tracker')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Connection Error:', err));

// --- MODELS ---
const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const StudentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  name: { type: String, required: true },
  rollNumber: { type: String, required: true },
  gender: { type: String },
  parentContact: { type: String }
}, { timestamps: true });

const AssessmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  maxScore: { type: Number, required: true, default: 100 }
}, { timestamps: true });

const MarkSchema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  score: { type: Number, required: true },
  remarks: { type: String }
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', TeacherSchema);
const Student = mongoose.model('Student', StudentSchema);
const Assessment = mongoose.model('Assessment', AssessmentSchema);
const Mark = mongoose.model('Mark', MarkSchema);

// --- AUTH MIDDLEWARE ---
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.teacherId = decoded.id;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// --- ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
    const teacher = new Teacher({ name, email, password: hashedPassword });
    await teacher.save();
    const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET || 'secret_key');
    res.status(201).send({ teacher: { id: teacher._id, name, email }, token });
  } catch (err) { res.status(400).send({ error: 'Registration failed' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email });
    if (!teacher || !await bcrypt.compare(password, teacher.password)) return res.status(401).send({ error: 'Invalid login' });
    const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET || 'secret_key');
    res.send({ teacher: { id: teacher._id, name: teacher.name, email: teacher.email }, token });
  } catch (err) { res.status(500).send(err); }
});

app.get('/api/students', auth, async (req, res) => {
  const students = await Student.find({ teacher: req.teacherId }).sort({ rollNumber: 1 });
  res.send(students);
});

app.post('/api/students', auth, async (req, res) => {
  const student = new Student({ ...req.body, teacher: req.teacherId });
  await student.save();
  res.status(201).send(student);
});

app.put('/api/students/:id', auth, async (req, res) => {
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, teacher: req.teacherId },
    req.body,
    { returnDocument: 'after' } // Fixed deprecation warning
  );
  res.send(student);
});

app.delete('/api/students/:id', auth, async (req, res) => {
  await Student.findOneAndDelete({ _id: req.params.id, teacher: req.teacherId });
  await Mark.deleteMany({ student: req.params.id });
  res.send({ message: 'Deleted' });
});

app.get('/api/assessments', auth, async (req, res) => {
  const assessments = await Assessment.find({ teacher: req.teacherId }).sort({ date: -1 });
  res.send(assessments);
});

app.post('/api/assessments', auth, async (req, res) => {
  const assessment = new Assessment({ ...req.body, teacher: req.teacherId });
  await assessment.save();
  res.status(201).send(assessment);
});

app.get('/api/marks/:assessmentId', auth, async (req, res) => {
  const marks = await Mark.find({ assessment: req.params.assessmentId });
  res.send(marks);
});

app.post('/api/marks/:assessmentId', auth, async (req, res) => {
  const { marks } = req.body;
  const operations = marks.map(m => ({
    updateOne: {
      filter: { assessment: req.params.assessmentId, student: m.studentId },
      update: { score: m.score, remarks: m.remarks },
      upsert: true
    }
  }));
  await Mark.bulkWrite(operations);
  res.send({ message: 'Saved' });
});

app.get('/api/reports/student/:id', auth, async (req, res) => {
    const marks = await Mark.find({ student: req.params.id }).populate('assessment');
    res.send(marks);
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));