import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const categories = ['All', 'Hardware', 'Software', 'Training'];

const products = [
  {
    id: 'elm327',
    name: 'ELM327 OBD2 Dongle',
    category: 'Hardware',
    price: '$24.99',
    rating: 4.5,
    image: '🔌',
    description: 'Bluetooth OBD-II adapter for all vehicles since 1996.',
  },
  {
    id: 'obd-cable',
    name: 'OBD-II USB Cable',
    category: 'Hardware',
    price: '$19.99',
    rating: 4.3,
    image: '🔧',
    description: 'High-speed FTDI-based USB OBD2 cable for diagnostics.',
  },
  {
    id: 'pro-1mo',
    name: 'Pro Subscription - 1 Month',
    category: 'Software',
    price: '$4.99',
    rating: 4.7,
    image: '⭐',
    description: 'Full Pro features for one month. Auto-renewal.',
  },
  {
    id: 'pro-6mo',
    name: 'Pro Subscription - 6 Months',
    category: 'Software',
    price: '$24.99',
    rating: 4.8,
    image: '🌟',
    description: 'Save 17% with 6-month Pro access.',
  },
  {
    id: 'pro-12mo',
    name: 'Pro Subscription - 12 Months',
    category: 'Software',
    price: '$39.99',
    rating: 4.9,
    image: '💎',
    description: 'Best value — 12 months of Pro at 33% off.',
  },
  {
    id: 'course',
    name: 'ECU Diagnostics Course',
    category: 'Training',
    price: '$49.99',
    rating: 4.6,
    image: '📚',
    description: 'Complete video course on OBD-II & ECU diagnostics.',
  },
];

export default function StorePage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setActivePage('store');
  }, [setActivePage]);

  const filtered = filter === 'All' ? products : products.filter((p) => p.category === filter);

  const handleBuy = (product) => {
    alert(`🛒 "${product.name}" added to cart!\nPrice: ${product.price}`);
  };

  return (
    <div className="animate-in space-y-5">
      <h2 className="text-lg font-bold text-ecu-bright">ECU Store</h2>

      {/* Category Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === cat
                ? 'bg-ecu-accent/20 text-ecu-accent border-ecu-accent/40'
                : 'bg-ecu-surface text-ecu-muted border-ecu-border hover:border-ecu-accent hover:text-ecu-bright'
            }`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="glass-card flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="text-3xl w-12 h-12 flex items-center justify-center bg-ecu-surface rounded-xl">
                {product.image}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-ecu-bright leading-tight">{product.name}</h3>
                <p className="text-xs text-ecu-muted mt-1 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ecu-surface text-ecu-muted border border-ecu-border">
                    {product.category}
                  </span>
                  <span className="text-xs text-ecu-amber">★ {product.rating}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-ecu-border">
              <span className="text-lg font-bold text-ecu-bright">{product.price}</span>
              <button className="btn-primary text-sm" onClick={() => handleBuy(product)}>
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
