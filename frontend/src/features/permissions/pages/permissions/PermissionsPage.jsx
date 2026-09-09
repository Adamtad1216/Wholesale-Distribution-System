import React from 'react';
import Card from '../../../../components/ui/Card';
import { usePermissionMatrix } from '../../hooks/usePermissionMatrix';

// Sub-components
import PermissionHeader from '../../components/PermissionHeader';
import PermissionMatrixGrid from '../../components/PermissionMatrixGrid';
import PermissionDirectoryTable from '../../components/PermissionDirectoryTable';

export default function PermissionsPage() {
  const {
    roles,
    permissions,
    loading,
    search,
    setSearch,
    selectedModule,
    setSelectedModule,
    selectedRoleFilter,
    setSelectedRoleFilter,
    viewMode,
    setViewMode,
    togglingMap,
    groupedPermissions,
    modulesList,
    filteredRoles,
    filteredModules,
    isPermissionAssigned,
    isWildcardRole,
    handleTogglePermission,
  } = usePermissionMatrix();

  return (
    <div className="p-6 space-y-6 min-h-[calc(100vh-100px)]">
      {/* Top Banner, Stats Badges, and Search & Filter Bar */}
      <PermissionHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalRoles={roles.length}
        totalPermissions={permissions.length}
        totalModules={Object.keys(groupedPermissions).length}
        search={search}
        setSearch={setSearch}
        selectedModule={selectedModule}
        setSelectedModule={setSelectedModule}
        selectedRoleFilter={selectedRoleFilter}
        setSelectedRoleFilter={setSelectedRoleFilter}
        modulesList={modulesList}
        rolesList={roles}
      />

      {/* Main Content Area */}
      {loading ? (
        <Card className="p-16 text-center text-muted-foreground text-sm rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-semibold text-foreground">Loading Permission Matrix & Security Controls...</p>
          </div>
        </Card>
      ) : viewMode === 'MATRIX' ? (
        /* Matrix Grid View (Matching Reference Screenshot) */
        <PermissionMatrixGrid
          filteredModules={filteredModules}
          groupedPermissions={groupedPermissions}
          filteredRoles={filteredRoles}
          isPermissionAssigned={isPermissionAssigned}
          isWildcardRole={isWildcardRole}
          handleTogglePermission={handleTogglePermission}
          togglingMap={togglingMap}
        />
      ) : (
        /* Key Directory View */
        <PermissionDirectoryTable
          permissions={permissions}
          roles={roles}
          search={search}
          selectedModule={selectedModule}
          isPermissionAssigned={isPermissionAssigned}
          isWildcardRole={isWildcardRole}
        />
      )}
    </div>
  );
}
