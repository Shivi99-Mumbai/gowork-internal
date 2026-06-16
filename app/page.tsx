'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Briefcase, 
  LayoutDashboard, 
  FileText, 
  LogOut, 
  User, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  X, 
  UploadCloud, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Users 
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface EmployeeStaff {
  id: string;
  employee_name: string;
  official_email: string;
  designation: string;
}

interface HiringRequirement {
  id: string;
  position: string;
  company: string;
  ctc: string;
  location: string;
  assigned_1: string | null;
  assigned_2: string | null;
  assignment_status: 'Assigned' | 'Not Assigned';
  position_status: 'Open' | 'Closed';
  jd_url: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  last_edited_by: string | null;
}

export default function InternalGoworkPage() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [user, setUser] = useState<EmployeeStaff | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Data State
  const [requirements, setRequirements] = useState<HiringRequirement[]>([]);
  const [employees, setEmployees] = useState<EmployeeStaff[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Filters, Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Action State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<HiringRequirement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal Form State
  const [formPosition, setFormPosition] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCtc, setFormCtc] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formAssigned1, setFormAssigned1] = useState('');
  const [formAssigned2, setFormAssigned2] = useState('');
  const [formAssignmentStatus, setFormAssignmentStatus] = useState<'Assigned' | 'Not Assigned'>('Not Assigned');
  const [formPositionStatus, setFormPositionStatus] = useState<'Open' | 'Closed'>('Open');
  const [formJdUrl, setFormJdUrl] = useState<string | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // AUTHENTICATION EFFECTS & ACTIONS
  // ==========================================
  useEffect(() => {
    const session = localStorage.getItem('gowork_session');
    if (session) {
      const parsedUser = JSON.parse(session);
      setUser(parsedUser);
      fetchDashboardData();
    }
    setIsAuthLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }
    setLoginLoading(true);
    try {
      const { data, error } = await supabase
        .from("employee_staff")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);

      return;
    } catch (err) {
      toast.error('An error occurred during authentication.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gowork_session');
    setUser(null);
    setRequirements([]);
    setEmployees([]);
    toast.success('Logged Out');
  };

  // ==========================================
  // DATA FETCHING & CRUD OPERATIONS
  // ==========================================
  const fetchDashboardData = async () => {
    setDataLoading(true);
    try {
      const [reqResponse, empResponse] = await Promise.all([
        supabase.from('hiring_requirement').select('*').order('created_at', { ascending: false }),
        supabase.from('employee_staff').select('id, employee_name, official_email, designation')
      ]);

      if (reqResponse.error) throw reqResponse.error;
      if (empResponse.error) throw empResponse.error;

      setRequirements(reqResponse.data || []);
      setEmployees(empResponse.data || []);
    } catch (err) {
      toast.error('Failed to sync records from remote server infrastructure.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('jds')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('jds').getPublicUrl(fileName);
      setFormJdUrl(data.publicUrl);
      toast.success('JD Document uploaded successfully.');
    } catch (err) {
      toast.error('Error streaming payload to object storage node.');
    } finally {
      setIsFileUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingRequirement(null);
    setFormPosition('');
    setFormCompany('');
    setFormCtc('');
    setFormLocation('');
    setFormAssigned1('');
    setFormAssigned2('');
    setFormAssignmentStatus('Not Assigned');
    setFormPositionStatus('Open');
    setFormJdUrl(null);
    setIsModalOpen(true);
  };

  const openEditModal = (req: HiringRequirement) => {
    setEditingRequirement(req);
    setFormPosition(req.position);
    setFormCompany(req.company);
    setFormCtc(req.ctc);
    setFormLocation(req.location);
    setFormAssigned1(req.assigned_1 || '');
    setFormAssigned2(req.assigned_2 || '');
    setFormAssignmentStatus(req.assignment_status);
    setFormPositionStatus(req.position_status);
    setFormJdUrl(req.jd_url);
    setIsModalOpen(true);
  };

  const handleSaveRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPosition || !formCompany || !formCtc || !formLocation) {
      toast.error('Please fulfill all mandatory properties.');
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      position: formPosition,
      company: formCompany,
      ctc: formCtc,
      location: formLocation,
      assigned_1: formAssigned1 || null,
      assigned_2: formAssigned2 || null,
      assignment_status: formAssignmentStatus,
      position_status: formPositionStatus,
      jd_url: formJdUrl,
      updated_at: now,
      last_edited_by: user?.official_email || 'System',
    };

    try {
      if (editingRequirement) {
        const closedAtField = formPositionStatus === 'Closed' 
          ? { closed_at: editingRequirement.closed_at || now } 
          : { closed_at: null };

        const { data, error } = await supabase
          .from('hiring_requirement')
          .update({ ...payload, ...closedAtField })
          .eq('id', editingRequirement.id)
          .select()
          .single();

        if (error) throw error;
        setRequirements(requirements.map((r) => (r.id === data.id ? data : r)));
        toast.success('Requirement Updated');
      } else {
        const closedAtField = formPositionStatus === 'Closed' ? { closed_at: now } : { closed_at: null };
        const { data, error } = await supabase
          .from('hiring_requirement')
          .insert([{ ...payload, created_at: now, ...closedAtField }])
          .select()
          .single();

        if (error) throw error;
        setRequirements([data, ...requirements]);
        toast.success('Requirement Added');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Persistent record verification drop during schema parsing.');
    }
  };

  const handleDeleteRequirement = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('hiring_requirement')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      setRequirements(requirements.filter((r) => r.id !== deleteId));
      toast.success('Requirement Deleted');
    } catch (err) {
      toast.error('Deletion failure detected at relational target lookup.');
    } finally {
      setDeleteId(null);
    }
  };

  // ==========================================
  // CLIENT SIDE DATA PROCESSING
  // ==========================================
  const filteredRequirements = requirements
    .filter((req) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        req.position.toLowerCase().includes(query) ||
        req.company.toLowerCase().includes(query) ||
        req.location.toLowerCase().includes(query);

      const matchesAssignment =
        assignmentFilter === 'All' || req.assignment_status === assignmentFilter;

      const matchesPosition =
        positionFilter === 'All' || req.position_status === positionFilter;

      return matchesSearch && matchesAssignment && matchesPosition;
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'Oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'Company') return a.company.localeCompare(b.company);
      if (sortBy === 'Position') return a.position.localeCompare(b.position);
      return 0;
    });

  const totalPages = Math.ceil(filteredRequirements.length / itemsPerPage);
  const paginatedRequirements = filteredRequirements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPositions = requirements.length;
  const openPositions = requirements.filter((r) => r.position_status === 'Open').length;
  const closedPositions = requirements.filter((r) => r.position_status === 'Closed').length;
  const assignedPositions = requirements.filter((r) => r.assignment_status === 'Assigned').length;

  const getEmployeeName = (id: string | null) => {
    if (!id) return '-';
    return employees.find((e) => e.id === id)?.employee_name || '-';
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // ==========================================
  // RENDER INTERFACE CONTAINER
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-500/10 font-sans">
      <Toaster position="top-right" richColors closeButton />

      {!user ? (
        // ==========================================
        // LOGIN SCREEN VIEW
        // ==========================================
        <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
                <Briefcase className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">GoWork Placement</h2>
              <p className="mt-2 text-sm text-slate-500">Internal Hiring Portal Access</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4 rounded-md shadow-sm">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">
                    Official Email Address
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                    placeholder="name@goworkplacement.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 pl-3 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-colors"
                >
                  {loginLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // ==========================================
        // MAIN APPLICATION INTERFACE
        // ==========================================
        <div className="flex min-h-screen">
          {/* STICKY LEFT SIDEBAR */}
          <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white">
            <div className="flex h-16 items-center border-b border-slate-100 px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-200">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900">GoWork</span>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-6">
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-blue-50 text-blue-700 transition-all">
                <LayoutDashboard className="h-4 w-4 text-blue-600" />
                Dashboard
              </button>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <FileText className="h-4 w-4 text-slate-400" />
                Current Hirings
              </button>
            </nav>

            <div className="border-t border-slate-100 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
                Logout
              </button>
            </div>
          </aside>

          {/* RIGHT SCREEN BODY CONTAINER */}
          <div className="flex flex-1 flex-col pl-64">
            {/* TOP NAVBAR */}
            <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">Hi, {user.employee_name}</span>
                  <span className="text-xs text-slate-400 font-medium">{user.designation}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
                Logout
              </button>
            </header>

            {/* MAIN PORTAL AREA */}
            <main className="flex-1 px-8 py-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hiring Dashboard</h1>
                  <p className="text-sm text-slate-500">Manage internal placements pipeline efficiently.</p>
                </div>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Requirement
                </button>
              </div>

              {/* SUMMARY STATS CARDS */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: 'Total Positions', value: totalPositions, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50/60' },
                  { name: 'Open Positions', value: openPositions, icon: AlertCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/60' },
                  { name: 'Closed Positions', value: closedPositions, icon: CheckCircle2, color: 'text-rose-600', bg: 'bg-rose-50/60' },
                  { name: 'Assigned Positions', value: assignedPositions, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50/60' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">{card.name}</span>
                        <div className={`rounded-lg p-2 ${card.bg} ${card.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FILTER, CONTROLS AND DATA DATASET COMPONENT */}
              <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4 bg-slate-50/50">
                  
                  {/* Search Control */}
                  <div className="relative w-full max-w-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Search Position, Company, Location..."
                      className="block w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Filter Select Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-slate-400">Assignment:</span>
                      <select
                        value={assignmentFilter}
                        onChange={(e) => { setAssignmentFilter(e.target.value); setCurrentPage(1); }}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="All">All</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Not Assigned">Not Assigned</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-slate-400">Status:</span>
                      <select
                        value={positionFilter}
                        onChange={(e) => { setPositionFilter(e.target.value); setCurrentPage(1); }}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="All">All</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-slate-400">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Newest">Newest</option>
                        <option value="Oldest">Oldest</option>
                        <option value="Company">Company</option>
                        <option value="Position">Position</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC VIEW MANAGEMENT */}
                {dataLoading ? (
                  /* Skeleton View State */
                  <div className="w-full space-y-4 p-6">
                    <div className="flex space-x-4 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    </div>
                    <hr className="border-slate-100" />
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2 py-2 animate-pulse">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="h-4 bg-slate-100 rounded col-span-1"></div>
                          <div className="h-4 bg-slate-100 rounded col-span-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : paginatedRequirements.length === 0 ? (
                  /* Empty View State */
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                      <Briefcase className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900">No Hiring Requirements Found</h3>
                    <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or search options.</p>
                  </div>
                ) : (
                  /* Airtable Like High Quality Data Table Grid */
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Position</th>
                          <th className="px-6 py-4">Company</th>
                          <th className="px-6 py-4">CTC</th>
                          <th className="px-6 py-4">Location</th>
                          <th className="px-6 py-4">Assigned 1</th>
                          <th className="px-6 py-4">Assigned 2</th>
                          <th className="px-6 py-4">Assignment Status</th>
                          <th className="px-6 py-4">Position Status</th>
                          <th className="px-6 py-4">JD</th>
                          <th className="px-6 py-4">Updated</th>
                          <th className="px-6 py-4">Last Edited By</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedRequirements.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="whitespace-nowrap px-6 py-3.5 font-medium text-slate-900">{row.position}</td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{row.company}</td>
                            <td className="whitespace-nowrap px-6 py-3.5 font-mono text-slate-600">{row.ctc}</td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{row.location}</td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{getEmployeeName(row.assigned_1)}</td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{getEmployeeName(row.assigned_2)}</td>
                            <td className="whitespace-nowrap px-6 py-3.5">
                              {row.assignment_status === 'Assigned' ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Assigned</span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Not Assigned</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-3.5">
                              {row.position_status === 'Open' ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Open</span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">Closed</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-3.5">
                              {row.jd_url ? (
                                <a href={row.jd_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                  📄 <span className="underline">View JD</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 text-xs">No JD</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-slate-500 text-xs">
                              {row.updated_at ? new Date(row.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-slate-500 text-xs max-w-[120px] truncate" title={row.last_edited_by || ''}>
                              {row.last_edited_by || '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-3.5 text-right text-xs font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(row)}
                                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(row.id)}
                                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* PAGINATION PANEL CONTROLS */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-500">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredRequirements.length)}</span> of{' '}
                            <span className="font-medium">{filteredRequirements.length}</span> results
                          </p>
                          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <button
                              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center rounded-l-md border border-slate-300 bg-white p-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: totalPages }).map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentPage(idx + 1)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  currentPage === idx + 1
                                    ? 'z-10 bg-blue-600 text-white'
                                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {idx + 1}
                              </button>
                            ))}
                            <button
                              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center rounded-r-md border border-slate-300 bg-white p-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* ==========================================
          ADD / EDIT MODAL COMPONENT WINDOW
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingRequirement ? 'Edit Requirement' : 'Add Requirement'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-md text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRequirement} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Position *</label>
                  <input
                    type="text"
                    required
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">CTC *</label>
                  <input
                    type="text"
                    required
                    value={formCtc}
                    onChange={(e) => setFormCtc(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="12-15 LPA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Remote / Bangalore"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Assigned 1</label>
                  <select
                    value={formAssigned1}
                    onChange={(e) => setFormAssigned1(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.employee_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Assigned 2</label>
                  <select
                    value={formAssigned2}
                    onChange={(e) => setFormAssigned2(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.employee_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Assignment Status</label>
                  <select
                    value={formAssignmentStatus}
                    onChange={(e) => setFormAssignmentStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Not Assigned">Not Assigned</option>
                    <option value="Assigned">Assigned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Position Status</label>
                  <select
                    value={formPositionStatus}
                    onChange={(e) => setFormPositionStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Job Description (PDF)</label>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isFileUploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    <UploadCloud className="h-4 w-4 text-slate-400" />
                    {isFileUploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="application/pdf"
                    className="hidden"
                  />
                  {formJdUrl && (
                    <span className="text-xs font-medium text-emerald-600 truncate max-w-[240px]" title={formJdUrl}>
                      ✓ Attached Document
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFileUploading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          CONFIRM DELETE DIALOG OVERLAY
          ========================================== */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <h3 className="text-base font-bold text-slate-900">Remove Hiring Requirement</h3>
              <p className="mt-2 text-sm text-slate-500">
                Are you absolutely sure you want to terminate this active requirement record? This operational directive cannot be reversed.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequirement}
                className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}