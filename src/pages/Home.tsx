import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Tour } from '../types';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'domestic' | 'international'>('all');

  useEffect(() => {
    let q = query(collection(db, 'tours'), where('status', '==', 'active'));
    
    if (filter !== 'all') {
      q = query(collection(db, 'tours'), where('status', '==', 'active'), where('destinationType', '==', filter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTours = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tour));
      setTours(fetchedTours);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tours');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative border-b border-zinc-800 bg-black pb-24 pt-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Explore the World
          </h1>
          <p className="mt-6 text-xl text-zinc-400 max-w-2xl mx-auto">
            Discover breathtaking domestic getaways and unforgettable international adventures. Your next journey starts here.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="bg-black border border-zinc-800 rounded-lg px-5 py-4 mb-8 flex flex-col sm:flex-row items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300 mb-4 sm:mb-0 uppercase tracking-widest">Tours</h2>
          <div className="flex space-x-2">
            {(['all', 'domestic', 'international'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  filter === type
                    ? 'bg-white text-black'
                    : 'bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent hover:border-zinc-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Tour Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-24 border border-zinc-800 rounded-xl bg-zinc-950">
            <MapPin className="mx-auto h-12 w-12 text-zinc-600" />
            <h3 className="mt-4 text-sm font-medium text-zinc-300">No tours found</h3>
            <p className="mt-1 text-sm text-zinc-500">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-black border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors flex flex-col group">
                <div className="relative h-48 border-b border-zinc-800 overflow-hidden">
                  <img
                    key={tour.imageUrl || tour.id}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={tour.imageUrl || `https://picsum.photos/seed/${tour.id}/800/600`}
                    alt={tour.title}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-zinc-700 px-3 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wide">
                    {tour.destinationType}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{tour.title}</h3>
                  <div className="flex items-center text-zinc-400 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{tour.location}</span>
                  </div>
                  <p className="text-zinc-500 text-sm line-clamp-3 mb-6 flex-1">
                    {tour.description}
                  </p>
                  <div className="border-t border-zinc-800 pt-4 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-zinc-400 text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(tour.startDate), 'MMM d')} - {format(new Date(tour.endDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-2xl font-bold text-white">
                        <DollarSign className="h-5 w-5 text-zinc-500" />
                        {tour.price}
                        <span className="text-sm font-normal text-zinc-500 ml-1">starting</span>
                      </div>
                      <Link
                        to={`/tour/${tour.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-black bg-white hover:bg-zinc-200 transition-colors"
                      >
                        View
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
