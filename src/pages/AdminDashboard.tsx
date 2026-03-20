import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Tour } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import imageCompression from 'browser-image-compression';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationType, setDestinationType] = useState<'domestic' | 'international'>('domestic');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [plans, setPlans] = useState<{ name: string; price: number; description: string }[]>([
    { name: 'Mini', price: 29, description: 'Basic package with essential features.' },
    { name: 'Medium', price: 49, description: 'Standard package with more comfort.' },
    { name: 'Max', price: 60, description: 'Premium package with all inclusive features.' },
  ]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const uploadPromiseRef = React.useRef<Promise<string> | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setIsProcessing(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Super aggressive compression for 1s target
      const options = {
        maxSizeMB: 0.03, // 30KB - extremely small
        maxWidthOrHeight: 400, // Small but enough for cards
        useWebWorker: true,
        initialQuality: 0.3,
      };

      const compressedFile = await imageCompression(file, options);
      
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      
      uploadPromiseRef.current = new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImageUrl(base64data);
          setUploading(false);
          setIsProcessing(false);
          setUploadProgress(100);
          resolve(base64data);
        };
        reader.onerror = (error) => {
          console.error('Base64 conversion failed:', error);
          setError('Failed to process image. Please try again.');
          setUploading(false);
          setIsProcessing(false);
          setImageUrl('');
          reject(error);
        };
      });
    } catch (err) {
      console.error('Compression or upload error:', err);
      setError('Error processing image. Please try again.');
      setUploading(false);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const q = query(collection(db, 'tours'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTours = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tour));
      setTours(fetchedTours);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tours');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDestinationType('domestic');
    setLocation('');
    setPrice(0);
    setStartDate('');
    setEndDate('');
    setImageUrl('');
    setStatus('active');
    setPlans([
      { name: 'Mini', price: 29, description: 'Basic package with essential features.' },
      { name: 'Medium', price: 49, description: 'Standard package with more comfort.' },
      { name: 'Max', price: 60, description: 'Premium package with all inclusive features.' },
    ]);
    setEditingTour(null);
    setError(null);
  };

  const openModal = (tour?: Tour) => {
    if (tour) {
      setEditingTour(tour);
      setTitle(tour.title);
      setDescription(tour.description);
      setDestinationType(tour.destinationType);
      setLocation(tour.location);
      setPrice(tour.price);
      setStartDate(tour.startDate.split('T')[0]); // simplified for datetime-local
      setEndDate(tour.endDate.split('T')[0]);
      setImageUrl(tour.imageUrl);
      setStatus(tour.status);
      setPlans(tour.plans || [
        { name: 'Mini', price: 29, description: 'Basic package with essential features.' },
        { name: 'Medium', price: 49, description: 'Standard package with more comfort.' },
        { name: 'Max', price: 60, description: 'Premium package with all inclusive features.' },
      ]);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Capture current state for background processing
    const currentImageUrl = imageUrl;
    const isCurrentlyUploading = uploading;
    const currentUploadPromise = uploadPromiseRef.current;
    const currentTitle = title;
    const currentDescription = description;
    const currentDestinationType = destinationType;
    const currentLocation = location;
    const currentPrice = price;
    const currentStartDate = startDate;
    const currentEndDate = endDate;
    const currentStatus = status;
    const currentPlans = [...plans];
    const currentEditingTour = editingTour;

    // 1. INSTANT UI FEEDBACK: Close modal immediately
    const tourId = currentEditingTour?.id || doc(collection(db, 'tours')).id;
    closeModal();

    // 2. Background Processing & Firebase Native Optimistic UI
    (async () => {
      try {
        let initialImageUrl = currentImageUrl;
        const isBlob = initialImageUrl.startsWith('blob:');
        
        // If we don't have an image or it's a blob (which fails Firestore validation), use a placeholder or the old image
        if (!initialImageUrl || isBlob) {
            initialImageUrl = currentEditingTour?.imageUrl || `https://picsum.photos/seed/${tourId}/800/600`;
        }

        const start = new Date(currentStartDate ? new Date(currentStartDate).toISOString() : new Date().toISOString());
        const end = new Date(currentEndDate ? new Date(currentEndDate).toISOString() : new Date().toISOString());
        
        const plansCopy = [...currentPlans];
        if (plansCopy.length > 0) {
          plansCopy[0].price = Number(currentPrice);
        }

        const tourData = {
          title: currentTitle,
          description: currentDescription,
          destinationType: currentDestinationType,
          location: currentLocation,
          price: Number(currentPrice),
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          imageUrl: initialImageUrl,
          status: currentStatus,
          plans: plansCopy,
        };

        // Save to Firestore IMMEDIATELY so it appears on all screens (Home, Admin, etc.)
        // Firebase SDK handles the local optimistic update instantly
        if (currentEditingTour) {
          const tourRef = doc(db, 'tours', tourId);
          await updateDoc(tourRef, tourData);
        } else {
          const tourRef = doc(db, 'tours', tourId);
          await setDoc(tourRef, {
            ...tourData,
            authorUid: user.uid,
            createdAt: currentEditingTour?.createdAt || new Date().toISOString(),
          });
        }
        console.log('Initial Firestore save successful');

        // If uploading, wait for it and then update Firestore again with the real image
        if (isCurrentlyUploading && currentUploadPromise) {
           console.log('Waiting for background upload to finish...');
           const finalUrl = await currentUploadPromise;
           await updateDoc(doc(db, 'tours', tourId), { imageUrl: finalUrl });
           console.log('Updated tour with final image URL');
        }
      } catch (err) {
        console.error('Background save failed:', err);
        setError(`Failed to save tour: ${err instanceof Error ? err.message : String(err)}`);
        alert(`Failed to save tour: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        await deleteDoc(doc(db, 'tours', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tours/${id}`);
      }
    }
  };

  const seedTours = async () => {
    if (!user || seeding) return;
    setSeeding(true);
    setError(null);

    const defaultPlans = [
      { name: 'Mini', price: 29, description: 'Basic package with essential features.' },
      { name: 'Medium', price: 49, description: 'Standard package with more comfort.' },
      { name: 'Max', price: 60, description: 'Premium package with all inclusive features.' },
    ];

    const toursToSeed = [
      { title: 'Nepal Adventure', location: 'Nepal', type: 'international', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80' },
      { title: 'Thailand Escape', location: 'Thailand', type: 'international', img: 'https://images.unsplash.com/photo-1528181304800-2f140819ad9c?auto=format&fit=crop&w=800&q=80' },
      { title: 'Maldives Paradise', location: 'Maldives', type: 'international', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80' },
      { title: 'Switzerland Alps', location: 'Switzerland', type: 'international', img: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80' },
      { title: 'Cox\'s Bazar Beach', location: 'Cox\'s Bazar', type: 'domestic', img: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=800&q=80' },
      { title: 'Saintmartin Island', location: 'Saintmartin', type: 'domestic', img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80' },
      { title: 'Lalakhal River', location: 'Lalakhal', type: 'domestic', img: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80' },
      { title: 'Bandarban Hills', location: 'Bandarban', type: 'domestic', img: 'https://images.unsplash.com/photo-1623492701902-47dc207df5dc?auto=format&fit=crop&w=800&q=80' },
      { title: 'Sylhet Tea Gardens', location: 'Sylhet', type: 'domestic', img: 'https://images.unsplash.com/photo-1626583223726-b259a1ba244c?auto=format&fit=crop&w=800&q=80' },
      { title: 'Chabagan Tea Estate', location: 'Chabagan', type: 'domestic', img: 'https://images.unsplash.com/photo-1590001158193-790411ef882a?auto=format&fit=crop&w=800&q=80' },
      { title: 'Sundorban Mangrove', location: 'Sundorban', type: 'domestic', img: 'https://images.unsplash.com/photo-1611602132416-da2036190a9b?auto=format&fit=crop&w=800&q=80' },
      { title: 'Sada Pathor Bholaganj', location: 'Sada Pathor', type: 'domestic', img: 'https://images.unsplash.com/photo-1626583223726-b259a1ba244c?auto=format&fit=crop&w=800&q=80' },
      { title: 'Sitakundo Trails', location: 'Sitakundo', type: 'domestic', img: 'https://images.unsplash.com/photo-1623492701902-47dc207df5dc?auto=format&fit=crop&w=800&q=80' },
    ];

    try {
      for (const t of toursToSeed) {
        await addDoc(collection(db, 'tours'), {
          title: t.title,
          description: `Experience the beauty of ${t.location}. This tour includes guided visits, comfortable accommodation, and local experiences.`,
          destinationType: t.type,
          location: t.location,
          price: 29, // Base price
          plans: defaultPlans,
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          imageUrl: t.img,
          authorUid: user.uid,
          createdAt: new Date().toISOString(),
          status: 'active',
        });
      }
      alert('Tours seeded successfully!');
    } catch (err) {
      console.error('Seeding failed:', err);
      setError('Failed to seed tours.');
    } finally {
      setSeeding(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black text-white">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="mt-2 text-zinc-400">You must be an administrator to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Tour Management</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Create, update, and manage all tour packages.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={seedTours}
              disabled={seeding}
              className="inline-flex items-center justify-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Seed Default Tours'}
            </button>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Tour
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-950/50 border border-red-900 p-4 rounded-md flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-zinc-800">
              {tours.map((tour) => (
                <li key={tour.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div 
                        className="h-12 w-12 rounded-md overflow-hidden bg-zinc-800 mr-4 flex-shrink-0 border border-zinc-700 cursor-pointer hover:border-white transition-colors"
                        onClick={() => openModal(tour)}
                        title="Click to change image"
                      >
                        <img 
                          src={tour.imageUrl || `https://picsum.photos/seed/${tour.id}/100/100`} 
                          alt="" 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-white truncate">{tour.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                              tour.status === 'active' ? 'bg-zinc-950 text-green-400 border-green-900' :
                              tour.status === 'draft' ? 'bg-zinc-950 text-yellow-400 border-yellow-900' :
                              'bg-zinc-950 text-zinc-400 border-zinc-700'
                            }`}>
                              {tour.status}
                            </span>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                              {tour.destinationType}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-zinc-400 sm:mt-0">
                          <p className="truncate">{tour.location}</p>
                          <span className="mx-2">&middot;</span>
                          <p>${tour.price}</p>
                          <span className="mx-2">&middot;</span>
                          <p>{format(new Date(tour.startDate), 'MMM d, yyyy')} - {format(new Date(tour.endDate), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex items-center space-x-3">
                      <button
                        onClick={() => openModal(tour)}
                        className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
                        title="Edit Tour"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tour.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-zinc-800 transition-colors"
                        title="Delete Tour"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {tours.length === 0 && (
                <li className="p-6 text-center text-zinc-500">No tours found. Create one to get started.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/90 transition-opacity z-0" aria-hidden="true" onClick={closeModal}></div>
          
          <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-y-auto pointer-events-auto antialiased">
            <form onSubmit={handleSubmit} className="flex flex-col h-full pointer-events-auto">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h3 className="text-lg font-medium text-white" id="modal-title">
                  {editingTour ? 'Edit Tour' : 'Create New Tour'}
                </h3>
              </div>
              
              <div className="flex-grow p-6">
                {error && (
                  <div className="mb-6 bg-red-950/50 border border-red-900 p-4 rounded-md">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                <div className="space-y-5">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-zinc-300">Title</label>
                    <input type="text" id="title" required minLength={3} maxLength={150} autoFocus value={title} onChange={e => setTitle(e.target.value)} className="mt-1 focus:ring-1 focus:ring-white focus:border-white block w-full shadow-sm sm:text-sm border-zinc-700 bg-black text-white rounded-md p-2 border" />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300">Description</label>
                    <textarea id="description" required minLength={10} maxLength={5000} rows={4} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 focus:ring-1 focus:ring-white focus:border-white block w-full shadow-sm sm:text-sm border-zinc-700 bg-black text-white rounded-md p-2 border" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="destinationType" className="block text-sm font-medium text-zinc-300">Destination Type</label>
                      <select id="destinationType" value={destinationType} onChange={e => setDestinationType(e.target.value as any)} className="mt-1 block w-full py-2 px-3 border border-zinc-700 bg-black text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm">
                        <option value="domestic">Domestic</option>
                        <option value="international">International</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-zinc-300">Location</label>
                      <input type="text" id="location" required minLength={3} maxLength={200} value={location} onChange={e => setLocation(e.target.value)} className="mt-1 focus:ring-1 focus:ring-white focus:border-white block w-full shadow-sm sm:text-sm border-zinc-700 bg-black text-white rounded-md p-2 border" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-zinc-300">Price ($)</label>
                      <input type="number" id="price" required min="0" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1 focus:ring-1 focus:ring-white focus:border-white block w-full shadow-sm sm:text-sm border-zinc-700 bg-black text-white rounded-md p-2 border" />
                    </div>
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-zinc-300">Start Date</label>
                      <input type="date" id="startDate" required value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 focus:ring-1 focus:ring-white focus:border-white block w-full shadow-sm sm:text-sm border-zinc-700 bg-black text-white rounded-md p-2 border" />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-zinc-300">End Date</label>
                      <input type="date" id="endDate" required value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 focus:ring-1 focus:ring-white focus:border-white block w-full shadow-sm sm:text-sm border-zinc-700 bg-black text-white rounded-md p-2 border" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300">Tour Image</label>
                    {imageUrl && (
                      <div className="mt-2 mb-4 relative h-40 w-full rounded-lg overflow-hidden border border-zinc-800 bg-black">
                        <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          title="Remove Image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="mt-1 flex flex-col space-y-3">
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          id="imageUrl" 
                          value={imageUrl} 
                          onChange={e => setImageUrl(e.target.value)} 
                          placeholder="Paste image URL here..."
                          className="flex-grow focus:ring-1 focus:ring-white focus:border-white block w-full shadow-sm sm:text-sm border-zinc-700 bg-black text-white rounded-md p-2 border" 
                        />
                      </div>
                      <div className="relative">
                        <input 
                          type="file" 
                          id="file-upload"
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                        <label 
                          htmlFor="file-upload"
                          className={`flex items-center justify-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isProcessing ? 'Optimizing...' : uploading ? 'Syncing to Cloud...' : 'Change Photo'}
                        </label>
                      </div>
                    </div>
                    {uploading && (
                      <div className="mt-2 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ease-out ${isProcessing ? 'bg-zinc-600 animate-pulse w-full' : 'bg-white'}`}
                          style={{ width: isProcessing ? '100%' : `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                    {uploading && (
                      <p className="mt-1 text-[10px] text-zinc-500 text-right font-mono">
                        {isProcessing ? 'Optimizing...' : `${Math.round(uploadProgress)}%`}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">Tour Plans</label>
                    <div className="space-y-4">
                      {plans.map((plan, index) => (
                        <div key={index} className="p-4 bg-black border border-zinc-800 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{plan.name} Plan</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1">Price ($)</label>
                              <input
                                type="number"
                                value={plan.price}
                                onChange={(e) => {
                                  const newPlans = [...plans];
                                  newPlans[index].price = Number(e.target.value);
                                  setPlans(newPlans);
                                }}
                                className="block w-full text-sm border-zinc-700 bg-zinc-900 text-white rounded-md p-2 border"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1">Description</label>
                              <input
                                type="text"
                                value={plan.description}
                                onChange={(e) => {
                                  const newPlans = [...plans];
                                  newPlans[index].description = e.target.value;
                                  setPlans(newPlans);
                                }}
                                className="block w-full text-sm border-zinc-700 bg-zinc-900 text-white rounded-md p-2 border"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-zinc-300">Status</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value as any)} className="mt-1 block w-full py-2 px-3 border border-zinc-700 bg-black text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm">
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-md border border-zinc-700 bg-black text-white hover:bg-zinc-900 transition-colors mr-3">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : (editingTour ? 'Save Changes' : 'Create Tour')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
