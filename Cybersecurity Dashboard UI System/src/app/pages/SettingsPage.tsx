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
  const [profileData, setProfileData] = useState({ fullName: '', username: '', email: '', password: '' });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ fullName: '', username: '', email: '', password: '', role: 'Analyst' });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState({ fullName: '', email: '', role: 'Analyst', password: '' });

  useEffect(() => {
    const fetchUser = async () => {
      const user = AuthService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setProfileData({ fullName: user.fullName || '', username: user.username, email: user.email || '', password: '' });
      }
      if (user?.role === 'Super Admin') {
        const u = await AuthService.getUsers();
        setUsersList(u);
      }
    };
    fetchUser();
    window.addEventListener('authChange', fetchUser);
    return () => window.removeEventListener('authChange', fetchUser);
  }, []);

  const handleProfileUpdate = async () => {
    if (!profileData.username) return;
    const updatePayload: any = { username: profileData.username, fullName: profileData.fullName, email: profileData.email };
    if (profileData.password) updatePayload.password = profileData.password;
    const res = await AuthService.updateProfile(updatePayload);
    if (!res.success) {
      alert(res.error);
      return;
    }
    alert('Profile updated successfully!');
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return alert('Username and password required');
    const res = await AuthService.addUser(newUser);
    if (res.success) {
      setUsersList(await AuthService.getUsers());
      setNewUser({ fullName: '', username: '', email: '', password: '', role: 'Analyst' });
      alert('User added successfully');
    } else {
      if (res.error?.includes('email-already-in-use')) {
        alert('Firebase Error: Email is already in use by an existing account. If this is your email, try editing your existing profile instead of adding a new one.');
      } else {
        alert(res.error);
      }
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === currentUser.username) return alert('Cannot delete yourself');
    await AuthService.deleteUserFromDB(username);
    setUsersList(await AuthService.getUsers());
  };

  const handleStartEditUser = (user: any) => {
    setEditingUser(user.username);
    setEditUserData({ fullName: user.fullName || '', email: user.email || '', role: user.role, password: '' });
  };

  const handleSaveEditUser = async (username: string) => {
    const updatePayload: any = { username, fullName: editUserData.fullName, email: editUserData.email, role: editUserData.role };
    if (editUserData.password) updatePayload.password = editUserData.password;

    const users = await AuthService.getUsers();
    const index = users.findIndex((u: any) => u.username === username);
    if (index > -1) {
      users[index] = { ...users[index], ...updatePayload };
      await AuthService.saveUserToDB(users[index]);
      setUsersList([...users]);

      if (currentUser.username === username) {
        // Also update Firebase Authentication for the active session (like Profile tab)
        await AuthService.updateProfile(updatePayload);
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
                  <Label className="text-white">Email Address</Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
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
                    <Input placeholder="Email Address (Optional)" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white" />
                    <Input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white" />
                    <select
                      className="bg-[#131825] border border-[#5B6AC2]/30 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B6AC2] col-span-2"
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
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 mr-4">
                            <Input placeholder="Full Name" value={editUserData.fullName} onChange={e => setEditUserData({ ...editUserData, fullName: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white h-8 text-sm" />
                            <Input type="email" placeholder="Email Address" value={editUserData.email} onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} className="bg-[#131825] border-[#5B6AC2]/30 text-white h-8 text-sm" />
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
                            <p className="text-gray-400 text-xs">@{u.username} • {u.role} <span className={u.email ? "text-blue-400 ml-1" : "text-gray-500 italic ml-1"}>• {u.email || 'No email (click pencil to add)'}</span></p>
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

          {/* DATA SOURCES CONFIG */}
          {activeTab === 'DataSources' && (
            <div className="space-y-6">
              {/* Database Connection */}
              <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#E91E63]" />
                  Primary Database (ELK Stack)
                </h3>
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label className="text-white">Elasticsearch Node URL</Label>
                    <Input defaultValue="https://es-node-01.internal:9200" className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">API Key / Auth Token</Label>
                    <Input type="password" defaultValue="*************************" className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white" />
                  </div>
                  <div className="pt-2">
                    <Button 
                      className="bg-[#1A1F2E] border border-[#5B6AC2]/50 text-[#5B6AC2] hover:bg-[#5B6AC2] hover:text-white transition-colors"
                      onClick={() => alert('Connection to es-node-01.internal successful!')}
                    >
                      Test Connection
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Threat Feeds */}
              <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#FF6B35]" />
                  External Threat Intelligence Feeds
                </h3>
                <p className="text-sm text-gray-400 mb-4">Integrate third-party services to enrich IP intelligence capabilities.</p>
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label className="text-white">VirusTotal API Key</Label>
                    <Input type="password" placeholder="Enter VirusTotal key..." className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">AbuseIPDB API Key</Label>
                    <Input type="password" placeholder="Enter AbuseIPDB key..." defaultValue="abip_8x92je210..." className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white" />
                  </div>
                </div>
              </Card>

              {/* Log Ingestion & Retention */}
              <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Log Ingestion</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Logstash Listener Port</Label>
                        <Input defaultValue="5044" className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Syslog Forwarding</Label>
                        <Input defaultValue="udp://0.0.0.0:514" className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white font-mono" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Data Retention Policies</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Auth Logs Retention</Label>
                        <select className="w-full bg-[#1A1F2E]/50 border border-[#5B6AC2]/30 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B6AC2]">
                          <option value="30">30 Days</option>
                          <option value="90" selected>90 Days</option>
                          <option value="365">1 Year</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">System Metrics Retention</Label>
                        <select className="w-full bg-[#1A1F2E]/50 border border-[#5B6AC2]/30 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B6AC2]">
                          <option value="7">7 Days</option>
                          <option value="14" selected>14 Days</option>
                          <option value="30">30 Days</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end mt-6">
                <Button 
                  className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90"
                  onClick={() => alert('Integrations configuration saved successfully.')}
                >
                  Save Integrations
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
