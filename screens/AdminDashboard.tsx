import React, { useState, useEffect } from 'react';
import { VitaLogo } from '../constants';
import { auth } from '../firebase';

interface AssignedRole {
    email: string;
    role: string;
    updated_at: any;
}

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    timestamp: any;
}

const AdminDashboard: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
    const [activeTab, setActiveTab] = useState<'roles' | 'leads'>('roles');
    const [roles, setRoles] = useState<AssignedRole[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('doctor');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const fetchRoles = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchLeads = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/leads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLeads(data);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'roles') {
            fetchRoles();
        } else {
            fetchLeads();
        }
    }, [activeTab]);

    const handleSetRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/set-role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, role })
            });

            if (response.ok) {
                setMessage('Role assigned successfully!');
                setEmail('');
                fetchRoles();
            } else {
                setMessage('Failed to assign role.');
            }
        } catch (error) {
            setMessage('Error connecting to server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <VitaLogo />
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600">Admin Portal</span>
                    <button
                        onClick={onSignOut}
                        className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8">
                {/* Tab Switcher */}
                <div className="flex gap-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'roles' ? 'text-brand-purple' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Role Management
                        {activeTab === 'roles' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-purple rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'leads' ? 'text-brand-purple' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Lead Captures
                        {activeTab === 'leads' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-purple rounded-full" />}
                    </button>
                </div>

                {activeTab === 'roles' ? (
                    <>
                        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Assign New Role</h2>
                            <form onSubmit={handleSetRole} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">User Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="doctor@example.com"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none appearance-none"
                                    >
                                        <option value="doctor">Doctor</option>
                                        <option value="careCoordinator">Care Manager</option>
                                        <option value="trainer">Trainer</option>
                                        <option value="nutritionist">Nutritionist</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-brand-text text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Processing...' : 'Assign Role'}
                                </button>
                            </form>
                            {message && (
                                <p className={`mt-4 text-sm font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                    {message}
                                </p>
                            )}
                        </section>

                        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-extrabold text-gray-900">Manage Roles</h2>
                                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-bold">{roles.length} Mappings</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="px-8 py-4">User Email</th>
                                            <th className="px-8 py-4">Role</th>
                                            <th className="px-8 py-4">Assigned On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {roles.map((r, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-4 text-sm font-medium text-gray-900">{r.email}</td>
                                                <td className="px-8 py-4">
                                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${r.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                                                        r.role === 'doctor' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-green-100 text-green-600'
                                                        }`}>
                                                        {r.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-xs text-gray-400">
                                                    {r.updated_at ? new Date(r.updated_at._seconds * 1000).toLocaleDateString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                ) : (
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-extrabold text-gray-900">Captured Leads</h2>
                            <span className="text-xs bg-blue-100 px-3 py-1 rounded-full text-blue-600 font-bold">{leads.length} Leads</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-4">Name</th>
                                        <th className="px-8 py-4">Email</th>
                                        <th className="px-8 py-4">Phone</th>
                                        <th className="px-8 py-4">Submitted On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {leads.length > 0 ? (
                                        leads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-4 text-sm font-bold text-gray-900">{lead.name}</td>
                                                <td className="px-8 py-4 text-sm text-gray-600">{lead.email}</td>
                                                <td className="px-8 py-4 text-sm text-gray-600">{lead.phone}</td>
                                                <td className="px-8 py-4 text-xs text-gray-400">
                                                    {lead.timestamp ? new Date(lead.timestamp._seconds * 1000).toLocaleString() : 'Just now'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">No leads captured yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
