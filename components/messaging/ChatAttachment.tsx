import React, { useState } from 'react';
import { ChatAttachment as ChatAttachmentType } from '../../constants';

interface ChatAttachmentProps {
    attachment: ChatAttachmentType;
    isMine: boolean;
}

const AttachmentModal: React.FC<{ url: string; name: string; type: string; onClose: () => void }> = ({ url, name, type, onClose }) => {
    const isPdf = type === 'application/pdf';
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className={`relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full animate-in zoom-in-95 duration-300 ${isPdf ? 'max-w-4xl h-[85vh]' : 'max-w-[500px]'}`} onClick={e => e.stopPropagation()}>
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <a
                        href={url}
                        download={name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-black/20 hover:bg-black/40 text-white backdrop-blur-md rounded-full transition-colors shadow-lg"
                        title="Download"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </a>
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/20 hover:bg-black/40 text-white backdrop-blur-md rounded-full transition-colors shadow-lg"
                        title="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Container */}
                <div className={`flex items-center justify-center bg-gray-50 ${isPdf ? 'h-full pt-16' : 'aspect-square p-6'}`}>
                    {isPdf ? (
                        <iframe
                            src={`${url}#view=FitH`}
                            className="w-full h-full border-none"
                            title={name}
                        />
                    ) : (
                        <img
                            src={url}
                            alt={name}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    )}
                </div>

                {/* Footer Info (Hidden for PDF to save space) */}
                {!isPdf && (
                    <div className="p-4 bg-white border-t">
                        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatAttachment: React.FC<ChatAttachmentProps> = ({ attachment, isMine }) => {
    const [isShowingModal, setIsShowingModal] = useState(false);
    const isImage = attachment.type.startsWith('image/');
    const isPdf = attachment.type === 'application/pdf';

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const renderModal = () => (
        isShowingModal && (
            <AttachmentModal
                url={attachment.url}
                name={attachment.name}
                type={attachment.type}
                onClose={() => setIsShowingModal(false)}
            />
        )
    );

    if (isImage) {
        return (
            <>
                <div className="mt-2 relative group cursor-zoom-in" onClick={() => setIsShowingModal(true)}>
                    <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-w-full rounded-lg border border-gray-200 shadow-sm transition-all group-hover:shadow-md group-hover:brightness-95 max-h-[250px] object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-lg">
                        <div className="bg-white/90 p-2 rounded-full shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                        </div>
                    </div>
                </div>
                {renderModal()}
            </>
        );
    }

    return (
        <>
            <div
                onClick={() => setIsShowingModal(true)}
                className={`mt-2 flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${isMine
                    ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                    }`}
            >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMine ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                    {isPdf ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{attachment.name}</p>
                    <p className={`text-[10px] opacity-70`}>{formatSize(attachment.size)}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
            </div>
            {renderModal()}
        </>
    );
};

export default ChatAttachment;
