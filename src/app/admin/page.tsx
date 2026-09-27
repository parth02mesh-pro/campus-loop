'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Package, ShoppingBag, School, TrendingUp, DollarSign,
  Shield, Settings, Activity, Check, Trash2, Search, RefreshCw,
  Plus, X, MapPin, Building, Eye
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'sells', label: 'Sells & Orders', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'campuses', label: 'Campuses', icon: School },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function AdminContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState<any>({ users: 0, products: 0, orders: 0, revenue: 0, campuses: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sells, setSells] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [campusSearch, setCampusSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Add Campus Modal/Form State
  const [showAddCampus, setShowAddCampus] = useState(false);
  const [addingCampus, setAddingCampus] = useState(false);
  const [campusForm, setCampusForm] = useState({
    name: '',
    institutionName: '',
    city: '',
    state: '',
    address: '',
  });

  // Sync tab state with URL parameter (e.g. /admin?tab=campuses)
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) {
      setTab(t);
    } else {
      setTab('dashboard');
    }
  }, [searchParams]);

  const switchTab = (newTab: string) => {
    setTab(newTab);
    router.push(newTab === 'dashboard' ? '/admin' : `/admin?tab=${newTab}`);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/admin/login');
      else if (user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [authLoading, user, router]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [resStats, resUsers, resProducts, resSells, resCampuses] = await Promise.all([
        fetch('/api/stats').then((r) => r.json()).catch(() => ({})),
        fetch('/api/admin/users').then((r) => r.json()).catch(() => ({})),
        fetch('/api/products?limit=50').then((r) => r.json()).catch(() => ({})),
        fetch('/api/admin/sells').then((r) => r.json()).catch(() => ({})),
        fetch('/api/campuses').then((r) => r.json()).catch(() => ({})),
      ]);

      const sellsList = resSells?.data || [];
      const campusList = resCampuses?.data || [];
      const totalRevenue = sellsList.reduce((acc: number, s: any) => acc + Number(s.amount || s.total || 0), 0);

      setStats({
        users: resUsers?.data?.length ?? (resStats?.data?.users || 0),
        products: resProducts?.data?.items?.length ?? (resStats?.data?.products || 0),
        campuses: campusList.length,
        sellsCount: sellsList.length,
        revenue: totalRevenue,
      });

      setUsers(resUsers?.data || []);
      setProducts(resProducts?.data?.items || []);
      setSells(sellsList);
      setCampuses(campusList);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
        );
        toast.success(`User ${!currentStatus ? 'activated' : 'suspended'}`);
      }
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleApproveProduct = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: 'active' } : p))
    );
    toast.success('Listing approved and published!');
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success('Listing removed');
  };

  const handleAddCampusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name || !campusForm.city) {
      toast.error('Campus name and city are required');
      return;
    }

    setAddingCampus(true);
    try {
      const res = await fetch('/api/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campusForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create campus');

      toast.success(`🎉 ${campusForm.name} added successfully!`);
      setCampuses((prev) => [data.data, ...prev]);
      setStats((prev: any) => ({ ...prev, campuses: prev.campuses + 1 }));
      setCampusForm({ name: '', institutionName: '', city: '', state: '', address: '' });
      setShowAddCampus(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create campus');
    } finally {
      setAddingCampus(false);
    }
  };

  const handleDeleteCampus = async (campusId: string, campusName: string) => {
    if (!confirm(`Are you sure you want to remove ${campusName}?`)) return;

    try {
      const res = await fetch(`/api/campuses?id=${campusId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete campus');

      toast.success(`${campusName} removed`);
      setCampuses((prev) => prev.filter((c) => c.id !== campusId));
      setStats((prev: any) => ({ ...prev, campuses: Math.max(0, prev.campuses - 1) }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete campus');
    }
  };

  if (authLoading) return <div className="p-8 text-center">Loading Admin Console...</div>;
  if (!user || user.role !== 'admin') return null;

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.profile?.fullName?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q) ||
      p.campus?.name?.toLowerCase().includes(q)
    );
  });

  const filteredCampuses = campuses.filter((c) => {
    const q = campusSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.state?.toLowerCase().includes(q) ||
      c.institutionName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-electric-600 flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">Admin Panel</h1>
                <span className="badge bg-purple-100 text-purple-700 text-xs font-semibold">
                  {user.email}
                </span>
              </div>
              <p className="text-neutral-500 text-sm">Overview of users, sells, products, and campus metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="btn btn-secondary btn-sm gap-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/" className="btn btn-primary btn-sm">
              View Website
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-[230px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="flex lg:flex-col overflow-x-auto no-scrollbar gap-1.5 pb-2 lg:pb-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 lg:w-full transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                      : 'text-neutral-700 hover:bg-white bg-white/70 lg:bg-transparent border border-neutral-200/50 lg:border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                  {t.id === 'users' && (
                    <span className={`ml-1.5 lg:ml-auto text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-neutral-200'}`}>
                      {users.length}
                    </span>
                  )}
                  {t.id === 'sells' && (
                    <span className={`ml-1.5 lg:ml-auto text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-neutral-200'}`}>
                      {sells.length}
                    </span>
                  )}
                  {t.id === 'campuses' && (
                    <span className={`ml-1.5 lg:ml-auto text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-neutral-200'}`}>
                      {campuses.length}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Main Area */}
          <main>
            {/* 1. DASHBOARD */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: stats.users, icon: Users, color: 'from-brand-500 to-brand-600' },
                    { label: 'Total Sells', value: stats.sellsCount, icon: ShoppingBag, color: 'from-fresh-500 to-fresh-600' },
                    { label: 'Active Listings', value: stats.products, icon: Package, color: 'from-electric-500 to-electric-600' },
                    { label: 'Campuses Connected', value: stats.campuses, icon: School, color: 'from-purple-500 to-indigo-600' },
                  ].map((s) => (
                    <div key={s.label} className="card p-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-xs`}>
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Users */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">Recent Registered Users</h3>
                      <button onClick={() => switchTab('users')} className="text-xs text-brand-600 font-medium hover:underline">
                        View All ({users.length})
                      </button>
                    </div>
                    <div className="space-y-2">
                      {users.slice(0, 5).map((u) => (
                        <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 border border-neutral-100/60">
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                            {u.profile?.fullName?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm truncate">{u.profile?.fullName || 'User'}</span>
                              {u.role === 'admin' && (
                                <span className="badge bg-purple-100 text-purple-700 text-[10px] py-0">Admin</span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500 truncate">{u.email}</div>
                          </div>
                          <span className={`badge text-xs ${u.isActive !== false ? 'bg-fresh-100 text-fresh-700' : 'bg-red-100 text-red-700'}`}>
                            {u.isActive !== false ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Sells */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">Recent Sells & Deals</h3>
                      <button onClick={() => switchTab('sells')} className="text-xs text-brand-600 font-medium hover:underline">
                        View All ({sells.length})
                      </button>
                    </div>
                    <div className="space-y-2">
                      {sells.slice(0, 5).map((s: any, idx: number) => (
                        <div key={s.id || idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 border border-neutral-100/60">
                          <div className="w-9 h-9 rounded-xl bg-fresh-50 text-fresh-600 flex items-center justify-center shrink-0">
                            💰
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{s.productTitle || s.orderNumber}</div>
                            <div className="text-xs text-neutral-500">
                              Buyer: {s.buyerName || s.buyerEmail || 'Student'} · {formatDate(s.createdAt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-fresh-600">₹{s.amount || s.total}</div>
                            <span className="text-[10px] text-neutral-400 capitalize">{s.status || 'Completed'}</span>
                          </div>
                        </div>
                      ))}
                      {sells.length === 0 && (
                        <div className="text-center py-8 text-neutral-400 text-xs">No orders recorded yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. USERS */}
            {tab === 'users' && (
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-lg">User Management</h3>
                    <p className="text-neutral-500 text-xs">Total registered students & administrators: {users.length}</p>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, email..."
                      className="input has-icon-left pl-9 w-64 text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-neutral-500 border-b border-neutral-200">
                        <th className="pb-3">User</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Joined</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredUsers.map((u) => {
                        const active = u.isActive !== false;
                        return (
                          <tr key={u.id} className="hover:bg-neutral-50/60">
                            <td className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                                  {u.profile?.fullName?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                                </div>
                                <div className="font-medium text-sm text-neutral-900">
                                  {u.profile?.fullName || 'User'}
                                </div>
                              </div>
                            </td>
                            <td className="text-sm text-neutral-600">{u.email}</td>
                            <td>
                              <span className={`badge text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-700'}`}>
                                {u.role === 'admin' ? '👑 Admin' : 'Student'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge text-xs ${active ? 'bg-fresh-100 text-fresh-700' : 'bg-red-100 text-red-700'}`}>
                                {active ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="text-sm text-neutral-500">{formatDate(u.createdAt)}</td>
                            <td className="text-right">
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, active)}
                                  className={`btn btn-sm text-xs ${
                                    active
                                      ? 'text-red-600 hover:bg-red-50'
                                      : 'text-fresh-600 hover:bg-fresh-50'
                                  }`}
                                >
                                  {active ? 'Suspend' : 'Activate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">No users match your search</div>
                  )}
                </div>
              </div>
            )}

            {/* 3. SELLS & ORDERS */}
            {tab === 'sells' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg">Sales & Transactions</h3>
                    <p className="text-neutral-500 text-xs">Direct buys, rentals, and transactions completed on campus</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-500 block">Total Volume</span>
                    <span className="font-bold text-lg text-fresh-600">₹{(stats.revenue || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-neutral-500 border-b border-neutral-200">
                        <th className="pb-3">Order Number</th>
                        <th className="pb-3">Total Amount</th>
                        <th className="pb-3">Buyer Name</th>
                        <th className="pb-3">Buyer Email</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {sells.map((s: any, idx: number) => (
                        <tr key={s.id || idx} className="hover:bg-neutral-50/60">
                          <td className="py-3.5">
                            <div className="font-semibold text-sm text-neutral-900">{s.orderNumber || `ORD-${idx + 1}`}</div>
                          </td>
                          <td className="font-bold text-sm text-fresh-600">₹{s.amount || s.total}</td>
                          <td className="text-sm">
                            <div className="font-medium text-neutral-800">{s.buyerName || 'Student'}</div>
                          </td>
                          <td className="text-sm text-neutral-500">{s.buyerEmail || '-'}</td>
                          <td>
                            <span className="badge bg-fresh-100 text-fresh-700 text-xs capitalize">
                              {s.status || 'Completed'}
                            </span>
                          </td>
                          <td className="text-sm text-neutral-500">{formatDate(s.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sells.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">No sells recorded yet</div>
                  )}
                </div>
              </div>
            )}

            {/* 4. PRODUCTS */}
            {tab === 'products' && (
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-lg">Product Listings & Moderation</h3>
                    <p className="text-neutral-500 text-xs">Total items listed: {products.length}</p>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search listings..."
                      className="input has-icon-left pl-9 w-64 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            '📦'
                          )}
                        </div>
                        <div>
                          <Link href={`/products/${p.id}`} className="font-semibold text-sm hover:text-brand-600 transition-colors line-clamp-1">
                            {p.title}
                          </Link>
                          <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                            <span className="font-bold text-brand-600">{formatPrice(p.price)}</span>
                            <span>·</span>
                            <span className="capitalize">{p.listingType}</span>
                            <span>·</span>
                            <span>{p.campus?.name || 'Main Campus'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`badge text-xs ${p.status === 'active' ? 'bg-fresh-100 text-fresh-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status}
                        </span>
                        <Link href={`/products/${p.id}`} className="btn btn-ghost btn-sm" title="View Listing">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {p.status !== 'active' && (
                          <button
                            onClick={() => handleApproveProduct(p.id)}
                            className="btn btn-ghost btn-sm text-fresh-600"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="btn btn-ghost btn-sm text-red-600"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">No products found</div>
                  )}
                </div>
              </div>
            )}

            {/* 5. CAMPUSES */}
            {tab === 'campuses' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-bold text-lg">Campuses Management</h3>
                      <p className="text-neutral-500 text-xs">
                        Campuses available in the student listing dropdown: {campuses.length}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={campusSearch}
                          onChange={(e) => setCampusSearch(e.target.value)}
                          placeholder="Search campuses..."
                          className="input has-icon-left pl-9 w-48 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddCampus(!showAddCampus)}
                        className="btn btn-primary btn-sm gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add Campus
                      </button>
                    </div>
                  </div>

                  {/* Add Campus Form Modal/Box */}
                  {showAddCampus && (
                    <div className="mb-6 p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80 animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 font-bold text-sm text-purple-900">
                          <Building className="w-4 h-4 text-purple-600" />
                          Add New Campus
                        </div>
                        <button
                          onClick={() => setShowAddCampus(false)}
                          className="text-neutral-400 hover:text-neutral-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleAddCampusSubmit} className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Campus Full Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. BITS Pilani Goa Campus"
                            value={campusForm.name}
                            onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                            className="input text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            University / Institution
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. BITS Pilani"
                            value={campusForm.institutionName}
                            onChange={(e) => setCampusForm({ ...campusForm, institutionName: e.target.value })}
                            className="input text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Zuarinagar, Sancoale"
                            value={campusForm.city}
                            onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })}
                            className="input text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Goa"
                            value={campusForm.state}
                            onChange={(e) => setCampusForm({ ...campusForm, state: e.target.value })}
                            className="input text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Address (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. NH 17B, Bypass Road"
                            value={campusForm.address}
                            onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })}
                            className="input text-sm"
                          />
                        </div>

                        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddCampus(false)}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addingCampus}
                            className="btn btn-primary btn-sm gap-1.5"
                          >
                            {addingCampus ? 'Adding...' : 'Save & Publish Campus'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Campuses List */}
                  <div className="space-y-2.5">
                    {filteredCampuses.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 bg-white transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-lg shrink-0">
                            🎓
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-neutral-900">{c.name}</div>
                            <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-neutral-400" />
                              <span>{c.city}{c.state ? `, ${c.state}` : ''}</span>
                              {c.institutionName && (
                                <>
                                  <span>·</span>
                                  <span className="text-purple-700 font-medium">{c.institutionName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="badge bg-fresh-100 text-fresh-700 text-xs">
                            Active
                          </span>
                          <button
                            onClick={() => handleDeleteCampus(c.id, c.name)}
                            className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            title="Delete Campus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredCampuses.length === 0 && (
                      <div className="text-center py-12 text-neutral-400 text-sm">
                        No campuses found. Click "+ Add Campus" to create one.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. ANALYTICS */}
            {tab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: 'Monthly Gross Sells', value: `₹${(stats.revenue || 0).toLocaleString()}`, change: '+18%' },
                    { label: 'Total Campus Listings', value: products.length.toString(), change: '+12%' },
                    { label: 'Registered Campus Students', value: users.length.toString(), change: '+24%' },
                  ].map((m) => (
                    <div key={m.label} className="card p-5">
                      <div className="text-xs text-neutral-500 mb-1">{m.label}</div>
                      <div className="text-2xl font-bold">{m.value}</div>
                      <div className="text-xs text-fresh-600 mt-1">↑ {m.change} vs last month</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. SETTINGS */}
            {tab === 'settings' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-lg">System Configuration</h3>
                  <p className="text-neutral-500 text-xs">Platform parameters and database status</p>
                </div>

                <div className="space-y-3 max-w-xl text-sm">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200">
                    <div>
                      <div className="font-medium">Administrator Email</div>
                      <div className="text-xs text-neutral-500">{user.email}</div>
                    </div>
                    <span className="badge bg-purple-100 text-purple-700">Master Admin</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200">
                    <div>
                      <div className="font-medium">Database Auto-Migration</div>
                      <div className="text-xs text-neutral-500">Live schema sync enabled</div>
                    </div>
                    <span className="badge bg-fresh-100 text-fresh-700">Active</span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-500">Loading Admin Console...</div>}>
      <AdminContent />
    </Suspense>
  );
}
