import React from 'react';
import Card from '../../../components/ui/Card';

export default function DocumentStatsOverview({ totalDocs, verifiedCount, pendingCount, categoryCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total System Files</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{totalDocs}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
            📂
          </div>
        </div>
      </Card>

      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verified Files</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{verifiedCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
            ✅
          </div>
        </div>
      </Card>

      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Verification</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
            ⏳
          </div>
        </div>
      </Card>

      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Defined Categories</p>
            <h3 className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{categoryCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xl">
            🏷️
          </div>
        </div>
      </Card>
    </div>
  );
}
