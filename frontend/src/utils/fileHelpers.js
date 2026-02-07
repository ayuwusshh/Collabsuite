// File upload handler
const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
    }

    setSelectedFile(file);
};

const handleFileUpload = async () => {
    if (!selectedFile || !selectedConversation) return;

    setUploading(true);
    setError(null);

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        await api.post(`/conversations/${selectedConversation._id}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Clear selected file
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    } catch (err) {
        console.error('File upload error:', err);
        setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
        setUploading(false);
    }
};

const handleDownloadFile = async (messageId, filename) => {
    try {
        const response = await api.get(`/conversations/files/${messageId}`, {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Download error:', err);
        setError('Failed to download file');
    }
};

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
};
