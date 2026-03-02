import { Card } from '../components/ui/card';
import { Shield, Plus, Power, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { ElasticsearchService } from '../../services/elasticsearch';

export function DetectionRulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        description: '',
        type: 'Authentication',
        severity: 'Medium',
    });

    useEffect(() => {
        const fetchRules = async () => {
            const data = await ElasticsearchService.getDetectionRules();
            setRules(data);
        };
        fetchRules();

        const handleUpdate = () => fetchRules();
        window.addEventListener('rulesDatabaseUpdated', handleUpdate);
        return () => window.removeEventListener('rulesDatabaseUpdated', handleUpdate);
    }, []);

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        await ElasticsearchService.updateDetectionRuleStatus(id, newStatus);
    };

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        const ruleToAdd = {
            name: newRule.name,
            description: newRule.description,
            status: 'Active',
            severity: newRule.severity,
            type: newRule.type,
        };
        await ElasticsearchService.createDetectionRule(ruleToAdd);
        setIsModalOpen(false);
        setNewRule({ name: '', description: '', type: 'Authentication', severity: 'Medium' });
    };

    const handleDeleteRule = async (id: string) => {
        await ElasticsearchService.deleteDetectionRule(id);
    };

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Detection Rules & Policies</h1>
                    <p className="text-gray-400 mt-1">Manage intrusion detection signatures, heuristics, and response policies.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[#5B6AC2] hover:bg-[#4b58a1] text-white px-4 py-2 rounded-md transition-colors w-fit"
                >
                    <Plus className="w-4 h-4" />
                    Create New Rule
                </button>
            </div>

            {/* Rules Table */}
            <Card className="bg-[#131825] border-[#5B6AC2]/20">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#5B6AC2]/20 text-left">
                                <th className="py-4 px-6 text-sm font-medium text-gray-400">Rule Name / Description</th>
                                <th className="py-4 px-6 text-sm font-medium text-gray-400">Category</th>
                                <th className="py-4 px-6 text-sm font-medium text-gray-400">Severity</th>
                                <th className="py-4 px-6 text-sm font-medium text-gray-400">Status</th>
                                <th className="py-4 px-6 text-sm font-medium text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map((rule) => (
                                <tr key={rule.id} className="border-b border-[#5B6AC2]/10 hover:bg-[#1A1F2E]/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-start gap-3">
                                            <Shield className={`w-5 h-5 mt-1 ${rule.status === 'Active' ? 'text-[#5B6AC2]' : 'text-gray-500'}`} />
                                            <div>
                                                <p className={`font-medium ${rule.status === 'Active' ? 'text-white' : 'text-gray-400'}`}>{rule.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded border border-gray-700">
                                            {rule.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`flex items-center gap-1 text-xs font-medium w-fit px-2 py-1 rounded
                      ${rule.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                rule.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}
                    `}>
                                            {rule.severity === 'Critical' && <AlertCircle className="w-3 h-3" />}
                                            {rule.severity}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <button
                                            onClick={() => toggleStatus(rule.id, rule.status)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${rule.status === 'Active' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {rule.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                                            {rule.status}
                                        </button>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-end gap-3">
                                            <button className="text-gray-400 hover:text-blue-400 transition-colors" title="Edit Rule">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-gray-400 hover:text-red-400 transition-colors"
                                                title="Delete Rule"
                                                onClick={() => handleDeleteRule(rule.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Rule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-[#131825] border-[#5B6AC2]/30 p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Rule</h2>
                        <form onSubmit={handleAddRule} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[#0A0E1A] border border-[#5B6AC2]/30 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#5B6AC2] focus:ring-1 focus:ring-[#5B6AC2]"
                                    placeholder="e.g. Block Suspicious Crawlers"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full bg-[#0A0E1A] border border-[#5B6AC2]/30 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#5B6AC2] focus:ring-1 focus:ring-[#5B6AC2]"
                                    placeholder="Condition and response..."
                                    value={newRule.description}
                                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                                    <select
                                        className="w-full bg-[#0A0E1A] border border-[#5B6AC2]/30 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#5B6AC2] focus:ring-1 focus:ring-[#5B6AC2]"
                                        value={newRule.type}
                                        onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                                    >
                                        <option value="Authentication">Authentication</option>
                                        <option value="Network">Network</option>
                                        <option value="Application">Application</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Severity</label>
                                    <select
                                        className="w-full bg-[#0A0E1A] border border-[#5B6AC2]/30 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#5B6AC2] focus:ring-1 focus:ring-[#5B6AC2]"
                                        value={newRule.severity}
                                        onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-md font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md font-medium text-white bg-[#5B6AC2] hover:bg-[#4b58a1] transition-colors"
                                >
                                    Add Rule
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
