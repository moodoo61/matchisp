'use client';

import { AdminShell } from '@/components/AdminShell';
import { AuthGate } from '@/components/AuthGate';
import { EncodingQualityOptionsCard } from '@/features/live/components/encoding/EncodingQualityOptionsCard';
import { EncodingRuntimeStatusCard } from '@/features/live/components/encoding/EncodingRuntimeStatusCard';
import { EncodingSourceOptionsCard } from '@/features/live/components/encoding/EncodingSourceOptionsCard';

export default function LiveEncodingPage() {
  return (
    <AuthGate>
      <AdminShell>
        <div className="task-stack">
          <EncodingRuntimeStatusCard />
          <EncodingSourceOptionsCard />
          <EncodingQualityOptionsCard />
        </div>
      </AdminShell>
    </AuthGate>
  );
}
