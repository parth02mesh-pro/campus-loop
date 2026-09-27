'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Camera, Upload, ArrowRight, ArrowLeft, Check, Package, DollarSign,
  MapPin, Eye, Sparkles, X, Loader2, Plus, Image as ImageIcon
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Photos', icon: Camera },
  { id: 2, title: 'Category', icon: Package },
  { id: 3, title: 'Details', icon: Sparkles },
  { id: 4, title: 'Condition', icon: Check },
  { id: 5, title: 'Listing Type', icon: Package },
  { id: 6, title: 'Price', icon: DollarSign },
  { id: 7, title: 'Campus', icon: MapPin },
  { id: 8, title: 'Preview', icon: Eye },
];

const CONDITIONS = [
  { value: 'new', label: 'New', desc: 'Brand new, unused' },
  { value: 'like_new', label: 'Like New', desc: 'Perfect condition' },
  { value: 'very_good', label: 'Very Good', desc: 'Minor signs of use' },
  { value: 'good', label: 'Good', desc: 'Normal wear' },
  { value: 'acceptable', label: 'Acceptable', desc: 'Some wear but usable' },
  { value: 'used', label: 'Used', desc: 'Clear signs of use' },
];

export default function SellPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: '',
    listingType: 'sell',
    price: '',
    rentalPriceDaily: '',
    rentalDeposit: '',
    campusId: '',
    campus: '',
    brand: '',
    author: '',
    edition: '',
    course: '',
    images: [] as string[],
  });

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((res) => setCategories(res.data || []))
      .catch(() => {});

    fetch('/api/campuses')
      .then((r) => r.json())
      .then((res) => {
        const list = res.data || [];
        setCampuses(list);
        if (list.length > 0) {
          setForm((prev) => {
            const defaultCampus = list.find((c: any) => (user?.profile as any)?.campusId === c.id || c.name === user?.profile?.campusName) || list[0];
            return {
              ...prev,
              campusId: prev.campusId || defaultCampus.id,
              campus: prev.campus || defaultCampus.name,
            };
          });
        }
      })
      .catch(() => {});
  }, [user]);

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold mb-2">Login Required</h1>
        <p className="text-neutral-600 mb-6">You need to be logged in to sell items</p>
        <button onClick={() => router.push('/login')} className="btn btn-primary btn-md">
          Login to Continue
        </button>
      </div>
    );
  }

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      toast.error('Please select valid image files (PNG, JPG, WEBP, GIF)');
      return;
    }

    const remainingSlots = 5 - form.images.length;
    if (remainingSlots <= 0) {
      toast.error('You can upload a maximum of 5 photos');
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    setUploading(true);

    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload images');
      }

      const newUrls: string[] = data.data?.urls || (data.data?.url ? [data.data.url] : []);
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newUrls].slice(0, 5),
      }));
      toast.success(`${newUrls.length} photo(s) uploaded!`);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const canNext = () => {
    switch (step) {
      case 1: return true; // photos optional but recommended
      case 2: return !!form.categoryId;
      case 3: return !!form.title && !!form.description;
      case 4: return !!form.condition;
      case 5: return !!form.listingType;
      case 6:
        if (form.listingType === 'free') return true;
        if (form.listingType === 'rent') return !!form.rentalPriceDaily;
        return !!form.price;
      case 7: return !!form.campusId || !!form.campus;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        campusId: form.campusId || (campuses[0]?.id || null),
        price: form.listingType === 'free' ? '0' : form.price,
        rentalPriceDaily: form.listingType === 'rent' ? form.rentalPriceDaily : null,
        rentalDeposit: form.listingType === 'rent' ? form.rentalDeposit : null,
      };
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create listing');
      toast.success('🎉 Your item is live!');
      router.push(`/products/${data.data.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sell an Item</h1>
        <p className="text-neutral-600">List your item in just a few steps</p>
      </div>

      {/* Progress */}
      <div className="mb-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isComplete = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                      : isComplete
                      ? 'bg-fresh-500 text-white'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 ${isComplete ? 'bg-fresh-500' : 'bg-neutral-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        {/* Step 1: Photos */}
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Upload photos</h2>
              <span className="text-sm font-medium text-neutral-500">
                {form.images.length}/5 uploaded
              </span>
            </div>
            <p className="text-neutral-600 mb-6">Add up to 5 clear photos of your item</p>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files);
              }}
            />

            {/* Upload Zone */}
            {form.images.length < 5 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                    : 'border-neutral-300 hover:border-brand-400 hover:bg-neutral-50/60'
                }`}
              >
                {uploading ? (
                  <div className="py-4">
                    <Loader2 className="w-12 h-12 text-brand-600 mx-auto mb-3 animate-spin" />
                    <div className="font-semibold text-neutral-800">Uploading photos...</div>
                    <div className="text-sm text-neutral-500 mt-1">Please wait a moment</div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <div className="font-semibold text-neutral-800 mb-1">
                      Drag & drop or <span className="text-brand-600 underline">browse files</span>
                    </div>
                    <div className="text-sm text-neutral-500">
                      PNG, JPG, WEBP or GIF up to 5MB each
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Uploaded Thumbnails Grid */}
            {form.images.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-semibold text-neutral-700 mb-3">Uploaded Photos</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {form.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-100"
                    >
                      <img
                        src={imgUrl}
                        alt={`Item ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          Cover
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button */}
                  {form.images.length < 5 && !uploading && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 hover:border-brand-500 flex flex-col items-center justify-center text-neutral-500 hover:text-brand-600 transition-colors bg-neutral-50/50"
                    >
                      <Plus className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Add Photo</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-neutral-500 mt-4 flex items-center gap-1.5">
              💡 Tip: Good photos increase your chances of selling by 4x. Photos are saved automatically to database listings.
            </p>
          </div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-2">What are you selling?</h2>
            <p className="text-neutral-600 mb-6">Pick the best category</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setForm({ ...form, categoryId: cat.id })}
                  className={`card p-4 text-left hover:scale-[1.02] transition-transform ${
                    form.categoryId === cat.id ? 'ring-2 ring-brand-500 bg-brand-50' : ''
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon || '📦'}</div>
                  <div className="font-semibold text-sm">{cat.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{cat.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-2">Tell us about your item</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Introduction to Algorithms - CLRS 4th Edition"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe condition, reason for selling, what's included..."
                rows={4}
                className="input"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Brand / Publisher (optional)</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. MIT Press, Casio"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Course / Subject (optional)</label>
                <input
                  type="text"
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  placeholder="e.g. DBMS, OS"
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Condition */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Item condition</h2>
            <p className="text-neutral-600 mb-6">Be honest — this builds trust</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, condition: c.value })}
                  className={`card p-4 text-left hover:scale-[1.02] transition-transform ${
                    form.condition === c.value ? 'ring-2 ring-brand-500 bg-brand-50' : ''
                  }`}
                >
                  <div className="font-semibold mb-1">{c.label}</div>
                  <div className="text-sm text-neutral-600">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Listing Type */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold mb-2">How do you want to list it?</h2>
            <p className="text-neutral-600 mb-6">Pick the option that works best</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { value: 'sell', label: '🛒 Sell', desc: 'Sell it permanently' },
                { value: 'rent', label: '🔄 Rent', desc: 'Earn from rentals' },
                { value: 'exchange', label: '♻️ Exchange', desc: 'Swap with other items' },
                { value: 'free', label: '🎁 Give Away', desc: 'Free to good home' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, listingType: t.value })}
                  className={`card p-5 text-left hover:scale-[1.02] transition-transform ${
                    form.listingType === t.value ? 'ring-2 ring-brand-500 bg-brand-50' : ''
                  }`}
                >
                  <div className="text-2xl mb-2">{t.label.split(' ')[0]}</div>
                  <div className="font-semibold">{t.label.split(' ').slice(1).join(' ')}</div>
                  <div className="text-sm text-neutral-600">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Price */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-2">
              {form.listingType === 'free' ? 'Free item' : form.listingType === 'rent' ? 'Set rental price' : 'Set your price'}
            </h2>
            {form.listingType === 'free' ? (
              <div className="card p-6 bg-fresh-50 border-fresh-200">
                <div className="text-4xl mb-2">🎁</div>
                <p className="text-neutral-700">
                  This item will be listed as free. Great for giving back to the community!
                </p>
              </div>
            ) : form.listingType === 'rent' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Daily Rental Price (₹) *</label>
                  <input
                    type="number"
                    value={form.rentalPriceDaily}
                    onChange={(e) => setForm({ ...form, rentalPriceDaily: e.target.value })}
                    placeholder="e.g. 50"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Refundable Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={form.rentalDeposit}
                    onChange={(e) => setForm({ ...form, rentalDeposit: e.target.value })}
                    placeholder="e.g. 500"
                    className="input"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1.5">Price (₹) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 999"
                  className="input"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 7: Campus */}
        {step === 7 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Pickup / Delivery Campus</h2>
            <p className="text-neutral-600 mb-6">Where can buyers pick up or meet you?</p>
            <div>
              <label className="block text-sm font-medium mb-1.5">Campus *</label>
              <select
                value={form.campusId}
                onChange={(e) => {
                  const selected = campuses.find((c) => c.id === e.target.value);
                  setForm({
                    ...form,
                    campusId: e.target.value,
                    campus: selected ? selected.name : form.campus,
                  });
                }}
                className="input"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 8: Preview */}
        {step === 8 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Preview your listing</h2>
            <p className="text-neutral-600 mb-6">Make sure everything looks good before publishing</p>
            <div className="card p-6 space-y-4">
              {/* Image previews */}
              {form.images.length > 0 ? (
                <div>
                  <div className="text-xs text-neutral-500 mb-2">Photos ({form.images.length})</div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg">
                  ⚠️ No photos uploaded. Listings with photos receive up to 4x more inquiries.
                </div>
              )}

              <div>
                <div className="text-xs text-neutral-500 mb-1">Title</div>
                <div className="font-semibold text-lg">{form.title || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Description</div>
                <div className="text-sm whitespace-pre-wrap text-neutral-700">{form.description || '-'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-neutral-100">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Category</div>
                  <div className="font-medium">{categories.find(c => c.id === form.categoryId)?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Condition</div>
                  <div className="font-medium">{CONDITIONS.find(c => c.value === form.condition)?.label || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Listing Type</div>
                  <div className="font-medium capitalize">{form.listingType}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Price</div>
                  <div className="font-medium text-brand-600 font-bold">
                    {form.listingType === 'free' ? 'Free' : form.listingType === 'rent' ? `₹${form.rentalPriceDaily}/day` : `₹${form.price}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Campus</div>
                  <div className="font-medium">{form.campus || 'Main Campus'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="btn btn-secondary btn-md"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext() || uploading}
              className="btn btn-primary btn-md"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary btn-md"
            >
              {loading ? 'Publishing...' : '🎉 Publish Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
