'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

export default function SellerDashboardPage() {
  const { status } = useSession({
    required: true,
  });

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Seller Dashboard</h1>
    </div>
  );
}
