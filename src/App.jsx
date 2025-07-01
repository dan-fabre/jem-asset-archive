import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Upload, Download, Folder, Image, Video, User, Settings, Home, ArrowLeft, Plus, Tag, Calendar, Users, Eye, Trash2, Menu, X, LogOut } from 'lucide-react';

// Supabase configuration
const supabaseUrl = 'https://ddecrhfoxwikizwetpxy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZWNyaGZveHdpa2l6d2V0cHh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjgyNzMsImV4cCI6MjA2Njk0NDI3M30.tHxCd6wE7R7Yr1rwxtQFbSI_VPsp6y3xjRGEy-U5TwI';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
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

  // Fixed authentication useEffect - only one needed
  useEffect(() => {
    let isMounted = true;

    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            setCurrentView('login');
            setLoading(false);
          }
          return;
        }

        if (session?.user && isMounted) {
          console.log('Session found, getting profile...');
          try {
            await getProfile(session.user.id);
          } catch (profileError) {
            console.error('Error loading profile:', profileError);
            // Still set the user even if profile fails
            setCurrentUser(session.user);
            setCurrentView('dashboard');
          }
        } else if (isMounted) {
          setCurrentView('login');
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        if (isMounted) {
          setCurrentView('login');
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!isMounted) return;

       const getProfile = async (userId) => {
  try {
    console.log('Getting profile for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Profile query result:', { data, error });

    if (error) {
      console.error('Profile fetch error:', error);
      // If profile doesn't exist, create a basic one
      if (error.code === 'PGRST116') {
        console.log('No profile found, user needs to complete setup');
        setCurrentView('login');
        return;
      }
      throw error;
    }

    if (data) {
      console.log('Profile found:', data);
      setProfile(data);
      
      // Set the complete user object with profile data
      setCurrentUser({
        id: userId,
        email: data.email,
        name: data.name,
        role: data.role
      });
      
      if (data.status === 'active') {
        console.log('User is active, redirecting to dashboard');
        setCurrentView('dashboard');
      } else if (data.status === 'pending') {
        console.log('User is pending approval');
        setCurrentView('pending');
      } else {
        console.log('User status unknown:', data.status);
        setCurrentView('login');
      }
    } else {
      console.log('No profile data returned');
      setCurrentView('login');
    }
  } catch (error) {
    console.error('Error in getProfile:', error);
    // Don't throw - handle gracefully
    setCurrentUser(null);
    setProfile(null);
    setCurrentView('login');
  }
};

  const loadFolders = async () => {
    try {
      console.log('Loading folders...');
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
      console.log('Loaded folders:', data?.length || 0);
    } catch (error) {
      console.error('Error loading folders:', error);
      setFolders([]);
    }
  };

  const loadAssets = async () => {
    try {
      console.log('Loading assets...');
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          profiles:uploaded_by(name),
          folders:folder_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
      console.log('Loaded assets:', data?.length || 0);
    } catch (error) {
      console.error('Error loading assets:', error);
      setAssets([]);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const activeUsers = (data || []).filter(user => user.status === 'active');
      const pending = (data || []).filter(user => user.status === 'pending');
      
      setUsers(activeUsers);
      setPendingUsers(pending);
      console.log('Loaded users:', activeUsers.length, 'pending:', pending.length);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setPendingUsers([]);
    }
  };

  // Authentication functions
  const handleSignUp = async (email, password, name) => {
    try {
      setError('');
      console.log('Signing up user:', email);
      
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
        console.log('User signed up successfully');
        // The auth state change will handle the rest
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message);
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      setError('');
      console.log('Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      console.log('User signed in successfully');
      // The auth state change will handle the rest
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setCurrentUser(null);
      setProfile(null);
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
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const approveUser = async (userId) => {
    try {
      console.log('Approving user:', userId);
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) throw error;
      
      await loadUsers();
      console.log('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
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

  // Asset and folder functions
  const createFolder = async (name, type, tags, parentId = null) => {
    try {
      console.log('Creating folder:', name);
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
      
      await loadFolders();
      console.log('Folder created successfully');
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  };

  const uploadFile = async (file, folderId, tags) => {
    try {
      console.log('Uploading file:', file.name, 'to folder:', folderId);
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
      
      await loadAssets();
      console.log('File uploaded successfully');
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const downloadFile = async (filePath, fileName) => {
    try {
      console.log('Downloading file:', filePath);
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
      console.log('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Filter functions with safety checks
  const filteredAssets = (assets || []).filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFolder = selectedFolder ? asset.folder_id === selectedFolder.id : true;
    return matchesSearch && matchesFolder;
  });

  const filteredFolders = (folders || []).filter(folder => {
    const matchesSearch = folder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (folder.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && !folder.parent_id;
  });

  // Loading screen
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
                className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-pink-500 transition-colors"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-pink-500 hover:text-pink-600"
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

            {profile?.role === 'admin' && (
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

  // Upload modal component
  const UploadModal = () => {
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploadTags, setUploadTags] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
      e.preventDefault();
      if (uploadFiles.length === 0) return;

      setUploading(true);
      try {
        for (const file of uploadFiles) {
          await uploadFile(file, selectedFolder?.id, uploadTags);
        }
        setShowUpload(false);
        setUploadFiles([]);
        setUploadTags('');
      } catch (error) {
        console.error('Upload failed:', error);
        setError('Upload failed: ' + error.message);
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upload Assets</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleUpload} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Files</label>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
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
            
            {selectedFolder && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  Files will be uploaded to: <span className="font-medium">{selectedFolder.name}</span>
                </p>
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={uploading}
              >
                Cancel
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
          
          {profile?.role === 'admin' && (
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
        {currentView === 'admin' && profile?.role === 'admin' && <AdminPanel />}
      </main>
      
      {showUpload && <UploadModal />}
    </div>
  );
}

export default App;
