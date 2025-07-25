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
  const [authInitialized, setAuthInitialized] = useState(false);

// Check if user is logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setCurrentView('login');
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Initial session found:', session.user.email);
          await getProfile(session.user.id);
        } else {
          console.log('No initial session found');
          setCurrentView('login');
          setLoading(false);
        }
      } catch (error) {
        console.error('Session initialization failed:', error);
        setCurrentView('login');
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          await getProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setCurrentView('login');
          setFolders([]);
          setAssets([]);
          setUsers([]);
          setPendingUsers([]);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getProfile = async (userId) => {
    try {
      console.log('Getting profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }

      console.log('Profile data:', data);

      if (data && data.status === 'active') {
        setCurrentUser(data);
        setCurrentView('dashboard');
        
        // Load folders and assets immediately after successful profile load
        console.log('Loading folders and assets...');
        await loadFolders();
        await loadAssets();
        
        // Load users if admin
        if (data.role === 'admin') {
          await loadUsers();
        }
        
        setLoading(false);
      } else if (data && data.status === 'pending') {
        setCurrentView('pending');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Error loading profile');
      setLoading(false);
    }
  };

  const loadFoldersSafe = async () => {
    try {
      console.log('📁 Loading folders...');
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('📁 Folder query error:', error);
        return;
      }
      
      setFolders(data || []);
      console.log('✅ Folders loaded:', (data || []).length);
    } catch (error) {
      console.error('💥 loadFoldersSafe error:', error);
      setFolders([]);
    }
  };

  const loadAssetsSafe = async () => {
    try {
      console.log('🖼️ Loading assets...');
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          profiles:uploaded_by(name),
          folders:folder_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🖼️ Asset query error:', error);
        return;
      }
      
      setAssets(data || []);
      console.log('✅ Assets loaded:', (data || []).length);
    } catch (error) {
      console.error('💥 loadAssetsSafe error:', error);
      setAssets([]);
    }
  };

  const loadUsersSafe = async () => {
    try {
      console.log('👥 Loading users...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('👥 User query error:', error);
        return;
      }
      
      const activeUsers = (data || []).filter(user => user.status === 'active');
      const pending = (data || []).filter(user => user.status === 'pending');
      
      setUsers(activeUsers);
      setPendingUsers(pending);
      console.log('✅ Users loaded:', activeUsers.length, 'pending:', pending.length);
    } catch (error) {
      console.error('💥 loadUsersSafe error:', error);
      setUsers([]);
      setPendingUsers([]);
    }
  };

  // Authentication functions with enhanced error handling
  const handleSignUp = async (email, password, name) => {
    try {
      setError('');
      setLoading(true);
      console.log('📝 Signing up user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        console.log('✅ User signed up successfully');
      }
    } catch (error) {
      console.error('❌ Error signing up:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      console.log('🔑 Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      console.log('✅ User signed in successfully');
    } catch (error) {
      console.error('❌ Error signing in:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out user');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setCurrentUser(null);
      setCurrentView('login');
      setFolders([]);
      setAssets([]);
      setUsers([]);
      setPendingUsers([]);
      setSelectedFolder(null);
      setNavigationStack([]);
      setSearchTerm('');
      setShowUpload(false);
      setShowMobileMenu(false);
      setError('');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      console.log('✅ Approving user:', userId);
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) throw error;
      
      await loadUsersSafe();
      console.log('✅ User approved successfully');
    } catch (error) {
      console.error('❌ Error approving user:', error);
      setError('Failed to approve user');
    }
  };

  // Navigation functions
  const navigateTo = (view, data = null) => {
    setNavigationStack([...navigationStack, { view: currentView, data: selectedFolder }]);
    setCurrentView(view);
    if (data) setSelectedFolder(data);
  };

  const goBack = () => {
    if (navigationStack.length > 0) {
      const previous = navigationStack[navigationStack.length - 1];
      setNavigationStack(navigationStack.slice(0, -1));
      setCurrentView(previous.view);
      setSelectedFolder(previous.data);
    }
  };

  const goHome = () => {
    setCurrentView('dashboard');
    setSelectedFolder(null);
    setNavigationStack([]);
    setShowMobileMenu(false);
  };

  // Asset and folder functions with error handling
  const createFolder = async (name, type, tags, parentId = null) => {
    try {
      console.log('📁 Creating folder:', name);
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name,
          type,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          parent_id: parentId,
          created_by: currentUser.id,
          date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadFoldersSafe();
      console.log('✅ Folder created successfully');
      return data;
    } catch (error) {
      console.error('❌ Error creating folder:', error);
      setError('Failed to create folder');
      throw error;
    }
  };

  const uploadFile = async (file, folderId, tags) => {
    try {
      console.log('📤 Uploading file:', file.name, 'to folder:', folderId);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folderId || 'general'}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create asset record in database
      const { data, error } = await supabase
        .from('assets')
        .insert([{
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          folder_id: folderId,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          uploaded_by: currentUser.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadAssetsSafe();
      console.log('✅ File uploaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      setError('Failed to upload file');
      throw error;
    }
  };

  const downloadFile = async (filePath, fileName) => {
    try {
      console.log('📥 Downloading file:', filePath);
      const { data, error } = await supabase.storage
        .from('assets')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('✅ File downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      setError('Failed to download file');
    }
  };

  // Safe filter functions
  const filteredAssets = (assets || []).filter(asset => {
    try {
      const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (asset.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFolder = selectedFolder ? asset.folder_id === selectedFolder.id : true;
      return matchesSearch && matchesFolder;
    } catch (error) {
      console.error('Filter error:', error);
      return false;
    }
  });

  const filteredFolders = (folders || []).filter(folder => {
    try {
      const matchesSearch = folder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (folder.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch && !folder.parent_id;
    } catch (error) {
      console.error('Filter error:', error);
      return false;
    }
  });

  // Enhanced loading screen with timeout protection
  if (loading || !authInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">jem</span>
          </div>
          <p className="text-gray-600">Loading...</p>
          {loading && (
            <button 
              onClick={() => {
                setLoading(false);
                setCurrentView('login');
                setAuthInitialized(true);
              }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Taking too long? Click here to continue
            </button>
          )}
        </div>
      </div>
    );
  }

  // Login/Signup Screen
  const AuthScreen = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (isSignUp) {
        await handleSignUp(formData.email, formData.password, formData.name);
      } else {
        await handleSignIn(formData.email, formData.password);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold">jem</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Archive</h1>
            <p className="text-gray-600">
              {isSignUp ? 'Create your account' : 'Sign in to access your media library'}
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              <button 
                onClick={() => setError('')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                    placeholder="Your Name"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  placeholder="your.email@jemhr.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-pink-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-pink-500 hover:text-pink-600"
                disabled={loading}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Pending approval screen
  const PendingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <User className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Pending</h1>
        <p className="text-gray-600 mb-6">
          Your account has been created and is waiting for admin approval. You'll receive an email once approved.
        </p>
        <button
          onClick={handleSignOut}
          className="text-pink-500 hover:text-pink-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  // Header component
  const Header = () => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-2 rounded-lg">
                <span className="text-sm font-bold">jem</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 hidden sm:block">Asset Archive</span>
            </div>
            
            {navigationStack.length > 0 && (
              <button
                onClick={goBack}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={goHome}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Home className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-pink-600" />
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{currentUser?.name}</span>
            </div>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  // Search bar component
  const SearchBar = () => (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <input
        type="text"
        placeholder="Search assets, folders, or tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
      />
    </div>
  );

  // Dashboard component
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-pink-400 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-500 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Assets</span>
        </button>
      </div>

      <SearchBar />

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {(assets || []).slice(0, 3).map(asset => (
            <div key={asset.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="p-2 bg-pink-100 rounded-lg">
                {asset.mime_type?.includes('video') ? 
                  <Video className="h-4 w-4 text-pink-600" /> : 
                  <Image className="h-4 w-4 text-pink-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                <p className="text-xs text-gray-500">
                  Uploaded by {asset.profiles?.name || 'Unknown'} • {new Date(asset.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {asset.file_size ? `${(asset.file_size / (1024 * 1024)).toFixed(1)}MB` : ''}
                </span>
                <button 
                  onClick={() => downloadFile(asset.file_path, asset.name)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {(assets || []).length === 0 && (
            <p className="text-gray-500 text-center py-4">No assets uploaded yet</p>
          )}
        </div>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFolders.map(folder => {
          const folderAssets = (assets || []).filter(asset => asset.folder_id === folder.id);
          return (
            <div
              key={folder.id}
              onClick={() => navigateTo('folder', folder)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Folder className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500">
                  {folder.date ? new Date(folder.date).toLocaleDateString() : ''}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{folder.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{folderAssets.length} assets</p>
              
              <div className="flex flex-wrap gap-1">
                {(folder.tags || []).slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                    {tag}
                  </span>
                ))}
                {(folder.tags || []).length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                    +{(folder.tags || []).length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        {filteredFolders.length === 0 && (
          <div className="col-span-full text-center py-8">
            <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No folders found</p>
          </div>
        )}
      </div>
    </div>
  );

  // Folder view component
  const FolderView = () => {
    const folderAssets = (assets || []).filter(asset => asset.folder_id === selectedFolder?.id);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedFolder?.name}</h1>
            <p className="text-gray-600">
              {selectedFolder?.date ? new Date(selectedFolder.date).toLocaleDateString() : ''} • {folderAssets.length} assets
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-pink-400 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-500 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Upload to Folder</span>
          </button>
        </div>

        <SearchBar />

        {/* Assets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {asset.mime_type?.includes('video') ? 
                  <Video className="h-12 w-12 text-gray-400" /> : 
                  <Image className="h-12 w-12 text-gray-400" />
                }
              </div>
              
              <div className="p-4">
                <h4 className="font-medium text-gray-900 text-sm mb-2 truncate">{asset.name}</h4>
                <p className="text-xs text-gray-500 mb-3">
                  {asset.profiles?.name || 'Unknown'} • {new Date(asset.created_at).toLocaleDateString()} • 
                  {asset.file_size ? ` ${(asset.file_size / (1024 * 1024)).toFixed(1)}MB` : ''}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {(asset.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors">
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </button>
                  <button 
                    onClick={() => downloadFile(asset.file_path, asset.name)}
                    className="flex items-center justify-center bg-pink-100 text-pink-700 px-3 py-2 rounded-md hover:bg-pink-200 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No assets in this folder yet</p>
          </div>
        )}
      </div>
    );
  };

// Replace your UploadModal component with this:
const UploadModal = () => {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTags, setNewFolderTags] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    try {
      const newFolder = await createFolder(newFolderName, 'media', newFolderTags);
      setSelectedFolderId(newFolder.id);
      setSelectedFolderName(newFolder.name);
      setShowCreateFolder(false);
      setNewFolderName('');
      setNewFolderTags('');
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to create folder:', error);
      setError('Failed to create folder: ' + error.message);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleFolderSelect = (folder) => {
    setSelectedFolderId(folder.id);
    setSelectedFolderName(folder.name);
    setCurrentStep(2);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0 || !selectedFolderId) return;

    setUploading(true);
    try {
      for (const file of uploadFiles) {
        await uploadFile(file, selectedFolderId, uploadTags);
      }
      // Reset and close
      setShowUpload(false);
      setUploadFiles([]);
      setUploadTags('');
      setCurrentStep(1);
      setSelectedFolderId(null);
      setSelectedFolderName('');
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const goBackToStep1 = () => {
    setCurrentStep(1);
    setSelectedFolderId(null);
    setSelectedFolderName('');
  };

  const closeModal = () => {
    setShowUpload(false);
    setUploadFiles([]);
    setUploadTags('');
    setCurrentStep(1);
    setSelectedFolderId(null);
    setSelectedFolderName('');
    setShowCreateFolder(false);
    setNewFolderName('');
    setNewFolderTags('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload Assets</h2>
              <p className="text-sm text-gray-500">
                Step {currentStep} of 2: {currentStep === 1 ? 'Choose Folder' : 'Upload Files'}
              </p>
            </div>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Step 1: Choose/Create Folder */}
        {currentStep === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Select a folder for your assets</h3>
              
              {/* Existing Folders */}
              {folders.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Choose existing folder:</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {folders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => handleFolderSelect(folder)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Folder className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{folder.name}</p>
                            {folder.tags && folder.tags.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Tags: {folder.tags.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              {folders.length > 0 && (
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-sm text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              )}

              {/* Create New Folder */}
              {!showCreateFolder ? (
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Plus className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Create new folder</span>
                </button>
              ) : (
                <form onSubmit={handleCreateFolder} className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700">Create new folder:</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Folder Name</label>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="e.g. Q4 Campaign, Team Photos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tags (optional)</label>
                    <input
                      type="text"
                      value={newFolderTags}
                      onChange={(e) => setNewFolderTags(e.target.value)}
                      placeholder="marketing, social, campaign"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-pink-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                        setNewFolderTags('');
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingFolder || !newFolderName.trim()}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-pink-400 text-white px-3 py-2 rounded-md hover:from-pink-600 hover:to-pink-500 transition-colors disabled:opacity-50"
                    >
                      {creatingFolder ? 'Creating...' : 'Create & Continue'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Upload Files */}
        {currentStep === 2 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={goBackToStep1}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-md font-medium text-gray-900">Upload to: {selectedFolderName}</h3>
                <p className="text-sm text-gray-500">Choose files and add tags</p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Files</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Select images or videos to upload</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="customer, interview, testimonial"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={goBackToStep1}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={uploading || uploadFiles.length === 0}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-pink-400 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-500 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

  // Admin panel component
  const AdminPanel = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      
      {/* Pending Approvals */}
      {(pendingUsers || []).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">Pending User Approvals</h2>
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">
                    {user.email} • Requested {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => approveUser(user.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* User Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Users</h2>
        <div className="space-y-3">
          {(users || []).map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email} • {user.role || 'user'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role || 'user'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Storage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-pink-600 mb-2">{(assets || []).length}</div>
          <div className="text-gray-600">Total Assets</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">{(folders || []).length}</div>
          <div className="text-gray-600">Active Folders</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">{(users || []).length}</div>
          <div className="text-gray-600">Active Users</div>
        </div>
      </div>
    </div>
  );

  // Mobile menu component
  const MobileMenu = () => (
    <div className={`lg:hidden fixed inset-0 z-50 ${showMobileMenu ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)} />
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Menu</span>
            <button onClick={() => setShowMobileMenu(false)}>
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <button
            onClick={goHome}
            className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg"
          >
            <Home className="h-5 w-5 text-gray-400" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => { setShowUpload(true); setShowMobileMenu(false); }}
            className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg"
          >
            <Upload className="h-5 w-5 text-gray-400" />
            <span>Upload Assets</span>
          </button>
          
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => { navigateTo('admin'); setShowMobileMenu(false); }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg"
            >
              <Settings className="h-5 w-5 text-gray-400" />
              <span>Admin Panel</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </div>
  );

  // Main render logic
  if (currentView === 'pending') {
    return <PendingScreen />;
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <MobileMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'folder' && <FolderView />}
        {currentView === 'admin' && currentUser.role === 'admin' && <AdminPanel />}
      </main>
      
      {showUpload && <UploadModal />}
      
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


