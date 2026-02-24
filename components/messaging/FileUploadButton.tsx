
import React, { useRef, useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { ChatAttachment } from '../../constants';

interface FileUploadButtonProps {
    onUploadComplete: (attachment: ChatAttachment) => void;
    onUploadStart?: () => void;
    onUploadError?: (error: string) => void;
    disabled?: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
    onUploadComplete,
    onUploadStart,
    onUploadError,
    disabled
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
            onUploadError?.('File size exceeds 10MB limit.');
            return;
        }

        setIsUploading(true);
        setProgress(0);
        onUploadStart?.();

        try {
            const storageRef = ref(storage, `chat_attachments/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(p);
                },
                (error) => {
                    console.error('Upload error:', error);
                    setIsUploading(false);
                    onUploadError?.('Upload failed. Please try again.');
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const attachment: ChatAttachment = {
                        url: downloadURL,
                        name: file.name,
                        type: file.type,
                        size: file.size
                    };
                    onUploadComplete(attachment);
                    setIsUploading(false);
                    setProgress(0);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            );
        } catch (err) {
            console.error('Upload setup error:', err);
            setIsUploading(false);
            onUploadError?.('Failed to start upload.');
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className={`p-2 rounded-full transition-colors ${isUploading ? 'bg-gray-100 text-gray-400' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                title="Attach file"
            >
                {isUploading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-purple rounded-full animate-spin" />
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                    </svg>
                )}
            </button>
            {isUploading && progress > 0 && progress < 100 && (
                <div className="absolute -top-1 left-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-purple transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default FileUploadButton;
