import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import { toast } from 'react-hot-toast';
import { productsApi } from '../productsApi';
import {
  buildCategoryTree,
  searchCategoryTree,
  flattenCategoryTree,
  getDescendantIds,
  formatCategoryDate,
} from '../utils/categoryTreeUtils';

export default function CategoriesTab({
  categories = [],
  loading = false,
  onRefresh,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}) {
  // View mode: 'TREE' | 'EXPLORER' | 'TABLE'
  const [viewMode, setViewMode] = useState('TREE');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL'); // 'ALL' | 'ROOT' | 'SUB'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Tree expansion state: Set of category IDs
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Explorer view navigation path: array of selected category objects
  const [explorerPath, setExplorerPath] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Parent mode toggle in modal: 'ROOT' | 'SUBCATEGORY'
  const [parentMode, setParentMode] = useState('ROOT');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    status: 'ACTIVE',
  });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 1. Build hierarchy tree and lookup maps
  const { roots, categoryMap, maxDepth, totalCount, rootCount, subCount } = useMemo(
    () => buildCategoryTree(categories),
    [categories]
  );

  // 2. Compute search matches and auto-expand ancestors
  const { matchingIds, expandedIds: searchExpandedIds } = useMemo(
    () => searchCategoryTree(categoryMap, search),
    [categoryMap, search]
  );

  // Initialize expanded nodes to all root categories or search matches
  useEffect(() => {
    if (search.trim()) {
      setExpandedNodes((prev) => new Set([...prev, ...searchExpandedIds]));
    } else {
      // By default expand roots so subcategories are visible
      const initial = new Set(roots.map((r) => r.id));
      setExpandedNodes(initial);
    }
  }, [search, searchExpandedIds, roots]);

  // Keep explorer path in sync with available categories
  useEffect(() => {
    if (explorerPath.length === 0 && roots.length > 0) {
      setExplorerPath([roots[0]]);
    } else if (explorerPath.length > 0) {
      // Refresh current explorer path objects from updated categoryMap
      const refreshed = explorerPath
        .map((item) => categoryMap.get(item.id))
        .filter(Boolean);
      if (refreshed.length > 0) {
        setExplorerPath(refreshed);
      } else if (roots.length > 0) {
        setExplorerPath([roots[0]]);
      }
    }
  }, [categoryMap, roots]);

  // Toggle individual node expansion in Tree View
  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand All / Collapse All handlers
  const handleExpandAll = () => {
    const allIds = new Set();
    categoryMap.forEach((node) => {
      if (node.children && node.children.length > 0) {
        allIds.add(node.id);
      }
    });
    setExpandedNodes(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Open Modal for Create or Edit
  const handleOpenModal = (cat = null, defaultParentId = '') => {
    if (cat) {
      setEditingCategory(cat);
      const isSub = Boolean(cat.parentId);
      setParentMode(isSub ? 'SUBCATEGORY' : 'ROOT');
      setFormData({
        name: cat.name || '',
        description: cat.description || '',
        parentId: cat.parentId || '',
        status: cat.status || 'ACTIVE',
      });
    } else {
      setEditingCategory(null);
      const isSub = Boolean(defaultParentId);
      setParentMode(isSub ? 'SUBCATEGORY' : 'ROOT');
      setFormData({
        name: '',
        description: '',
        parentId: defaultParentId || '',
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  // Submit Category (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const resolvedParentId =
        parentMode === 'ROOT' ? null : formData.parentId || null;

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        parentId: resolvedParentId,
        status: formData.status,
      };

      if (editingCategory) {
        await productsApi.updateCategory(editingCategory.id, payload);
        toast.success('Category updated successfully');
      } else {
        await productsApi.createCategory(payload);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.deleteCategory(deleteTarget.id);
      toast.success('Category deleted successfully');
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  // Compute disabled categories when editing to prevent circular hierarchy
  const excludedCategoryIds = useMemo(() => {
    if (!editingCategory) return new Set();
    return getDescendantIds(editingCategory.id, categoryMap);
  }, [editingCategory, categoryMap]);

  // Options for parent category dropdown
  const parentCategoryOptions = useMemo(() => {
    const list = [];
    categoryMap.forEach((cat) => {
      if (!excludedCategoryIds.has(cat.id)) {
        list.push({
          id: cat.id,
          name: cat.name,
          pathString: cat.pathString,
          depth: cat.depth,
          isLeaf: cat.isLeaf,
          directProductCount: cat.directProductCount,
        });
      }
    });
    // Sort alphabetically by path string
    list.sort((a, b) => a.pathString.localeCompare(b.pathString));
    return list;
  }, [categoryMap, excludedCategoryIds]);

  // Filtered categories for table view
  const flattenedTableData = useMemo(() => {
    let list = flattenCategoryTree(roots, expandedNodes, false);

    if (search.trim()) {
      list = list.filter((item) => matchingIds.has(item.id));
    }

    if (levelFilter === 'ROOT') {
      list = list.filter((item) => item.depth === 0);
    } else if (levelFilter === 'SUB') {
      list = list.filter((item) => item.depth > 0);
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.status === statusFilter);
    }

    return list;
  }, [roots, expandedNodes, search, matchingIds, levelFilter, statusFilter]);

  // Selected parent node object for live preview in modal
  const selectedParentNode = useMemo(() => {
    if (parentMode === 'ROOT' || !formData.parentId) return null;
    return categoryMap.get(formData.parentId) || null;
  }, [parentMode, formData.parentId, categoryMap]);

  return (
    <div className="space-y-4">
      {/* ── Top Controls & Filter Card ── */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search and Level Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cascading categories & paths..."
                className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Hierarchy Level Filter */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Filter:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Hierarchy Levels</option>
                <option value="ROOT">Root Categories Only (Level 0)</option>
                <option value="SUB">Subcategories Only (Level 1+)</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Right Side: View Switcher & Add Category */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border">
              <button
                type="button"
                onClick={() => setViewMode('TREE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'TREE'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Cascading Tree View"
              >
                <span>🌳</span>
                <span>Tree View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('EXPLORER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'EXPLORER'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Miller Columns Column Explorer"
              >
                <span>🗂️</span>
                <span>Explorer</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'TABLE'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Hierarchical Data Table"
              >
                <span>📋</span>
                <span>Table</span>
              </button>
            </div>

            {/* Expand / Collapse All (For Tree and Table) */}
            {viewMode !== 'EXPLORER' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition"
                  title="Expand all hierarchy branches"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition"
                  title="Collapse all branches"
                >
                  Collapse
                </button>
              </div>
            )}

            {/* Add Category Button */}
            {canCreate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenModal()}
                icon={
                  <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Add Category
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Main View Content ── */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center text-muted-foreground shadow-sm">
          <div className="inline-block animate-spin text-2xl mb-3">🔄</div>
          <p className="text-sm font-medium text-foreground">Loading category hierarchy...</p>
          <p className="text-xs text-muted-foreground mt-1">Connecting cascading category trees</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center text-muted-foreground shadow-sm">
          <span className="text-4xl mb-3 block">📁</span>
          <h4 className="text-base font-normal text-foreground">No Categories Registered Yet</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Create your first root category to start organizing products into structured cascading hierarchies.
          </p>
          {canCreate && (
            <div className="mt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenModal()}
              >
                + Create Root Category
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* VIEW 1: CASCADING TREE VIEW */}
          {viewMode === 'TREE' && (
            <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border/60 overflow-hidden">
              <div className="p-3.5 bg-muted/30 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground flex items-center gap-2">
                  <span>🌳</span>
                  <span>Category Hierarchy Tree</span>
                  <span className="text-muted-foreground font-normal">
                    ({roots.length} root branches, max depth: {maxDepth + 1} levels)
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Click any category branch to expand/collapse subcategories
                </span>
              </div>

              <div className="p-4 space-y-3">
                {roots
                  .filter((root) => {
                    if (search.trim() && !matchingIds.has(root.id) && !searchExpandedIds.has(root.id)) {
                      return false;
                    }
                    if (levelFilter === 'SUB') return false;
                    if (statusFilter !== 'ALL' && root.status !== statusFilter) return false;
                    return true;
                  })
                  .map((rootNode) => (
                    <CategoryTreeNode
                      key={rootNode.id}
                      node={rootNode}
                      expandedNodes={expandedNodes}
                      onToggle={toggleNode}
                      onAddSubcategory={(parentId) => handleOpenModal(null, parentId)}
                      onEdit={(cat) => handleOpenModal(cat)}
                      onDelete={(cat) => setDeleteTarget(cat)}
                      canCreate={canCreate}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      search={search}
                      matchingIds={matchingIds}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* VIEW 2: COLUMN DRILL-DOWN EXPLORER (MILLER COLUMNS) */}
          {viewMode === 'EXPLORER' && (
            <CategoryColumnExplorer
              roots={roots}
              categoryMap={categoryMap}
              explorerPath={explorerPath}
              setExplorerPath={setExplorerPath}
              onAddSubcategory={(parentId) => handleOpenModal(null, parentId)}
              onEdit={(cat) => handleOpenModal(cat)}
              onDelete={(cat) => setDeleteTarget(cat)}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          )}

          {/* VIEW 3: INDENTED HIERARCHICAL TABLE */}
          {viewMode === 'TABLE' && (
            <Card className="overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Hierarchy</TableHead>
                    <TableHead>Lineage Breadcrumb Path</TableHead>
                    <TableHead>Direct Subcategories</TableHead>
                    <TableHead>Direct Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flattenedTableData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No categories matched current filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    flattenedTableData.map((cat) => {
                      const isMatch = search.trim() && matchingIds.has(cat.id);
                      return (
                        <TableRow
                          key={cat.id}
                          className={isMatch ? 'bg-amber-500/10 dark:bg-amber-500/15' : ''}
                        >
                          {/* Indented Name with Connector Guides */}
                          <TableCell>
                            <div className="flex items-center gap-1 font-mono text-xs">
                              {cat.depth > 0 && (
                                <span className="text-muted-foreground/60 whitespace-pre select-none">
                                  {cat.treePrefix}
                                </span>
                              )}
                              <span className="text-sm mr-1.5">
                                {cat.depth === 0 ? '📁' : cat.isLeaf ? '📄' : '📂'}
                              </span>
                              <span
                                className={`font-sans text-sm ${
                                  cat.depth === 0
                                    ? 'font-medium text-foreground'
                                    : 'text-foreground/90'
                                }`}
                              >
                                {cat.name}
                              </span>
                              {cat.depth === 0 ? (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 font-sans">
                                  Root
                                </span>
                              ) : (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border font-sans">
                                  Lvl {cat.depth}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Lineage Path */}
                          <TableCell>
                            <span className="text-xs text-muted-foreground/90 font-mono">
                              {cat.pathString}
                            </span>
                          </TableCell>

                          {/* Subcategories Count */}
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-normal bg-sky-500/10 text-sky-500 border border-sky-500/20">
                              {cat.children.length} subcategories
                            </span>
                          </TableCell>

                          {/* Direct Products */}
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-normal bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {cat.directProductCount} products
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal ${
                                cat.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}
                            >
                              {cat.status || 'ACTIVE'}
                            </span>
                          </TableCell>

                          {/* Created Date */}
                          <TableCell>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatCategoryDate(cat.createdAt)}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canCreate && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(null, cat.id)}
                                  title={`Add subcategory under "${cat.name}"`}
                                  className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                                >
                                  <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              )}
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(cat)}
                                  title="Edit Category"
                                  className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                                >
                                  <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(cat)}
                                  title="Delete Category"
                                  className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                                >
                                  <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {/* ── REVAMPED DYNAMIC CASCADING ADD / EDIT MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Product Category' : 'Register New Category'}
        subtitle="Manage hierarchical category trees and cascading nesting"
        icon="📁"
        maxWidth="max-w-xl"
        scope="workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hierarchy Placement Selector (Root vs Subcategory) */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Category Hierarchy Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 border border-border rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setParentMode('ROOT');
                  setFormData((prev) => ({ ...prev, parentId: '' }));
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                  parentMode === 'ROOT'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>📁</span>
                <span>Top-Level Root Category</span>
              </button>

              <button
                type="button"
                onClick={() => setParentMode('SUBCATEGORY')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                  parentMode === 'SUBCATEGORY'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🌿</span>
                <span>Nested Subcategory</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {parentMode === 'ROOT'
                ? 'Creates a standalone top-level category at Level 0.'
                : 'Nests this category inside an existing parent category in the cascading tree.'}
            </p>
          </div>

          {/* Cascading Parent Category Selector (When Subcategory is chosen) */}
          {parentMode === 'SUBCATEGORY' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">
                Select Parent Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs"
              >
                <option value="">-- Choose a Parent Category --</option>
                {parentCategoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {`${'— '.repeat(opt.depth)}${opt.name} (${opt.pathString})`}
                  </option>
                ))}
              </select>

              {/* Warning if parent category has active products */}
              {selectedParentNode && selectedParentNode.directProductCount > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>
                    Note: "<strong>{selectedParentNode.name}</strong>" currently has {selectedParentNode.directProductCount} product(s) assigned. In this system, adding subcategories to a category with direct products may require re-assigning those products.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Live Placement Preview Banner */}
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs">
            <span className="text-[11px] font-medium text-blue-500 uppercase tracking-wider block mb-1">
              📍 Dynamic Hierarchy Placement Preview
            </span>
            <div className="flex items-center gap-1.5 flex-wrap text-foreground font-mono">
              {parentMode === 'ROOT' ? (
                <>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[11px]">
                    Root (Level 0)
                  </span>
                  <span className="text-muted-foreground">➔</span>
                  <span className="font-semibold text-foreground">
                    {formData.name.trim() || '[New Category Name]'}
                  </span>
                </>
              ) : selectedParentNode ? (
                <>
                  <span className="text-muted-foreground">{selectedParentNode.pathString}</span>
                  <span className="text-muted-foreground">➔</span>
                  <span className="font-semibold text-blue-500">
                    {formData.name.trim() || '[New Subcategory Name]'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px]">
                    Level {selectedParentNode.depth + 1}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground italic font-sans">
                  Select a parent category above to preview the cascading path
                </span>
              )}
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cordless Drills, Headphones, Fresh Produce"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief details regarding this category..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={submitting}
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── CONFIRM DELETE MODAL ── */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product Category"
        message={
          deleteTarget
            ? deleteTarget.children && deleteTarget.children.length > 0
              ? `Cannot delete "${deleteTarget.name}" because it contains ${deleteTarget.children.length} direct subcategories. Please re-assign or delete subcategories first.`
              : `Are you sure you want to delete category "${deleteTarget.name}"? Products linked to it will need re-assigning.`
            : ''
        }
        submitting={deleting}
      />
    </div>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Subcomponent: CategoryTreeNode (Recursive Tree Node for Cascading Tree View)
 * ─────────────────────────────────────────────────────────────────────────────
 */
function CategoryTreeNode({
  node,
  expandedNodes,
  onToggle,
  onAddSubcategory,
  onEdit,
  onDelete,
  canCreate,
  canUpdate,
  canDelete,
  search,
  matchingIds,
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isMatched = search.trim() && matchingIds.has(node.id);

  return (
    <div className="relative group">
      {/* Category Node Card */}
      <div
        className={`flex items-center justify-between p-3 rounded-xl border transition ${
          isMatched
            ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
            : node.depth === 0
            ? 'bg-card border-border hover:border-border/80 shadow-xs'
            : 'bg-muted/30 border-border/70 hover:bg-muted/50'
        }`}
      >
        {/* Left: Expand toggle, icons, title, badges */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Expand/Collapse Chevron */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(node.id)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
              title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 shrink-0 select-none text-xs">
              •
            </span>
          )}

          {/* Folder Icon */}
          <span className="text-lg shrink-0">
            {node.depth === 0 ? '📁' : hasChildren ? '📂' : '📄'}
          </span>

          {/* Title & Description */}
          <div className="truncate flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`truncate ${
                  node.depth === 0 ? 'font-semibold text-sm' : 'font-medium text-sm'
                } text-foreground`}
              >
                {node.name}
              </span>

              {/* Depth Badge */}
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                  node.depth === 0
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {node.depth === 0 ? 'Root' : `Level ${node.depth}`}
              </span>

              {/* Subcategories Counter Badge */}
              {hasChildren && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  🌿 {node.children.length} subcategories
                </span>
              )}

              {/* Direct Products Count */}
              {node.directProductCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  📦 {node.directProductCount} products
                </span>
              )}

              {/* Status Badge */}
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-normal ${
                  node.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {node.status}
              </span>
            </div>

            {node.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {node.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Quick Action Buttons (Monochrome black/white icons) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          {/* Inline + Add Subcategory Button */}
          {canCreate && (
            <button
              type="button"
              onClick={() => onAddSubcategory(node.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-normal border border-border hover:bg-muted text-black dark:text-white flex items-center gap-1 transition shadow-2xs"
              title={`Add subcategory nested under "${node.name}"`}
            >
              <svg className="w-3.5 h-3.5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Subcategory</span>
            </button>
          )}

          {/* Edit Button */}
          {canUpdate && (
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
              title="Edit Category"
            >
              <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(node)}
              className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
              title="Delete Category"
            >
              <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Recursive Children Container with Left Connecting Line */}
      {hasChildren && isExpanded && (
        <div className="pl-6 ml-3 my-2 border-l-2 border-border/80 space-y-2 relative">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onAddSubcategory={onAddSubcategory}
              onEdit={onEdit}
              onDelete={onDelete}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
              search={search}
              matchingIds={matchingIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Subcomponent: CategoryColumnExplorer (Miller Columns Drilldown Explorer)
 * ─────────────────────────────────────────────────────────────────────────────
 */
function CategoryColumnExplorer({
  roots,
  categoryMap,
  explorerPath,
  setExplorerPath,
  onAddSubcategory,
  onEdit,
  onDelete,
  canCreate,
  canUpdate,
  canDelete,
}) {
  // Currently inspected category is the last item in explorer path
  const activeCategory =
    explorerPath.length > 0 ? explorerPath[explorerPath.length - 1] : null;

  // Compute levels to display in columns:
  // Column 0: Roots
  // Column 1: Children of explorerPath[0] (if selected)
  // Column 2: Children of explorerPath[1] (if selected)
  const columns = useMemo(() => {
    const cols = [];

    // Column 0: Root Categories
    cols.push({
      depth: 0,
      title: 'Root Categories',
      parent: null,
      items: roots,
      selectedId: explorerPath[0]?.id || '',
    });

    // Subsequent columns based on selections
    for (let i = 0; i < explorerPath.length; i++) {
      const parentCat = explorerPath[i];
      if (parentCat && parentCat.children && parentCat.children.length > 0) {
        cols.push({
          depth: i + 1,
          title: `Subcategories of "${parentCat.name}"`,
          parent: parentCat,
          items: parentCat.children,
          selectedId: explorerPath[i + 1]?.id || '',
        });
      }
    }

    return cols;
  }, [roots, explorerPath]);

  const handleSelectInColumn = (depth, category) => {
    const next = [...explorerPath.slice(0, depth), category];
    setExplorerPath(next);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb Path Ribbon */}
      <div className="p-3 bg-card border border-border rounded-xl flex items-center justify-between gap-3 text-xs overflow-x-auto shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-muted-foreground">Path:</span>
          <button
            type="button"
            onClick={() => setExplorerPath(roots.length > 0 ? [roots[0]] : [])}
            className="hover:text-foreground text-blue-500 font-medium transition"
          >
            Catalog Roots
          </button>
          {explorerPath.map((step, idx) => {
            const isLast = idx === explorerPath.length - 1;
            return (
              <React.Fragment key={step.id}>
                <span className="text-muted-foreground/60">›</span>
                <button
                  type="button"
                  onClick={() => setExplorerPath(explorerPath.slice(0, idx + 1))}
                  className={`transition ${
                    isLast ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {step.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {activeCategory && canCreate && (
          <button
            type="button"
            onClick={() => onAddSubcategory(activeCategory.id)}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-normal transition shrink-0 shadow-sm"
          >
            + Add Subcategory Under "{activeCategory.name}"
          </button>
        )}
      </div>

      {/* Columns Container & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
        {/* Miller Columns List */}
        <div className="lg:col-span-2 xl:col-span-3 flex flex-col md:flex-row gap-3 overflow-x-auto pb-2">
          {columns.map((col) => (
            <div
              key={col.depth}
              className="w-full md:min-w-[280px] md:max-w-[340px] bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col"
              style={{ minHeight: '380px', maxHeight: '520px' }}
            >
              {/* Column Header */}
              <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
                <span className="font-medium text-foreground truncate pr-2">
                  {col.title}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[11px] shrink-0">
                  {col.items.length}
                </span>
              </div>

              {/* Column Items */}
              <div className="p-2 overflow-y-auto flex-1 space-y-1 divide-y divide-border/20">
                {col.items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No subcategories
                  </div>
                ) : (
                  col.items.map((cat) => {
                    const isSelected = col.selectedId === cat.id;
                    const hasSubcategories = cat.children && cat.children.length > 0;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleSelectInColumn(col.depth, cat)}
                        className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-500'
                            : 'hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-base shrink-0">
                            {cat.depth === 0 ? '📁' : hasSubcategories ? '📂' : '📄'}
                          </span>
                          <div className="truncate flex-1">
                            <span className="text-xs font-medium truncate block">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {cat.directProductCount} products
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {hasSubcategories ? (
                            <span className="text-xs text-muted-foreground/80 flex items-center gap-0.5">
                              <span>{cat.children.length}</span>
                              <span>›</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60">leaf</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Pane: Active Category Inspector */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>🔍</span>
              <span>Category Details</span>
            </h4>
            {activeCategory && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  activeCategory.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {activeCategory.status}
              </span>
            )}
          </div>

          {activeCategory ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                  Category Name
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5">
                  {activeCategory.name}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                  Hierarchy Lineage
                </span>
                <span className="font-mono text-muted-foreground text-xs block mt-0.5 break-all">
                  {activeCategory.pathString}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase block">Level</span>
                  <span className="text-sm font-medium text-foreground">
                    {activeCategory.depth === 0 ? 'Root (0)' : `Depth ${activeCategory.depth}`}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase block">Subcategories</span>
                  <span className="text-sm font-medium text-foreground">
                    {activeCategory.children.length} direct
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Assigned Products</span>
                <span className="text-sm font-medium text-foreground">
                  {activeCategory.directProductCount} direct products
                </span>
              </div>

              {activeCategory.description && (
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                    Description
                  </span>
                  <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">
                    {activeCategory.description}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                  Created Date
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatCategoryDate(activeCategory.createdAt)}
                </span>
              </div>

              {/* Action Buttons in Inspector */}
              <div className="pt-3 border-t border-border flex flex-col gap-2">
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => onAddSubcategory(activeCategory.id)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-normal text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>+</span>
                    <span>Add Subcategory Here</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => onEdit(activeCategory)}
                      className="py-1.5 px-3 rounded-lg border border-border hover:bg-muted text-black dark:text-white text-xs font-normal transition flex items-center justify-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(activeCategory)}
                      className="py-1.5 px-3 rounded-lg border border-border hover:bg-muted text-black dark:text-white text-xs font-normal transition flex items-center justify-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Select a category to view full properties.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
