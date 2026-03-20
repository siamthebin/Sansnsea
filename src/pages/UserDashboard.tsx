import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Booking, Tour } from '../types';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, DollarSign, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface BookingWithTour extends Booking {
  tour?: Tour;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        
        // Fetch tour details for each booking
        const bookingsWithTours = await Promise.all(
          bookingsData.map(async (booking) => {
            try {
              const tourDoc = await getDoc(doc(db, 'tours', booking.tourId));
              if (tourDoc.exists()) {
                return { ...booking, tour: { id: tourDoc.id, ...tourDoc.data() } as Tour };
              }
              return booking;
            } catch (err) {
              console.error("Error fetching tour for booking", err);
              return booking;
            }
          })
        );
        
        // Sort by creation date descending
        bookingsWithTours.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(bookingsWithTours);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'bookings');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'bookings');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'cancelled'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black text-white">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
          <h2 className="text-2xl font-bold text-white">Please sign in</h2>
          <p className="mt-2 text-zinc-400">You need to be signed in to view your bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            View and manage your upcoming and past tour bookings.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl shadow-sm p-12 text-center border border-zinc-800">
            <Calendar className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No bookings yet</h3>
            <p className="text-zinc-400 mb-6">Looks like you haven't booked any tours yet. Start exploring!</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-black bg-white hover:bg-zinc-200 transition-colors"
            >
              Explore Tours
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex flex-col sm:flex-row hover:border-zinc-700 transition-colors">
                {booking.tour && (
                  <div className="sm:w-64 h-48 sm:h-auto flex-shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-800">
                    <img
                      src={booking.tour.imageUrl || `https://picsum.photos/seed/${booking.tour.id}/400/300`}
                      alt={booking.tour.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {booking.tour ? booking.tour.title : 'Tour Unavailable'}
                      </h3>
                      {booking.tour && (
                        <div className="flex items-center text-zinc-400 text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          {booking.tour.location}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                      booking.status === 'confirmed' ? 'bg-zinc-950 text-green-400 border-green-900' :
                      booking.status === 'pending' ? 'bg-zinc-950 text-yellow-400 border-yellow-900' :
                      'bg-zinc-950 text-red-400 border-red-900'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">Dates</p>
                      <p className="font-medium text-white text-sm">
                        {booking.tour ? (
                          `${format(new Date(booking.tour.startDate), 'MMM d')} - ${format(new Date(booking.tour.endDate), 'MMM d, yyyy')}`
                        ) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">Plan</p>
                      <p className="font-medium text-white text-sm">{booking.planName || 'Standard'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">Guests</p>
                      <p className="font-medium text-white text-sm">{booking.numberOfPeople} people</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">Total Price</p>
                      <p className="font-medium text-white text-sm flex items-center">
                        <DollarSign className="h-4 w-4 text-zinc-400" />
                        {booking.totalPrice}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 mb-1">Booked On</p>
                      <p className="font-medium text-white text-sm">
                        {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-end space-x-3">
                    {booking.tour && (
                      <Link
                        to={`/tour/${booking.tour.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-zinc-700 rounded-md text-sm font-medium text-white bg-black hover:bg-zinc-800 transition-colors"
                      >
                        View Tour
                      </Link>
                    )}
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-red-900/50 rounded-md text-sm font-medium text-red-400 bg-red-950/30 hover:bg-red-950/50 transition-colors"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
