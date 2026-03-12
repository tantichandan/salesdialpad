'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthWrapper } from '@/components/auth-wrapper';
import {
  Phone, PhoneIncoming, PhoneOutgoing, Calendar, Search as SearchIcon,
  ChevronLeft, Volume2
} from 'lucide-react';

interface Recording {
  sid: string;
  duration: number;
  dateCreated: Date;
}

interface Call {
  sid: string;
  from: string;
  to: string;
  status: string;
  duration: number;
  direction: 'inbound' | 'outbound';
  dateCreated: Date;
}

export default function SearchPage() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<'all' | 'calls' | 'recordings'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<{ calls: Call[]; recordings: Recording[] }>({ calls: [], recordings: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    setLoading(true);
    setResults({ calls: [], recordings: [] });

    try {
      const queries = [];

      // Search calls if needed
      if (searchType === 'all' || searchType === 'calls') {
        queries.push(
          fetch('/api/calls/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate }),
          }).then(r => r.json())
        );
      }

      // Search recordings if needed
      if (searchType === 'all' || searchType === 'recordings') {
        queries.push(
          fetch('/api/recording/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate }),
          }).then(r => r.json())
        );
      }

      const [callsData, recordingsData] = await Promise.all(queries.length === 2 ? queries : [...queries, Promise.resolve([])]);

      setResults({
        calls: (searchType === 'all' || searchType === 'calls') ? callsData : [],
        recordings: (searchType === 'all' || searchType === 'recordings') ? recordingsData : [],
      });
      setSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching records');
    } finally {
      setLoading(false);
    }
  };

  const totalResults = results.calls.length + results.recordings.length;

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Search Records</h1>
                <p className="text-slate-400 mt-1">Find calls and recordings by date</p>
              </div>
            </div>
          </div>

          {/* Search Panel */}
          <Card className="mb-8 p-6 bg-slate-800 border-slate-700">
            <div className="space-y-6">
              {/* Search Type */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Search Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['all', 'calls', 'recordings'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSearchType(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        searchType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {type === 'all' ? 'All Records' : type === 'calls' ? 'Calls Only' : 'Recordings Only'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={loading || !startDate}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <SearchIcon className="w-4 h-4" />
                {loading ? 'Searching...' : 'Search Records'}
              </Button>
            </div>
          </Card>

          {/* Results */}
          {searched && (
            <div className="space-y-6">
              <div className="text-slate-300">
                Found <span className="font-bold text-white">{totalResults}</span> records
              </div>

              {/* Calls Results */}
              {results.calls.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Calls ({results.calls.length})
                  </h2>
                  <div className="grid gap-3">
                    {results.calls.map((call) => (
                      <Card key={call.sid} className="p-4 bg-slate-800 border-slate-700 hover:border-blue-600 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {call.direction === 'inbound' ? (
                                <PhoneIncoming className="w-5 h-5 text-green-400" />
                              ) : (
                                <PhoneOutgoing className="w-5 h-5 text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">
                                  {call.direction === 'inbound' ? 'From' : 'To'}: {call.direction === 'inbound' ? call.from : call.to}
                                </span>
                                <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                                  {call.status}
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                Duration: {call.duration}s · {new Date(call.dateCreated).toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">ID: {call.sid}</div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Recordings Results */}
              {results.recordings.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Recordings ({results.recordings.length})
                  </h2>
                  <div className="grid gap-3">
                    {results.recordings.map((rec) => (
                      <Card key={rec.sid} className="p-4 bg-slate-800 border-slate-700 hover:border-blue-600 transition-colors">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">
                                Recording · {new Date(rec.dateCreated).toLocaleString()}
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                Duration: {rec.duration}s
                              </div>
                              <div className="text-xs text-slate-500 mt-1">ID: {rec.sid}</div>
                            </div>
                          </div>
                          <audio
                            controls
                            src={`/api/recording/stream/${rec.sid}`}
                            className="w-full h-8"
                            style={{ filter: 'invert(0.85) hue-rotate(180deg)' }}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {searched && totalResults === 0 && (
                <Card className="p-8 bg-slate-800 border-slate-700 text-center">
                  <p className="text-slate-400">No records found for the selected date range.</p>
                </Card>
              )}
            </div>
          )}

          {!searched && (
            <Card className="p-8 bg-slate-800 border-slate-700 text-center">
              <p className="text-slate-400">Use the search panel above to find calls and recordings by date</p>
            </Card>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
}
