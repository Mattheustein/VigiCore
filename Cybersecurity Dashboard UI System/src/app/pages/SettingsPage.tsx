import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Settings, Shield, Bell, Database, Users, User as UserIcon, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileData, setProfileData] = useState({ fullName: '', username: '', password: '' });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ fullName: '', username: '', password: '', role: 'Analyst' });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState({ fullName: '', role: 'Analyst', password: '' });

  useEffect(() => {
    const fetchUser = () => {
      const user = AuthService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setProfileData({ fullName: user.fullName || '', username: user.username, password: '' });
      }
      if (user?.role === 'Super Admin') {
        setUsersList(AuthService.getUsers());
      }
    };
    fetchUser();
    window.addEventListener('authChange', fetchUser);
    return () => window.removeEventListener('authChange', fetchUser);
  }, []);

  const handleProfileUpdate = async () => {
    if (!profileData.username) return;
    const updatePayload: any = { username: profileData.username, fullName: profileData.fullName };
    if (profileData.password) updatePayload.password = profileData.password;
    await AuthService.updateProfile(updatePayload);
    alert('Profile updated successfully!');
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return alert('Username and password required');
    const res = await AuthService.addUser(newUser);
    if (res.success) {
      setUsersList(AuthService.getUsers());
      setNewUser({ fullName: '', username: '', password: '', role: 'Analyst' });
      alert('User added successfully');
    } else {
      alert(res.error);
    }
  };

  const handleDeleteUser = (username: string) => {
    if (username === currentUser.username) return alert('Cannot delete yourself');
    const users = AuthService.getUsers().filter((u: any) => u.username !== username);
    localStorage.setItem('usersDatabase', JSON.stringify(users));
    setUsersList(users);
  };

  const handleStartEditUser = (user: any) => {
    setEditingUser(user.username);
    setEditUserData({ fullName: user.fullName || '', role: user.role, password: '' });
  };

  const handleSaveEditUser = async (username: string) => {
    const updatePayload: any = { username, fullName: editUserData.fullName, role: editUserData.role };
    if (editUserData.password) updatePayload.password = editUserData.password;

    const users = AuthService.getUsers();
    const index = users.findIndex((u: any) => u.username === username);
    if (index > -1) {
      users[index] = { ...users[index], ...updatePayload };
      AuthService.saveUsers(users);
      setUsersList(users);

      if (currentUser.username === username) {
        const { password: _, ...sessionInfo } = users[index];
        localStorage.setItem('currentUser', JSON.stringify(sessionInfo));
        window.dispatchEvent(new Event('authChange'));
      }
    }
    setEditingUser(null);
  };

  const tabs = [
    { id: 'Profile', icon: UserIcon, label: 'Edit Profile' },
    { id: 'Security', icon: Shield, label: 'Security' },
    { id: 'DataSources', icon: Database, label: 'Data Sources' },
  ];

  if (currentUser?.role === 'Super Admin') {
    tabs.push({ id: 'UserManagement', icon: Users, label: 'User Management' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your profile and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Card
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-4 cursor-pointer transition-all ${isActive
                  ? 'bg-gradient-to-r from-[#5B6AC2]/20 to-[#E91E63]/10 border-[#5B6AC2]/30'
                  : 'bg-[#131825] border-[#5B6AC2]/20 hover:border-[#5B6AC2]/40'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#E91E63]' : 'text-[#5B6AC2]'}`} />
                  <span className="text-white">{item.label}</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* PROFILE CONFIG */}
          {activeTab === 'Profile' && (
            <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#E91E63]" />
                Edit Profile
              </h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label className="text-white">Full Name</Label>
                  <Input
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Username</Label>
                  <Input
                    value={profileData.username}
                    disabled
                    className="bg-[#1A1F2E]/50 border-gray-600 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">New Password</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={profileData.password}
                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                    className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white"
                  />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-[#5B6AC2]/20">
                <Button onClick={handleProfileUpdate} className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90">
                  Save Profile Changes
                </Button>
              </div>
            </Card>
          )}

          {/* USER MANAGEMENT (SUPER ADMIN ONLY) */}
          {activeTab === 'UserManagement' && currentUser?.role === 'Super Admin' && (
            <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E91E63]" />
                User Management (Super Admin)
              </h3>

              <div className="space-y-6">
                <div className="bg-[#1A1F2E]/50 border border-[#5B6AC2]/20 rounded-lg p-4">
                  <h4 className="text-md font-medium text-white mb-4">Add New User</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Input placeholder="Full Name" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white" />
                    <Input placeholder="Username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white" />
                    <Input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white" />
                    <select
                      className="bg-[#131825] border border-[#5B6AC2]/30 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6AC2]"
                      value={newUser.role}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="Analyst">Analyst</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <Button onClick={handleAddUser} className="w-full bg-[#5B6AC2] hover:bg-[#4A59A8] text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create User
                  </Button>
                </div>

                <div>
                  <h4 className="text-md font-medium text-white mb-4">Current Users</h4>
                  <div className="space-y-3">
                    {usersList.map(u => (
                      <div key={u.username} className="flex items-center justify-between p-3 rounded-lg bg-[#1A1F2E]/30 border border-[#5B6AC2]/10">
                        {editingUser === u.username ? (
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 mr-4">
                            <Input placeholder="Full Name" value={editUserData.fullName} onChange={e => setEditUserData({ ...editUserData, fullName: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white h-8 text-sm" />
                            <Input type="password" placeholder="New Password (optional)" value={editUserData.password} onChange={e => setEditUserData({ ...editUserData, password: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white h-8 text-sm" />
                            <select
                              className="bg-[#131825] border border-[#5B6AC2]/30 text-white rounded-md px-2 h-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B6AC2]"
                              value={editUserData.role}
                              onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}
                            >
                              <option value="Analyst">Analyst</option>
                              <option value="Administrator">Administrator</option>
                              <option value="Super Admin">Super Admin</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <p className="text-white font-medium text-sm">{u.fullName || u.username}</p>
                            <p className="text-gray-400 text-xs">@{u.username} • {u.role}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {editingUser === u.username ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleSaveEditUser(u.username)} className="text-green-400 hover:text-green-300 hover:bg-green-500/10">
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white hover:bg-white/10">
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleStartEditUser(u)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {u.username !== currentUser.username && (
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.username)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECURITY CONFIG Placeholder */}
          {activeTab === 'Security' && (
            <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#5B6AC2]" />
                Security Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Auto-block Failed Attempts</Label>
                    <p className="text-sm text-gray-400 mt-1">Automatically block IPs after multiple failed login attempts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          )}

          {/* DATA SOURCES CONFIG Placeholder */}
          {activeTab === 'DataSources' && (
            <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#E91E63]" />
                Data Sources Configuration
              </h3>
              <p className="text-gray-400 text-sm">Configure Elasticsearch, Logstash, and internal sensor feeds here.</p>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
