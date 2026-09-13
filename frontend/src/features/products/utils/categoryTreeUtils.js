/**
 * Category Tree Utility Functions
 * Builds hierarchy trees, calculates lineage paths, computes recursive metrics,
 * and powers search and traversal for cascading categories.
 */

/**
 * Builds a structured category tree from a flat array of categories.
 * @param {Array} categories - Array of category objects from the backend
 * @returns {Object} { roots, categoryMap, maxDepth, totalCount, rootCount, subCount }
 */
export function buildCategoryTree(categories = []) {
  const categoryMap = new Map();
  const childrenMap = new Map();

  // 1. Initialize map with shallow copies
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      depth: 0,
      path: [],
      pathString: cat.name,
      descendantCount: 0,
      recursiveProductCount: Number(cat._count?.products || 0),
      directProductCount: Number(cat._count?.products || 0),
      isRoot: !cat.parentId,
      isLeaf: true,
    });
    childrenMap.set(cat.id, []);
  });

  // 2. Build parent-child links
  categories.forEach((cat) => {
    if (cat.parentId && childrenMap.has(cat.parentId)) {
      childrenMap.get(cat.parentId).push(cat.id);
    }
  });

  // 3. Compute lineage paths, depth, and recursive metrics
  let maxDepth = 0;

  function traverse(nodeId, currentDepth = 0, currentPath = []) {
    const node = categoryMap.get(nodeId);
    if (!node) return { descendantCount: 0, recursiveProductCount: 0 };

    node.depth = currentDepth;
    if (currentDepth > maxDepth) {
      maxDepth = currentDepth;
    }

    const nextPath = [...currentPath, { id: node.id, name: node.name, depth: currentDepth }];
    node.path = nextPath;
    node.pathString = nextPath.map((p) => p.name).join(' › ');

    const childIds = childrenMap.get(nodeId) || [];
    node.isLeaf = childIds.length === 0;

    let totalDescendants = 0;
    let totalProducts = node.directProductCount;

    const childNodes = [];
    childIds.forEach((childId) => {
      const childMetrics = traverse(childId, currentDepth + 1, nextPath);
      const childNode = categoryMap.get(childId);
      if (childNode) {
        childNodes.push(childNode);
        totalDescendants += 1 + childMetrics.descendantCount;
        totalProducts += childMetrics.recursiveProductCount;
      }
    });

    node.children = childNodes;
    node.descendantCount = totalDescendants;
    node.recursiveProductCount = totalProducts;

    return {
      descendantCount: totalDescendants,
      recursiveProductCount: totalProducts,
    };
  }

  // 4. Find root categories and traverse
  const rootIds = categories.filter((c) => !c.parentId).map((c) => c.id);
  rootIds.forEach((rId) => traverse(rId, 0, []));

  // Handle any orphaned categories (parent doesn't exist or is archived) by treating them as roots
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id);
    if (cat.parentId && !categoryMap.has(cat.parentId) && node && node.path.length === 0) {
      traverse(cat.id, 0, []);
      rootIds.push(cat.id);
    }
  });

  const roots = rootIds
    .map((rId) => categoryMap.get(rId))
    .filter(Boolean);

  const rootCount = roots.length;
  const subCount = categories.length - rootCount;

  return {
    roots,
    categoryMap,
    maxDepth,
    totalCount: categories.length,
    rootCount,
    subCount,
  };
}

/**
 * Searches the category tree and returns matching IDs and ancestors to expand.
 * @param {Map} categoryMap 
 * @param {string} query 
 * @returns {Object} { matchingIds: Set, expandedIds: Set }
 */
export function searchCategoryTree(categoryMap, query = '') {
  const matchingIds = new Set();
  const expandedIds = new Set();

  if (!query.trim()) {
    return { matchingIds, expandedIds };
  }

  const q = query.toLowerCase().trim();

  categoryMap.forEach((node) => {
    const nameMatch = node.name?.toLowerCase().includes(q);
    const descMatch = node.description?.toLowerCase().includes(q);
    const pathMatch = node.pathString?.toLowerCase().includes(q);

    if (nameMatch || descMatch || pathMatch) {
      matchingIds.add(node.id);
      // Add all ancestors to expanded set so the matching node is visible in tree
      node.path.forEach((ancestor) => {
        if (ancestor.id !== node.id) {
          expandedIds.add(ancestor.id);
        }
      });
    }
  });

  return { matchingIds, expandedIds };
}

/**
 * Flattens the category tree in depth-first order for tabular rendering.
 * @param {Array} roots - Root category nodes
 * @param {Set} expandedIds - Set of category IDs currently expanded
 * @param {boolean} respectExpanded - Whether to only include visible children
 * @returns {Array} Flattened category nodes with indentation metadata
 */
export function flattenCategoryTree(roots = [], expandedIds = null, respectExpanded = false) {
  const result = [];

  function walk(node, isLastChild = false, parentPrefix = '') {
    const isExpanded = !respectExpanded || (expandedIds && expandedIds.has(node.id));
    
    // Line connector character
    const connector = node.depth === 0 ? '' : isLastChild ? '└── ' : '├── ';
    const currentPrefix = node.depth === 0 ? '' : `${parentPrefix}${connector}`;
    const nextPrefix = node.depth === 0 ? '' : `${parentPrefix}${isLastChild ? '    ' : '│   '}`;

    result.push({
      ...node,
      treePrefix: currentPrefix,
      isExpanded,
    });

    if (node.children && node.children.length > 0) {
      if (!respectExpanded || isExpanded) {
        node.children.forEach((child, index) => {
          const isLast = index === node.children.length - 1;
          walk(child, isLast, nextPrefix);
        });
      }
    }
  }

  roots.forEach((root) => walk(root, false, ''));
  return result;
}

/**
 * Returns a Set of all descendant category IDs for a given category (including self).
 * Used when editing to prevent picking self or descendants as a parent (circular reference).
 */
export function getDescendantIds(catId, categoryMap) {
  const result = new Set();
  if (!catId) return result;

  result.add(catId);

  function collect(id) {
    const node = categoryMap.get(id);
    if (!node || !node.children) return;
    node.children.forEach((child) => {
      result.add(child.id);
      collect(child.id);
    });
  }

  collect(catId);
  return result;
}

/**
 * Formats a date string into readable text.
 */
export function formatCategoryDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
