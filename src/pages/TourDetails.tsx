import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Tour, Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, DollarSign, Users, CheckCircle, AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import imageCompression from 'browser-image-compression';

export default function TourDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('Mini');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const tourRef = doc(db, 'tours', id);
    const unsubscribe = onSnapshot(tourRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Tour;
        setTour(data);
        if (data.plans && data.plans.length > 0) {
          setSelectedPlan(data.plans[0].name);
        }
      } else {
        setError('Tour not found');
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `tours/${id}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleBookTour = async () => {
    if (!user) {
      login();
      return;
    }

    if (!tour) return;

    const plan = tour.plans?.find(p => p.name === selectedPlan) || { price: tour.price };

    setBookingLoading(true);
    setError(null);

    try {
      const newBooking: Omit<Booking, 'id'> = {
        tourId: tour.id,
        userId: user.uid,
        planName: selectedPlan,
        status: 'pending',
        numberOfPeople,
        totalPrice: plan.price * numberOfPeople,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'bookings'), newBooking);
      setBookingSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
      setError('Failed to book tour. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tour) return;

    setImageUploading(true);
    setError(null);

    try {
      const options = {
        maxSizeMB: 0.03, // 30KB
        maxWidthOrHeight: 400,
        useWebWorker: true,
        initialQuality: 0.3,
      };

      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          const tourRef = doc(db, 'tours', tour.id);
          await updateDoc(tourRef, { imageUrl: base64data });
          setImageUploading(false);
        } catch (err) {
          console.error('Failed to update tour image:', err);
          setError('Failed to update image.');
          setImageUploading(false);
        }
      };
      reader.onerror = (error) => {
        console.error('Base64 conversion failed:', error);
        setError('Failed to process image.');
        setImageUploading(false);
      };
    } catch (err) {
      console.error('Compression error:', err);
      setError('Error processing image.');
      setImageUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black px-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{error || 'Tour not found'}</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tours
          </button>
        </div>
      </div>
    );
  }

  const duration = differenceInDays(new Date(tour.endDate), new Date(tour.startDate));
  const currentPlan = tour.plans?.find(p => p.name === selectedPlan) || { price: tour.price };

  return (
    <div className="min-h-screen bg-black py-12 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-8 inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all tours
        </button>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="relative h-96 border-b border-zinc-800 group">
            <img
              key={tour.imageUrl || tour.id}
              src={tour.imageUrl || `https://picsum.photos/seed/${tour.id}/1200/800`}
              alt={tour.title}
              className={`w-full h-full object-cover transition-opacity ${imageUploading ? 'opacity-50' : ''}`}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            
            {user?.role === 'admin' && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-white bg-black/80 backdrop-blur-md hover:bg-zinc-800 transition-colors">
                  <Upload className="mr-2 h-4 w-4" />
                  {imageUploading ? 'Uploading...' : 'Change Image'}
                  <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} />
                </label>
              </div>
            )}

            <div className="absolute bottom-0 left-0 p-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-black uppercase tracking-wide">
                  {tour.destinationType}
                </span>
                <span className="flex items-center text-zinc-300 text-sm font-medium">
                  <MapPin className="h-4 w-4 mr-1" />
                  {tour.location}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{tour.title}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">About this tour</h2>
                <p className="text-zinc-400 leading-relaxed whitespace-pre-line">
                  {tour.description}
                </p>
              </section>

              <section className="bg-black rounded-xl p-6 border border-zinc-800">
                <h3 className="text-lg font-semibold text-white mb-4">Tour Highlights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <Calendar className="h-6 w-6 text-zinc-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-white">Duration</p>
                      <p className="text-zinc-400 text-sm">{duration} days, {duration - 1} nights</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-zinc-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-white">Location</p>
                      <p className="text-zinc-400 text-sm">{tour.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="h-6 w-6 text-zinc-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-white">Dates</p>
                      <p className="text-zinc-400 text-sm">
                        {format(new Date(tour.startDate), 'MMM d, yyyy')} - {format(new Date(tour.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-black border border-zinc-800 rounded-xl p-6 sticky top-24">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-300 mb-3">Select Plan</label>
                  <div className="grid grid-cols-1 gap-2">
                    {tour.plans?.map((plan) => (
                      <button
                        key={plan.name}
                        onClick={() => setSelectedPlan(plan.name)}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          selectedPlan === plan.name
                            ? 'border-white bg-zinc-800'
                            : 'border-zinc-800 bg-transparent hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{plan.name}</span>
                          <span className="text-white font-extrabold">${plan.price}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{plan.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-extrabold text-white">${currentPlan.price}</span>
                  <span className="text-zinc-500 ml-2 font-medium">/ person</span>
                </div>

                {bookingSuccess ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-white mb-2" />
                    <h3 className="text-sm font-medium text-white">Booking Successful!</h3>
                    <p className="text-xs text-zinc-400 mt-1">Redirecting to your dashboard...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="guests" className="block text-sm font-medium text-zinc-300 mb-2">
                        Number of Guests
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Users className="h-5 w-5 text-zinc-500" />
                        </div>
                        <input
                          type="number"
                          name="guests"
                          id="guests"
                          min="1"
                          max="20"
                          className="focus:ring-white focus:border-white block w-full pl-10 sm:text-sm border-zinc-800 bg-zinc-900 text-white rounded-md py-3 border"
                          value={numberOfPeople}
                          onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-4">
                      <div className="flex justify-between text-base font-medium text-white mb-4">
                        <p>Total</p>
                        <p>${currentPlan.price * numberOfPeople}</p>
                      </div>
                      <button
                        onClick={handleBookTour}
                        disabled={bookingLoading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black ${
                          bookingLoading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-white hover:bg-zinc-200'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors`}
                      >
                        {bookingLoading ? 'Processing...' : user ? 'Book Now' : 'Sign in to Book'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
