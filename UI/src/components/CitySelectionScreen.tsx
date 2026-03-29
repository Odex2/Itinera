import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Loader2 } from 'lucide-react';

interface CitySelectionScreenProps {
    onSelect: (customCoords?: { lat: number; lng: number; name: string }) => void;
}

export default function CitySelectionScreen({ onSelect }: CitySelectionScreenProps) {
    const [cityQuery, setCityQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSearch = async () => {
        if (!cityQuery.trim()) return;

        setLoading(true);
        setErrorMsg('');
        try {
            // Use Mapbox Geocoding API to find the coordinates of the requested city
            const token = import.meta.env.VITE_MAPBOX_TOKEN;
            if (!token) throw new Error('Manca il token Mapbox');

            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityQuery)}.json?access_token=${token}&types=place,locality&limit=1`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Errore di connessione a Mapbox');

            const data = await res.json();
            if (!data.features || data.features.length === 0) {
                throw new Error('Città non trovata. Riprova con un nome più preciso.');
            }

            // Mapbox features return [lng, lat]
            const bestMatch = data.features[0];
            const [lng, lat] = bestMatch.center;
            const name = bestMatch.text;

            onSelect({ lat, lng, name });
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || 'Si è verificato un errore');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10 flex flex-col gap-8">
                <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
                        <Compass className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Dove andiamo?</h2>
                    <p className="text-cyan-100 text-sm">
                        Vuoi esplorare i dintorni della tua posizione attuale o visitare virtualmente un'altra città?
                    </p>
                </div>

                <div className="space-y-6">
                    {/* GPS Button */}
                    <button
                        onClick={() => onSelect()}
                        className="w-full relative group overflow-hidden bg-white hover:bg-slate-50 text-slate-900 py-4 px-6 rounded-2xl font-bold transition-all shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-1 flex items-center justify-center gap-3"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <Navigation className="w-5 h-5 text-cyan-500" />
                        <span className="relative z-10">Usa la mia posizione reale</span>
                    </button>

                    <div className="relative flex items-center justify-center before:absolute before:inset-0 before:flex before:items-center before:content-[''] after:absolute after:inset-0 after:flex after:items-center after:content-['']">
                        <div className="w-full border-t border-white/10" />
                        <span className="bg-transparent px-3 text-xs font-medium text-white/50 relative z-10">OPPURE</span>
                        <div className="w-full border-t border-white/10" />
                    </div>

                    {/* Custom City Input */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-cyan-100">
                            Scegli una città italiana o mondiale
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={cityQuery}
                                onChange={(e) => setCityQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="es. Roma, Madrid, Tokyo..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-medium"
                            />
                        </div>

                        {errorMsg && (
                            <p className="text-red-400 text-xs font-medium px-2">{errorMsg}</p>
                        )}

                        <button
                            onClick={handleSearch}
                            disabled={loading || !cityQuery.trim()}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-cyan-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Creazione portale...
                                </>
                            ) : (
                                'Vai a questa città'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
