import React, { useState, useEffect } from 'react';
import { VitaLogo } from '../constants';
import { auth } from '../firebase';

interface AssignedRole {
    email: string;
    role: string;
    updated_at: any;
}

const AdminDashboard: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
    const [roles, setRoles] = useState<AssignedRole[]>([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('doctor');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchRoles = async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch('http://localhost:5000/api/admin/roles', {
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

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleSetRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch('http://localhost:5000/api/admin/set-role', {
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
            </main>
        </div>
    );
};

export default AdminDashboard;
