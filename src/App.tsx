import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Star, ChevronLeft, Heart, MoreHorizontal, Home, Compass, User, Bell } from 'lucide-react';

const destinations = [
  {
    id: 1,
    title: 'St. Regis Bora Bora',
    location: 'French Polynesia',
    rating: 4.8,
    price: 25,
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=80&w=800&auto=format&fit=crop',
    description: 'Bora Bora is an island in the Leeward group of the Society Islands of French Polynesia, an overseas collectivity of France in the Pacific Ocean. The island, located about 230 kilometres (143 miles) northwest of Papeete, is surrounded by a lagoon and a barrier reef.',
    category: 'Beach'
  },
  {
    id: 2,
    title: 'Rialto bridge',
    location: 'Venice, Italy',
    rating: 4.9,
    price: 35,
    image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=800&auto=format&fit=crop',
    description: 'The Rialto Bridge is the oldest of the four bridges spanning the Grand Canal in Venice, Italy. Connecting the sestieri (districts) of San Marco and San Polo, it has been rebuilt several times since its first construction as a pontoon bridge in 1181.',
    category: 'City'
  },
  {
    id: 3,
    title: 'Koh Samui',
    location: 'Thailand',
    rating: 4.7,
    price: 20,
    image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?q=80&w=800&auto=format&fit=crop',
    description: 'Koh Samui, Thailand’s second largest island, lies in the Gulf of Thailand off the east coast of the Kra Isthmus. It\'s known for its palm-fringed beaches, coconut groves and dense, mountainous rainforest, plus luxury resorts and posh spas.',
    category: 'Beach'
  }
];

const categories = ['Beach', 'Mountain', 'Desert', 'City', 'Forest'];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [selectedDest, setSelectedDest] = useState(null);

  return (
    <div className="w-full max-w-md mx-auto h-[100dvh] bg-gray-50 overflow-hidden relative font-sans shadow-2xl sm:rounded-[2.5rem] sm:h-[850px] sm:my-8 border-4 border-gray-900">
      <AnimatePresence mode="wait">
        {currentScreen === 'onboarding' && (
          <OnboardingScreen key="onboarding" onNext={() => setCurrentScreen('home')} />
        )}
        {currentScreen === 'home' && (
          <HomeScreen 
            key="home" 
            onSelect={(dest) => {
              setSelectedDest(dest);
              setCurrentScreen('detail');
            }} 
          />
        )}
        {currentScreen === 'detail' && selectedDest && (
          <DetailScreen 
            key="detail" 
            dest={selectedDest} 
            onBack={() => setCurrentScreen('home')} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OnboardingScreen({ onNext }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full relative"
    >
      <img 
        src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1000&auto=format&fit=crop" 
        alt="Onboarding Background" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white flex flex-col items-center text-center">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-4 tracking-tight"
        >
          Explore your journey only with us
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 mb-8 text-sm leading-relaxed"
        >
          All your vacations destinations are here. enjoy your holiday.
        </motion.p>
        <motion.button 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={onNext}
          className="w-full bg-white text-black font-semibold py-4 rounded-full text-lg hover:bg-gray-100 transition-colors active:scale-95"
        >
          Get Started
        </motion.button>
      </div>
    </motion.div>
  );
}

function HomeScreen({ onSelect }) {
  const [activeCategory, setActiveCategory] = useState('Beach');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full bg-gray-50 flex flex-col"
    >
      <div className="p-6 flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-gray-500 text-sm mb-1">Good Morning,</p>
            <h2 className="text-xl font-bold text-gray-900">aagus pambudi</h2>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Kintamani river, Kecak..." 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recommendation */}
        <div className="mt-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recommendation</h3>
            <button className="text-blue-600 text-sm font-medium">View all</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6">
            {destinations.map(dest => (
              <motion.div 
                key={dest.id}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(dest)}
                className="min-w-[240px] bg-white rounded-3xl p-3 shadow-sm cursor-pointer"
              >
                <div className="relative h-40 rounded-2xl overflow-hidden mb-3">
                  <img src={dest.image} alt={dest.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold">{dest.rating}</span>
                  </div>
                </div>
                <div className="px-2 pb-1">
                  <h4 className="font-bold text-gray-900 mb-1">{dest.title}</h4>
                  <div className="flex items-center text-gray-500 text-xs gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{dest.location}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Nearby */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Nearby from you</h3>
            <button className="text-blue-600 text-sm font-medium">View all</button>
          </div>
          
          <div className="flex flex-col gap-4">
            {destinations.slice(1).map(dest => (
              <motion.div 
                key={dest.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(dest)}
                className="bg-white rounded-2xl p-3 shadow-sm flex gap-4 items-center cursor-pointer"
              >
                <img src={dest.image} alt={dest.title} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{dest.title}</h4>
                  <div className="flex items-center text-gray-500 text-xs gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{dest.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold">{dest.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center pb-8 sm:pb-4">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <Compass className="w-6 h-6" />
          <span className="text-[10px] font-medium">Discover</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <Bell className="w-6 h-6" />
          <span className="text-[10px] font-medium">Alerts</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </motion.div>
  );
}

function DetailScreen({ dest, onBack }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full bg-white flex flex-col relative"
    >
      {/* Image Header */}
      <div className="relative h-[45%] w-full">
        <img src={dest.image} alt={dest.title} className="w-full h-full object-cover" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-3">
            <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white -mt-8 rounded-t-[2rem] relative z-20 px-6 pt-8 pb-24 overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{dest.title}</h2>
            <div className="flex items-center text-gray-500 text-sm gap-1">
              <MapPin className="w-4 h-4" />
              <span>{dest.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-700">{dest.rating}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {dest.description}
        </p>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">More images</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {[1, 2, 3, 4].map((i) => (
              <img 
                key={i}
                src={`https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=80&w=200&auto=format&fit=crop&sig=${i}`} 
                alt="Thumbnail" 
                className="w-20 h-20 rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-xs mb-1">Price</p>
          <p className="text-2xl font-bold text-blue-600">${dest.price} <span className="text-sm font-normal text-gray-500">/person</span></p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors active:scale-95">
          Book now
        </button>
      </div>
    </motion.div>
  );
}
