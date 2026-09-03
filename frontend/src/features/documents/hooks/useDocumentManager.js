import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../documentsApi';

export function useDocumentManager() {
  const queryClient = useQueryClient();

  // View Modes: 'EXPLORER' | 'CATEGORIES' | 'CREATE_CATEGORY'
  const [viewMode, setViewMode] = useState('EXPLORER');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [layoutStyle, setLayoutStyle] = useState('GRID');

  // Notifications
  const [toastMessage, setToastMessage] = useState(null);

  // New Category Form State
  const [categoryFormData, setCategoryFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries
  const { data: docTypesResponse } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => documentsApi.getDocumentTypes().catch(() => ({ data: [] })),
  });

  const { data: docsResponse, isLoading: loadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getDocuments().catch(() => ({ data: [] })),
  });

  const docTypes = docTypesResponse?.data || [];
  const rawDocs = docsResponse?.data || [];

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => documentsApi.updateDocumentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      triggerToast('Document status updated successfully!');
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      triggerToast('Document removed from vault.');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => documentsApi.createDocumentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentTypes']);
      setCategoryFormData({ code: '', name: '', description: '' });
      setViewMode('CATEGORIES');
      triggerToast('New document category created successfully!');
    },
  });

  const handleCategoryFormSubmit = (e) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      alert('Please enter category name.');
      return;
    }
    createCategoryMutation.mutate(categoryFormData);
  };

  // Filtered Documents
  const filteredDocs = rawDocs.filter((doc) => {
    const matchesSearch =
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.entityType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' ||
      doc.documentTypeId === selectedCategory ||
      doc.documentType?.code === selectedCategory ||
      doc.documentType?.id === selectedCategory;

    const matchesStatus =
      selectedStatus === 'ALL' ||
      doc.status === selectedStatus ||
      (selectedStatus === 'VERIFIED' && (doc.status === 'APPROVED' || doc.status === 'VERIFIED'));

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalDocs = rawDocs.length;
  const verifiedCount = rawDocs.filter((d) => d.status === 'APPROVED' || d.status === 'VERIFIED').length;
  const pendingCount = rawDocs.filter((d) => d.status === 'PENDING_REVIEW' || d.status === 'PENDING').length;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast('Direct file URL copied to clipboard!');
  };

  return {
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    layoutStyle,
    setLayoutStyle,
    toastMessage,
    categoryFormData,
    setCategoryFormData,
    handleCategoryFormSubmit,
    docTypes,
    rawDocs,
    filteredDocs,
    loadingDocs,
    totalDocs,
    verifiedCount,
    pendingCount,
    copyToClipboard,
    updateStatusMutation,
    deleteDocMutation,
    createCategoryMutation,
  };
}
