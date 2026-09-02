import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../../documentsApi';
import Card, { CardTitle } from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';

export default function Documents() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => documentsApi.getDocumentTypes().catch(() => ({ data: [] })),
  });

  const docTypes = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground ">Document Vault</h2>
        <p className="text-sm text-muted-foreground">Upload and verify procurement invoices, certifications, and delivery sheets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload form card */}
        <Card className="md:col-span-1 space-y-4">
          <CardTitle>Upload Document</CardTitle>
          
          <div className="border-2 border-dashed border-border hover:border-violet-500 rounded-lg p-8 text-center cursor-pointer transition">
            <span className="text-3xl block mb-2">☁️</span>
            <span className="text-xs text-muted-foreground block">Click or Drag invoice to upload</span>
            <span className="text-[10px] text-muted-foreground block mt-1">PDF, JPG, PNG (Max 10MB)</span>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Document Category</label>
            <select className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none">
              <option value="">Select Category...</option>
              {docTypes.map((type) => (
                <option key={type.id} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" fullWidth size="md">
            Submit Document
          </Button>
        </Card>

        {/* Upload history card */}
        <Card className="md:col-span-2 space-y-4">
          <CardTitle>Upload History</CardTitle>

          <div className="text-center py-12 text-muted-foreground text-sm">
            No documents uploaded yet.
          </div>
        </Card>
      </div>
    </div>
  );
}
