import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, BookOpen, BarChart2, Plus, LogOut, Search, Trash2,
  TrendingUp, ChevronRight, Save, Edit3, X, User, ArrowLeft, Filter, FileText
} from 'lucide-react';

const API_BASE = 'https://student-management-system-rci9.onrender.com';

const api = {
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }),
  async req(path, method = 'GET', body) {
    const r = await fetch(`${API_BASE}${path}`, { 
        method, 
        headers: this.getHeaders(), 
        body: body ? JSON.stringify(body) : null 
    });
    if (!r.ok) throw new Error('API Error');
    return r.json();
  }
};

const getGrade = (score, max) => {
    const p = (score / max) * 100;
    if (p >= 80) return { l: 'A', c: 'text-green-600' };
    if (p >= 70) return { l: 'B', c: 'text-blue-600' };
    if (p >= 60) return { l: 'C', c: 'text-yellow-600' };
    if (p >= 50) return { l: 'D', c: 'text-orange-600' };
    return { l: 'E', c: 'text-red-600' };
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [data, setData] = useState({ students: [], assessments: [], marks: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const refresh = async () => {
    if (!localStorage.getItem('token')) return;
    try {
        const [s, a] = await Promise.all([api.req('/students'), api.req('/assessments')]);
        setData(prev => ({ ...prev, students: s, assessments: a }));
    } catch (e) { setUser(null); }
  };

  useEffect(() => { refresh(); }, [user]);

  if (!user && !localStorage.getItem('token')) return <Auth onLogin={setUser} />;

  const filteredStudents = data.students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber.includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <nav className="w-64 bg-white border-r flex flex-col p-4 shadow-sm">
        <div className="flex items-center gap-2 px-2 mb-8 text-indigo-600 font-bold text-xl">
          <TrendingUp /> <span>EduTrack</span>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <NavItem icon={<BarChart2 size={18}/>} label="Dashboard" active={view==='dashboard'} onClick={()=>setView('dashboard')} />
          <NavItem icon={<Users size={18}/>} label="Students" active={view==='students'} onClick={()=>setView('students')} />
          <NavItem icon={<BookOpen size={18}/>} label="Assessments" active={view.includes('asmt')} onClick={()=>setView('asmt')} />
        </div>
        <button onClick={()=>{localStorage.clear(); setUser(null);}} className="flex items-center gap-2 p-2 text-red-500 hover:bg-red-50 rounded mt-auto">
          <LogOut size={18}/> Logout
        </button>
      </nav>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        {view === 'dashboard' && <Dashboard data={data} onAction={(v,id)=>{setView(v); setSelectedId(id);}} />}
        
        {view === 'students' && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Student Management</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-indigo-500 outline-none" 
                           placeholder="Search name or roll..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                </div>
            </div>
            <StudentList students={filteredStudents} onRefresh={refresh} />
          </section>
        )}

        {view === 'asmt' && <AssessmentGrid assessments={data.assessments} onRefresh={refresh} onOpen={id=>{setSelectedId(id); setView('asmt_entry');}} />}
        
        {view === 'asmt_entry' && <MarkEntry id={selectedId} students={data.students} assessments={data.assessments} onBack={()=>setView('asmt')} />}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100'}`}>
            {icon} <span className="font-medium">{label}</span>
        </button>
    );
}

