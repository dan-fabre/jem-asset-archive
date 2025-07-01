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
  const [currentView, setCurrentView] = useState('login');
  const [folders, setFolders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [navigationStack, setNavigationStack] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [error, setError] = useState('');

  // Check if user is logged in on mount
  useEffect(() => {
    console.log('App mounting, calling getSession...');
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (session?.user) {
          await getProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setCurrentView('login');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getSession = async () => {
    try {
      console.log('Getting session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session result:', { session: session?.user?.email, error });
      
      if (session?.user) {
        console.log('User found, getting profile...');
        await getProfile(session.user.id);
      } else {
        console.log('No session found, showing login');
        setCurrentView('login');
      }
    } catch (error) {
      console.error('Error getting session:', error);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

const getProfile = async (userId) => {
  try {
    console.log('Getting profile for user:', userId);
    console.log('About to query profiles table...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Raw query result:', { data, error });
    console.log('Data details:', data);
    console.log('Error details:', error);

    if (error) {
      console.error('Profile query error:', error);
      throw error;
    }

    if (data && data.status === 'active') {
      console.log('Active user found, setting up dashboard');
      setCurrentUser(data);
      setCurrentView('dashboard');
    } else if (data && data.status === 'pending') {
      console.log('Pending user found');
      setCurrentView('pending');
    } else {
      console.log('No profile found or inactive, data was:', data);
      setCurrentView('login');
    }
  } catch (error) {
    console.error('Error in getProfile:', error);
    setError('Error loading profile: ' + error.message);
    setCurrentView('login');
  }
};

  // Just show a simple test for now
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">jem</span>
          </div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-500 mt-2">Check console for debug info</p>
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
        <p className="text-gray-600 mb-8">Debug Mode - Check Console</p>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
          <p className="text-sm text-gray-600">
            Current View: {currentView}<br/>
            Current User: {currentUser?.email || 'None'}<br/>
            Loading: {loading.toString()}<br/>
            Error: {error || 'None'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
