
import React from 'react';
import { ChatAttachment as ChatAttachmentType } from '../../constants';

interface ChatAttachmentProps {
    attachment: ChatAttachmentType;
    isMine: boolean;
}

const ChatAttachment: React.FC<ChatAttachmentProps> = ({ attachment, isMine }) => {
    const isImage = attachment.type.startsWith('image/');
    const isPdf = attachment.type === 'application/pdf';

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (isImage) {
        return (
            <div className="mt-2 relative group">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-w-full rounded-lg border border-gray-200 shadow-sm transition-opacity group-hover:opacity-90 max-h-[250px] object-contain"
                    />
                </a>
            </div>
        );
    }

    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMine
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
        </a>
    );
};

export default ChatAttachment;
