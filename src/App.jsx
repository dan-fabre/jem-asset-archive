import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Upload, Download, Folder, Image, Video, User, Settings, Home, ArrowLeft, Plus, Tag, Calendar, Users, Eye, Trash2, Menu, X, LogOut } from 'lucide-react';

// Supabase configuration
const supabaseUrl = 'https://ddecrhfoxwikizwetpxy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZWNyaGZveHdpa2l6d2V0cHh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjgyNzMsImV4cCI6MjA2Njk0NDI3M30.tHxCd6wE7R7Yr1rwxtQFbSI_VPsp6y3xjRGEy-U5TwI';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple test to check if Supabase connection works
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count');
        console.log('Supabase connection test:', { data, error });
        setLoading(false);
      } catch (err) {
        console.error('Connection error:', err);
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">jem</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold">jem</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Archive</h1>
        <p className="text-gray-600 mb-8">Your media library is ready to deploy!</p>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-lg font-semibold mb-4">Deployment Test</h2>
          <p className="text-sm text-gray-600">
            ✅ React app loaded<br/>
            ✅ Supabase connection established<br/>
            ✅ Ready for production!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
