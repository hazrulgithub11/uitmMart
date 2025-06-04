'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Truck, Settings, Users, Package, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

interface AdminModule {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is admin
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin');
    }
  }, [status, session, router]);

  const adminModules: AdminModule[] = [
    {
      title: 'Tracking Configuration',
      description: 'Set up and manage tracking webhooks',
      icon: <Truck className="h-8 w-8 text-blue-500" />,
      link: '/admin/tracking'
    },
    {
      title: 'User Management',
      description: 'Manage users and roles',
      icon: <Users className="h-8 w-8 text-purple-500" />,
      link: '/admin/users'
    },
    {
      title: 'Product Management',
      description: 'Manage products and categories',
      icon: <Package className="h-8 w-8 text-green-500" />,
      link: '/admin/products'
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      icon: <Settings className="h-8 w-8 text-orange-500" />,
      link: '/admin/settings'
    }
  ];

  // If loading or unauthorized, show appropriate UI
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="font-bold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md">
          <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don&apos;t have permission to access this admin page.</p>
          <Button 
            onClick={() => router.push('/')} 
            className={cartoonStyle.buttonPrimary}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`${cartoonStyle.heading} text-black`}>Admin Dashboard</h1>
            <p className="text-gray-700 mt-1 font-medium">Manage your UiTM Mart system</p>
          </div>
          <Badge className="bg-purple-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">Admin</Badge>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminModules.map((module, index) => (
            <Card key={index} className={`${cartoonStyle.card} hover:scale-105 transition-transform cursor-pointer`} onClick={() => router.push(module.link)}>
              <CardHeader className="pb-2 flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 border-2 border-black">
                  {module.icon}
                </div>
              </CardHeader>
              <CardContent className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-black mb-2">{module.title}</CardTitle>
                <p className="text-gray-700">{module.description}</p>
              </CardContent>
              <CardFooter className="pt-2 flex justify-center">
                <Button 
                  className={`${cartoonStyle.buttonPrimary} w-full`}
                  onClick={() => router.push(module.link)}
                >
                  Access
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button 
            className={`${cartoonStyle.button} text-black`}
            onClick={() => router.push('/')}
          >
            Return to Store
          </Button>
        </div>
      </div>
    </div>
  );
} 