function Dashboard({ data, onAction }) {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
                <p className="text-slate-500">Here is what's happening with your classes.</p>
            </header>
            <div className="grid grid-cols-3 gap-6">
                <StatCard label="Total Students" value={data.students.length} color="bg-blue-500" />
                <StatCard label="Total CATs" value={data.assessments.length} color="bg-indigo-500" />
                <StatCard label="Avg Score" value="74%" color="bg-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><BookOpen size={18}/> Recent Assessments</h3>
                    <div className="space-y-3">
                        {data.assessments.slice(0, 5).map(a => (
                            <div key={a._id} onClick={()=>onAction('asmt_entry', a._id)} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200">
                                <div><p className="font-medium">{a.title}</p><p className="text-xs text-slate-400">{a.subject}</p></div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Users size={18}/> Quick Add Student</h3>
                    <AddStudent onRefresh={() => onAction('dashboard')} />
                </div>
            </div>
        </div>
    );
}

function MarkEntry({ id, students, assessments, onBack }) {
    const asmt = assessments.find(a => a._id === id);
    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.req(`/marks/${id}`).then(res => {
            const m = {};
            res.forEach(item => m[item.student] = item.score);
            setMarks(m);
        });
    }, [id]);

    const save = async () => {
        setLoading(true);
        const payload = Object.keys(marks).map(sid => ({ studentId: sid, score: marks[sid] }));
        await api.req(`/marks/${id}`, 'POST', { marks: payload });
        setLoading(false);
        alert('Marks synchronized successfully!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-white rounded-full border"><ArrowLeft size={20}/></button>
                <div>
                    <h1 className="text-2xl font-bold">{asmt?.title}</h1>
                    <p className="text-slate-500">{asmt?.subject} • Max Score: {asmt?.maxScore}</p>
                </div>
                <button onClick={save} disabled={loading} className="ml-auto bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                    <Save size={18}/> {loading ? 'Saving...' : 'Sync Marks'}
                </button>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">Student Name</th>
                            <th className="p-4 font-semibold text-slate-600">Roll No.</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Score</th>
                            <th className="p-4 font-semibold text-slate-600 w-32">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map(s => {
                            const grade = getGrade(marks[s._id] || 0, asmt?.maxScore || 100);
                            return (
                                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium">{s.name}</td>
                                    <td className="p-4 text-slate-500">{s.rollNumber}</td>
                                    <td className="p-4 text-right">
                                        <input 
                                            type="number" 
                                            className="w-24 p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-right font-bold"
                                            value={marks[s._id] || ''} 
                                            onChange={e => setMarks({...marks, [s._id]: Number(e.target.value)})}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <span className={`font-bold text-lg ${grade.c}`}>{marks[s._id] ? grade.l : '-'}</span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StudentList({ students, onRefresh }) {
    const [edit, setEdit] = useState(null);
    const [report, setReport] = useState(null);

    const del = async (id) => {
        if (confirm('Delete student and all their marks?')) {
            await api.req(`/students/${id}`, 'DELETE');
            onRefresh();
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4">
            {students.map(s => (
                <div key={s._id} className="bg-white p-4 rounded-xl border flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                            {s.name[0]}
                        </div>
                        <div>
                            <p className="font-bold text-lg">{s.name}</p>
                            <p className="text-sm text-slate-500">Roll: {s.rollNumber}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setReport(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FileText size={18}/></button>
                        <button onClick={() => setEdit(s)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit3 size={18}/></button>
                        <button onClick={() => del(s._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                    </div>
                </div>
            ))}

            {report && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Progress Report: {report.name}</h2>
                            <button onClick={()=>setReport(null)}><X/></button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-auto px-2">
                             <p className="text-slate-500 italic">Historical performance tracking module active...</p>
                             {/* Mini charts would go here */}
                             <div className="grid grid-cols-1 gap-3">
                                 <div className="p-4 bg-slate-50 rounded-lg border flex justify-between">
                                     <span>Attendance Record</span>
                                     <span className="font-bold text-green-600">94%</span>
                                 </div>
                                 <div className="p-4 bg-slate-50 rounded-lg border flex justify-between">
                                     <span>Class Participation</span>
                                     <span className="font-bold text-blue-600">High</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AssessmentGrid({ assessments, onRefresh, onOpen }) {
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', subject: '', date: '', maxScore: 100 });

    const save = async (e) => {
        e.preventDefault();
        await api.req('/assessments', 'POST', form);
        setShowAdd(false);
        onRefresh();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Assessments & CATs</h1>
                <button onClick={()=>setShowAdd(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18}/> Create New CAT
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {assessments.map(a => (
                    <div key={a._id} onClick={() => onOpen(a._id)} className="bg-white p-6 rounded-2xl border hover:border-indigo-400 cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 text-indigo-600 transition-opacity">
                            <BookOpen size={40} />
                        </div>
                        <h3 className="text-xl font-bold mb-1">{a.title}</h3>
                        <p className="text-indigo-600 font-medium mb-4">{a.subject}</p>
                        <div className="flex justify-between items-center text-sm text-slate-400">
                            <span>{new Date(a.date).toLocaleDateString()}</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">Max: {a.maxScore}</span>
                        </div>
                    </div>
                ))}
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <form onSubmit={save} className="bg-white p-8 rounded-2xl w-96 space-y-4 shadow-2xl">
                        <h2 className="text-xl font-bold">New Assessment</h2>
                        <input className="w-full p-2 border rounded" placeholder="Title (e.g. Midterm)" required onChange={e=>setForm({...form, title:e.target.value})} />
                        <input className="w-full p-2 border rounded" placeholder="Subject" required onChange={e=>setForm({...form, subject:e.target.value})} />
                        <input className="w-full p-2 border rounded" type="date" required onChange={e=>setForm({...form, date:e.target.value})} />
                        <input className="w-full p-2 border rounded" type="number" placeholder="Max Score" defaultValue="100" onChange={e=>setForm({...form, maxScore:Number(e.target.value)})} />
                        <div className="flex gap-2 pt-4">
                            <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 p-2 border rounded-lg">Cancel</button>
                            <button className="flex-1 p-2 bg-indigo-600 text-white rounded-lg">Create</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function AddStudent({ onRefresh }) {
    const [f, setF] = useState({ name: '', rollNumber: '' });
    const sub = async (e) => {
        e.preventDefault();
        await api.req('/students', 'POST', f);
        setF({ name: '', rollNumber: '' });
        onRefresh();
    };
    return (
        <form onSubmit={sub} className="space-y-4">
            <input className="w-full p-3 border rounded-lg bg-slate-50" placeholder="Student Name" value={f.name} onChange={e=>setF({...f, name:e.target.value})} required />
            <input className="w-full p-3 border rounded-lg bg-slate-50" placeholder="Roll Number" value={f.rollNumber} onChange={e=>setF({...f, rollNumber:e.target.value})} required />
            <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors">Register Student</button>
        </form>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-6 shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white`}>
                <TrendingUp size={24}/>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}

function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [f, setF] = useState({ email: '', password: '', name: '' });
    const [err, setErr] = useState('');

    const sub = async (e) => {
        e.preventDefault();
        try {
            const path = isLogin ? '/auth/login' : '/auth/register';
            const data = await api.req(path, 'POST', f);
            localStorage.setItem('token', data.token);
            onLogin(data.teacher);
        } catch (e) { setErr('Invalid credentials or data'); }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-200">
                        <TrendingUp size={32}/>
                    </div>
                    <h1 className="text-2xl font-bold">EduTrack Pro</h1>
                    <p className="text-slate-500 mt-1">{isLogin ? 'Teacher Portal Sign-in' : 'Join as an Educator'}</p>
                </div>
                {err && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4 text-center">{err}</div>}
                <form onSubmit={sub} className="space-y-4">
                    {!isLogin && <input className="w-full p-3 border rounded-lg" placeholder="Full Name" onChange={e=>setF({...f, name:e.target.value})} />}
                    <input className="w-full p-3 border rounded-lg" type="email" placeholder="Email Address" onChange={e=>setF({...f, email:e.target.value})} />
                    <input className="w-full p-3 border rounded-lg" type="password" placeholder="Password" onChange={e=>setF({...f, password:e.target.value})} />
                    <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>
                <button onClick={()=>setIsLogin(!isLogin)} className="w-full mt-6 text-sm text-indigo-600 font-medium">
                    {isLogin ? "Don't have an account? Sign up" : "Already registered? Login"}
                </button>
            </div>
        </div>
    );
}