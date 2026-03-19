import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../../firebase';

interface RAGDocument {
    id: string;
    name: string;
    size: number;
    type: string;
    fileUrl: string;
    updatedAt: any;
}

const RAGDocumentsTab: React.FC = () => {
    const [documents, setDocuments] = useState<RAGDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/rag-docs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            } else {
                setMessage('Failed to fetch documents.');
            }
        } catch (error) {
            console.error('Error fetching RAG docs:', error);
            setMessage('Error connecting to server.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/rag-docs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                setMessage('Document uploaded successfully!');
                fetchDocuments();
            } else {
                const errorText = await response.text();
                setMessage(`Upload failed: ${errorText}`);
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            setMessage('Error connecting to server.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this document? This will remove it from AI context as well.')) return;

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/rag-docs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setMessage('Document deleted successfully.');
                setDocuments(prev => prev.filter(doc => doc.id !== id));
            } else {
                setMessage('Failed to delete document.');
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            setMessage('Error connecting to server.');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">RAG Documents</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage documents used by the AI to answer clinical and nutritional queries.</p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                        accept=".pdf,.txt"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-brand-text text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 4v16m8-8H4" />
                                </svg>
                                Add Document
                            </>
                        )}
                    </button>
                </div>
            </section>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-4">Document Name</th>
                                <th className="px-8 py-4">Size</th>
                                <th className="px-8 py-4">Uploaded</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">Loading documents...</td>
                                </tr>
                            ) : documents.length > 0 ? (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-sm text-gray-500">{formatSize(doc.size)}</td>
                                        <td className="px-8 py-4 text-xs text-gray-400">
                                            {doc.updatedAt ? (
                                                doc.updatedAt._seconds 
                                                    ? new Date(doc.updatedAt._seconds * 1000).toLocaleDateString()
                                                    : new Date(doc.updatedAt).toLocaleDateString()
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">No RAG documents found. Start by uploading one!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default RAGDocumentsTab;
