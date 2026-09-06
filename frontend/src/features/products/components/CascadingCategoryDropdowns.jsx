import React, { useState, useEffect, useMemo } from 'react';
import SearchableSelect from '../../../components/ui/SearchableSelect';

/**
 * Dynamic Cascading Category Hierarchy Component
 *
 * Progressively renders dropdown levels strictly based on parent selection:
 * Level 1: Main Category
 * Level 2: Subcategory (ONLY visible when Level 1 has child categories)
 * Level 3+: Child Category (ONLY visible when parent level has child categories)
 *
 * No static or empty dropdowns are ever displayed.
 */
export default function CascadingCategoryDropdowns({
  value = '', // Currently selected category ID
  onChange,   // (categoryId, categoryObj) => void
  categories = [],
  required = false,
  allowClear = true,
  size = 'md',
  layout = 'contents', // 'contents' | 'grid' | 'vertical'
  onAddNew,   // Optional () => void callback to trigger quick category creation modal
}) {
  // Build category lookup maps
  const { catMap, roots, childrenMap } = useMemo(() => {
    const map = new Map();
    const children = new Map();

    categories.forEach((c) => {
      map.set(c.id, c);
      if (!children.has(c.id)) {
        children.set(c.id, []);
      }
    });

    categories.forEach((c) => {
      if (c.parentId && children.has(c.parentId)) {
        children.get(c.parentId).push(c);
      }
    });

    const rootList = categories.filter((c) => !c.parentId);

    return {
      catMap: map,
      roots: rootList,
      childrenMap: children,
    };
  }, [categories]);

  // Selected path of category IDs from Root to leaf: [rootId, subId, childId, ...]
  const [selectedPath, setSelectedPath] = useState([]);

  // When external `value` changes (e.g. loading product for edit), compute full path up to root
  useEffect(() => {
    if (value && catMap.has(value)) {
      const path = [];
      let curr = catMap.get(value);
      while (curr) {
        path.unshift(curr.id);
        curr = curr.parentId ? catMap.get(curr.parentId) : null;
      }
      setSelectedPath(path);
    } else if (!value) {
      setSelectedPath([]);
    }
  }, [value, catMap]);

  // Handle selection at a specific level
  const handleLevelSelect = (levelIndex, selectedId) => {
    if (!selectedId) {
      // Cleared at this level -> truncate path to levelIndex
      const newPath = selectedPath.slice(0, levelIndex);
      setSelectedPath(newPath);
      const leafId = newPath.length > 0 ? newPath[newPath.length - 1] : '';
      const leafObj = leafId ? catMap.get(leafId) : null;
      onChange?.(leafId, leafObj);
      return;
    }

    // Selected an item at levelIndex -> replace tail of path
    const newPath = [...selectedPath.slice(0, levelIndex), selectedId];
    setSelectedPath(newPath);

    const selectedObj = catMap.get(selectedId);
    // Trigger onChange with current selected category
    onChange?.(selectedId, selectedObj);
  };

  // Build the list of active levels to render dynamically
  const levelsToRender = useMemo(() => {
    const levels = [];

    // Level 0: Always Main Categories (roots)
    if (roots.length > 0) {
      levels.push({
        levelIndex: 0,
        label: 'Main Category',
        placeholder: 'None',
        searchPlaceholder: 'Search categories...',
        selectedId: selectedPath[0] || '',
        options: [
          { value: '', label: 'None' },
          ...roots.map((c) => ({
            value: c.id,
            label: c.name,
          })),
        ],
      });
    }

    // Subsequent levels: only add if previous level has a selection that has children!
    for (let i = 0; i < selectedPath.length; i++) {
      const currentSelectedId = selectedPath[i];
      if (!currentSelectedId) continue;
      const children = childrenMap.get(currentSelectedId) || [];

      if (children.length > 0) {
        const nextLevelIndex = i + 1;
        const levelLabel =
          nextLevelIndex === 1
            ? 'Subcategory'
            : nextLevelIndex === 2
            ? 'Child Subcategory'
            : `Level ${nextLevelIndex + 1} Category`;

        levels.push({
          levelIndex: nextLevelIndex,
          label: levelLabel,
          placeholder: 'None',
          searchPlaceholder: `Search ${levelLabel.toLowerCase()}...`,
          selectedId: selectedPath[nextLevelIndex] || '',
          options: [
            { value: '', label: 'None' },
            ...children.map((c) => ({
              value: c.id,
              label: c.name,
            })),
          ],
        });
      }
    }

    return levels;
  }, [roots, childrenMap, selectedPath]);

  // Deepest selected category to check if it can have new subcategories added
  const deepestSelectedId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1] : null;
  const deepestSelectedCat = deepestSelectedId ? catMap.get(deepestSelectedId) : null;
  const deepestHasChildren = deepestSelectedId ? (childrenMap.get(deepestSelectedId) || []).length > 0 : false;

  return (
    <div
      className={
        layout === 'contents'
          ? 'contents'
          : layout === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full'
          : 'space-y-4 w-full'
      }
    >
      {levelsToRender.map((lvl) => {
        const parentIdForThisLevel = lvl.levelIndex === 0 ? '' : selectedPath[lvl.levelIndex - 1];
        const parentName = parentIdForThisLevel ? catMap.get(parentIdForThisLevel)?.name : '';

        return (
          <div
            key={lvl.levelIndex}
            className="w-full space-y-1"
          >
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-foreground">
                {lvl.label} {lvl.levelIndex === 0 && required && <span className="text-rose-400">*</span>}
              </label>
              {onAddNew && (
                <button
                  type="button"
                  onClick={() => onAddNew(parentIdForThisLevel)}
                  className="text-[11px] text-blue-500 hover:text-blue-400 font-semibold transition"
                  title={
                    parentIdForThisLevel
                      ? `Add new ${lvl.label.toLowerCase()} under "${parentName}"`
                      : 'Add new top-level category'
                  }
                >
                  + New {lvl.label}
                </button>
              )}
            </div>
            <SearchableSelect
              value={lvl.selectedId}
              onChange={(id) => handleLevelSelect(lvl.levelIndex, id)}
              options={lvl.options}
              placeholder={lvl.placeholder}
              searchPlaceholder={lvl.searchPlaceholder}
              allowClear={allowClear}
              size={size}
              required={lvl.levelIndex === 0 && required}
              emptyMessage="No categories found"
            />
          </div>
        );
      })}

      {/* If a category is selected and has no subcategories yet, offer to create one under it dynamically */}
      {onAddNew && deepestSelectedCat && !deepestHasChildren && (
        <div className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-500/5 border border-dashed border-blue-500/25 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 truncate mr-2">
            <span>📁</span>
            <span className="truncate">
              Want to add a subcategory under <strong className="text-foreground">{deepestSelectedCat.name}</strong>?
            </span>
          </span>
          <button
            type="button"
            onClick={() => onAddNew(deepestSelectedCat.id)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shrink-0 shadow-sm"
          >
            + Add Subcategory
          </button>
        </div>
      )}
    </div>
  );
}
