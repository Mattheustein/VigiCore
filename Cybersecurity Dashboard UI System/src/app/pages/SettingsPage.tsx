import React, { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Database, Users, Plus, Pencil, Check, X, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuthService } from '../../services/auth';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [profileData, setProfileData] = useState({ fullName: '', username: '', email: '', password: '' });
  
  const [newUser, setNewUser] = useState({ fullName: '', username: '', email: '', password: '', role: 'Analyst' });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState({ fullName: '', role: 'Analyst', password: '' });

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
      alert(res.error);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === currentUser.username) return alert('Cannot delete yourself');
    await AuthService.deleteUserFromDB(username);
    setUsersList(await AuthService.getUsers());
  };

  const handleStartEditUser = (user: any) => {
    setEditingUser(user.username);
    setEditUserData({ fullName: user.fullName || '', role: user.role, password: '' });
  };

  const handleSaveEditUser = async (username: string) => {
    const updatePayload: any = { username, fullName: editUserData.fullName, role: editUserData.role };
    if (editUserData.password) updatePayload.password = editUserData.password;

    const users = await AuthService.getUsers();
    const index = users.findIndex((u: any) => u.username === username);
    if (index > -1) {
      users[index] = { ...users[index], ...updatePayload };
      await AuthService.saveUserToDB(users[index]);
      setUsersList([...users]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
          <p className="text-gray-400 mt-1">Manage your account and platform preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 border border-[#5B6AC2]/20 rounded-xl bg-[#090D14]/80 backdrop-blur-md overflow-hidden text-white h-fit">
          <ul className="flex flex-col p-2">
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors text-left ${activeTab === tab.id ? 'bg-[#5B6AC2]/30 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <div className="border border-[#5B6AC2]/20 rounded-xl bg-[#090D14]/80 backdrop-blur-md p-6 h-full min-h-[500px]">
            
            {activeTab === 'Profile' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-[#5B6AC2]/20 pb-4">
                  <h3 className="text-xl font-semibold text-white">Your Profile</h3>
                  <p className="text-sm text-gray-400">Update your personal details below.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Full Name</label>
                    <Input
                      value={profileData.fullName}
                      onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="bg-[#131825] border-[#5B6AC2]/30 text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Username</label>
                    <Input
                      value={profileData.username}
                      disabled
                      className="bg-[#131825] border-[#5B6AC2]/30 text-gray-400 opacity-70 cursor-not-allowed"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-300">Email Address</label>
                    <Input
                      value={profileData.email}
                      placeholder="swe.mahmoud.sultan@gmail.com"
                      onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                      className="bg-[#131825] border-[#5B6AC2]/30 text-white"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 pt-4 flex gap-4">
                    <Button onClick={handleProfileUpdate} className="bg-[#5B6AC2] hover:bg-[#4A59A8] text-white">
                      Save Profile Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'UserManagement' && currentUser?.role === 'Super Admin' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-end border-b border-[#5B6AC2]/20 pb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">User Management</h3>
                    <p className="text-sm text-gray-400">Add, edit, or remove dashboard users.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#131825] border border-[#5B6AC2]/30 rounded-lg p-4 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#5B6AC2]"></div>
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

                  <h4 className="text-md font-medium text-white pt-2">Current Users</h4>
                  <div className="border border-[#5B6AC2]/20 rounded-md overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#131825] border-b border-[#5B6AC2]/20">
                        <tr>
                          <th className="px-4 py-3 text-gray-300 font-medium">Full Name</th>
                          <th className="px-4 py-3 text-gray-300 font-medium">Username</th>
                          <th className="px-4 py-3 text-gray-300 font-medium">Role</th>
                          <th className="px-4 py-3 text-gray-300 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#5B6AC2]/10">
                        {usersList.map((user: any, index) => (
                          <tr key={index} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              {editingUser === user.username ? (
                                <Input
                                  value={editUserData.fullName}
                                  onChange={e => setEditUserData({ ...editUserData, fullName: e.target.value })}
                                  className="h-8 bg-[#090D14] border-[#5B6AC2]/40 text-white text-xs"
                                />
                              ) : (
                                <div className="flex flex-col">
                                  <span className="text-gray-100 font-medium">{user.fullName || '-'}</span>
                                  {user.email && <span className="text-xs text-gray-500 mt-0.5">{user.email}</span>}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-400">{user.username}</td>
                            <td className="px-4 py-3">
                              {editingUser === user.username ? (
                                <select
                                  value={editUserData.role}
                                  onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}
                                  className="h-8 w-full bg-[#090D14] border border-[#5B6AC2]/40 text-white rounded text-xs px-2 focus:outline-none"
                                >
                                  <option value="Analyst">Analyst</option>
                                  <option value="Administrator">Admin</option>
                                  <option value="Super Admin">Super</option>
                                </select>
                              ) : (
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${user.role === 'Super Admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    user.role === 'Administrator' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                  }`}>
                                  {user.role}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                {editingUser === user.username ? (
                                  <>
                                    <button onClick={() => handleSaveEditUser(user.username)} className="p-1 hover:bg-[#10B981]/20 text-[#10B981] rounded transition-colors" title="Save">
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-500/20 text-gray-400 rounded transition-colors" title="Cancel">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => handleStartEditUser(user)} className="p-1 hover:bg-[#5B6AC2]/20 text-[#5B6AC2] rounded transition-colors" title="Edit">
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {currentUser.username !== user.username && (
                                      <button onClick={() => handleDeleteUser(user.username)} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {usersList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No users found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'Security' || activeTab === 'DataSources') && (
              <div className="flex flex-col items-center justify-center space-y-4 py-16 opacity-50">
                <Shield className="w-16 h-16 text-[#5B6AC2]/40" />
                <p className="text-gray-400">This section is currently under construction.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
