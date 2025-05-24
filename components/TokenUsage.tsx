'use client';

import { useEffect, useState } from 'react';
import { tokenUsageService } from '@/lib/services/tokenUsage';

export function TokenUsage({ userId }: { userId: string }) {
  const [usage, setUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const currentUsage = await tokenUsageService.getCurrentUsage(userId);
        setUsage(currentUsage);
      } catch (error) {
        console.error('Error fetching token usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [userId]);

  if (loading) return <div>Loading usage...</div>;

  return (
    <div className="p-4 max-h-0 bg-white rounded-lg shadow-sm">
      <div className="mt-2">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full bg-green-200">
                {((usage / 10000) * 100).toFixed(2)} % Tokens Left
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}