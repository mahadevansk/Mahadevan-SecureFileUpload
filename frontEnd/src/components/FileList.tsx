import React, { useEffect, useState } from 'react';
import {
    Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions,
    DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Alert, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import { api, type FileRecord } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

interface FileListProps {
  refreshTrigger: number;
}

export const FileList: React.FC<FileListProps> = ({ refreshTrigger }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.listFiles();
      setFiles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load files';
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  const handleDelete = (fileId: string) => {
    setSelectedFileId(fileId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFileId) return;

    try {
      setDeleting(true);
      await api.deleteFile(selectedFileId);
      setFiles((prev) => prev.filter((f) => f.id !== selectedFileId));
      setDeleteConfirmOpen(false);
      setSelectedFileId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(`Delete error: ${message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await api.downloadFile(fileId, fileName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError(`Download error: ${message}`);
    }
  };

  const handlePreview = async (file: FileRecord) => {
    if (!file.contentType.startsWith('image/')) {
      setError('Preview only available for image files');
      return;
    }

    try {
      const url = await api.getFilePreviewUrl(file.id);
      setPreviewUrl(url);
      setPreviewFileName(file.originalFileName);
      setPreviewOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Preview failed';
      setError(`Preview error: ${message}`);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewOpen(false);
    setPreviewUrl('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Your Files</Typography>
            <Button size="small" onClick={loadFiles}>
              Refresh
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {files.length === 0 ? (
            <Typography color="textSecondary">No files uploaded yet</Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 600, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>File Name</strong></TableCell>
                    <TableCell align="right"><strong>Size</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Uploaded</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id} hover>
                      <TableCell>{file.originalFileName}</TableCell>
                      <TableCell align="right">
                        {(file.size / 1024).toFixed(2)} KB
                      </TableCell>
                      <TableCell>{file.contentType}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell align="center">
                        {file.contentType.startsWith('image/') && (
                          <Tooltip title="Preview">
                            <IconButton
                              size="small"
                              onClick={() => handlePreview(file)}
                            >
                              <ImageIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(file.id, file.originalFileName)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(file.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <Box sx={{ p: 2 }}>
          <Typography>Are you sure you want to delete this file?</Typography>
        </Box>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onClose={closePreview} maxWidth="sm" fullWidth>
        <DialogTitle>{previewFileName}</DialogTitle>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          {previewUrl && (
            <img
              src={previewUrl}
              alt={previewFileName}
              style={{ maxWidth: '100%', maxHeight: '500px' }}
            />
          )}
        </Box>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
