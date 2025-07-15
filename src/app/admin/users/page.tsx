'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Ban, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Mail,
  Calendar,
  User,
  Phone,
  DollarSign,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Cartoon UI Style (matching admin page)
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

type UserType = 'seller' | 'buyer';
type UserStatus = 'active' | 'suspended' | 'pending';

interface Seller {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  status: UserStatus;
}

interface Buyer {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  createdAt: string;
  profileImage?: string;
  status: UserStatus;
  totalOrders: number;
  totalSpent: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<UserType>('seller');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<Seller | Buyer | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sellers from database
  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sellers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sellers');
      }
      
      const data = await response.json();
      setSellers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch buyers from database
  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/buyers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch buyers');
      }
      
      const data = await response.json();
      setBuyers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buyers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      if (activeTab === 'seller') {
        fetchSellers();
      } else {
        fetchBuyers();
      }
    }
  }, [status, session, activeTab]);

  // Auth check (similar to admin page)
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

  const currentUsers = activeTab === 'seller' ? sellers : buyers;

  // Filter users based on search and status
  const filteredUsers = currentUsers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (activeTab === 'buyer' && (user as Buyer).fullName?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white border-2 border-black">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500 text-white border-2 border-black">Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-black border-2 border-black">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white border-2 border-black">Unknown</Badge>;
    }
  };

  const handleUserAction = (action: string, userId: number) => {
    // This would integrate with backend in real implementation
    console.log(`Action: ${action} for user ID: ${userId}`);
    // Show success message or update UI accordingly
  };

  const handleTabChange = (tab: UserType) => {
    setActiveTab(tab);
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-black">
            <Button
              onClick={() => router.push('/admin')}
              className={cartoonStyle.button}
            >
              <ArrowLeft className="h-4 w-4 mr-2 text-black" />
              Back to Admin
            </Button>
            <div>
              <h1 className={`${cartoonStyle.heading} text-black`}>User Management</h1>
              <p className="text-gray-700 mt-1 font-medium">Manage sellers and buyers on UiTM Mart</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 text-black">
          <Button
            onClick={() => handleTabChange('seller')}
            className={`${activeTab === 'seller' ? cartoonStyle.buttonPrimary : cartoonStyle.button} flex items-center gap-2`}
          >
            <Store className="h-4 w-4" />
            Sellers ({sellers.length})
          </Button>
          <Button
            onClick={() => handleTabChange('buyer')}
            className={`${activeTab === 'buyer' ? cartoonStyle.buttonPrimary : cartoonStyle.button} flex items-center gap-2`}
          >
            <ShoppingBag className="h-4 w-4" />
            Buyers ({buyers.length})
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className={cartoonStyle.card}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 text-black">
                <div className="relative text-black">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={`Search by ${activeTab === 'buyer' ? 'username, email, or name' : 'username or email'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${cartoonStyle.input} pl-10`}
                  />
                </div>
              </div>
              <div className="flex gap-2 text-black">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                  className={`${cartoonStyle.input} px-3 py-2`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
                <Button className={cartoonStyle.button}>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading {activeTab}s...</span>
          </div>
        ) : error ? (
          <Card className={cartoonStyle.card}>
            <CardContent className="text-center py-12">
              <div className="text-red-500 mb-4">Error: {error}</div>
              <Button 
                onClick={() => activeTab === 'seller' ? fetchSellers() : fetchBuyers()} 
                className={cartoonStyle.buttonPrimary}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className={`${cartoonStyle.card} hover:scale-105 transition-transform`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-black">@{user.username}</CardTitle>
                        {activeTab === 'buyer' && (user as Buyer).fullName && (
                          <p className="text-sm text-gray-600">{(user as Buyer).fullName}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(user.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    {activeTab === 'buyer' && (
                      <>
                        {(user as Buyer).phoneNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{(user as Buyer).phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">Orders: {(user as Buyer).totalOrders}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">Spent: RM{(user as Buyer).totalSpent.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className={`${cartoonStyle.button} flex-1 text-xs text-black`}
                      onClick={() => {
                        if (activeTab === 'seller') {
                          router.push(`/admin/users/ocr/${user.id}`);
                        } else {
                          setSelectedUser(user);
                        }
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {user.status === 'active' ? (
                      <Button
                        size="sm"
                        className={`${cartoonStyle.buttonDanger} text-xs`}
                        onClick={() => handleUserAction('suspend', user.id)}
                      >
                        <Ban className="h-3 w-3" />
                      </Button>
                    ) : user.status === 'suspended' ? (
                      <Button
                        size="sm"
                        className={`${cartoonStyle.buttonSuccess} text-xs`}
                        onClick={() => handleUserAction('activate', user.id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className={`${cartoonStyle.buttonSuccess} text-xs`}
                        onClick={() => handleUserAction('approve', user.id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <Card className={cartoonStyle.card}>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No {activeTab}s found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className={`${cartoonStyle.card} max-w-2xl w-full max-h-[80vh] overflow-y-auto text-black`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-black">
                  {activeTab === 'seller' ? 'Seller' : 'Buyer'} Details
                </CardTitle>
                <Button
                  onClick={() => setSelectedUser(null)}
                  className={cartoonStyle.button}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-black flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold">@{selectedUser.username}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  {activeTab === 'buyer' && (selectedUser as Buyer).fullName && (
                    <p className="text-gray-600">{(selectedUser as Buyer).fullName}</p>
                  )}
                  {getStatusBadge(selectedUser.status)}
                </div>
                
                <div className="text-center">
                  <h4 className="font-bold text-gray-800 mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Username:</strong> {selectedUser.username}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    {activeTab === 'buyer' && (selectedUser as Buyer).fullName && (
                      <p><strong>Full Name:</strong> {(selectedUser as Buyer).fullName}</p>
                    )}
                    {activeTab === 'buyer' && (selectedUser as Buyer).phoneNumber && (
                      <p><strong>Phone:</strong> {(selectedUser as Buyer).phoneNumber}</p>
                    )}
                    <p><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {selectedUser.status}</p>
                    {activeTab === 'buyer' && (
                      <>
                        <p><strong>Total Orders:</strong> {(selectedUser as Buyer).totalOrders}</p>
                        <p><strong>Total Spent:</strong> RM{(selectedUser as Buyer).totalSpent.toFixed(2)}</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button className={`${cartoonStyle.buttonPrimary} flex-1`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                  {selectedUser.status === 'active' ? (
                    <Button 
                      className={cartoonStyle.buttonDanger}
                      onClick={() => handleUserAction('suspend', selectedUser.id)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  ) : (
                    <Button 
                      className={cartoonStyle.buttonSuccess}
                      onClick={() => handleUserAction('activate', selectedUser.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 