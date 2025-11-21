
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Staff, Role, ManagerReview, OrderStatus } from '../types';

const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'attendance' | 'reviews'>('details');
  
  // Form State for Add/Edit
  const [formData, setFormData] = useState<Partial<Staff>>({});
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  // Deactivation Logic
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);

  useEffect(() => {
    setStaffList(DataService.getStaffList());
  }, [modalOpen, reassignModalOpen]);

  const handleSaveStaff = () => {
      if (formData.id && staffList.some(s => s.id === formData.id && s.id !== selectedStaff?.id)) {
         // Simple check for ID collision if manually editing, though usually auto-generated or read-only
      }

      if (formData.id && selectedStaff) {
          // Update existing
          DataService.updateStaffMember(formData as Staff);
      } else {
          // Create New - Generate Employee ID
          const count = staffList.length + 100; // Start at 100 roughly
          const newId = `EMP-${Date.now().toString().slice(-4)}`; // Simple random ID
          
          const newStaff: Staff = {
              ...formData,
              id: newId,
              active: true,
              totalTips: 0,
              monthlyTips: 0,
              attendance: [],
              reviews: []
          } as Staff;
          DataService.addStaffMember(newStaff);
      }
      setModalOpen(false);
      setFormData({});
      setSelectedStaff(null);
  };

  const handleDeactivateClick = () => {
      if (!selectedStaff) return;
      if (selectedStaff.role === Role.ADMIN) {
          const activeAdmins = staffList.filter(s => s.role === Role.ADMIN && s.active);
          if (activeAdmins.length <= 1) {
              alert("Cannot deactivate the last Administrator.");
              return;
          }
      }

      // Check for active orders
      const orders = DataService.getOrders();
      const activeOrders = orders.filter(o => o.staffId === selectedStaff.id && o.status !== OrderStatus.SERVED);
      
      if (activeOrders.length > 0) {
          setPendingDeactivateId(selectedStaff.id);
          setReassignModalOpen(true);
      } else {
          if (confirm(`Are you sure you want to deactivate ${selectedStaff.name}?`)) {
             DataService.reassignOrdersAndDeactivate(selectedStaff.id, null, "Admin");
             setSelectedStaff(null);
             setStaffList(DataService.getStaffList()); // Refresh
          }
      }
  };

  const handleConfirmReassign = () => {
      if (pendingDeactivateId && newAssigneeId) {
          DataService.reassignOrdersAndDeactivate(pendingDeactivateId, newAssigneeId, "Admin");
          setReassignModalOpen(false);
          setPendingDeactivateId(null);
          setNewAssigneeId('');
          setSelectedStaff(null);
          alert("Staff deactivated and orders reassigned.");
      }
  };

  const handleAddReview = () => {
      if (!selectedStaff) return;
      const rev: ManagerReview = {
          id: Date.now().toString(),
          managerId: 'current-user', 
          rating: reviewData.rating,
          comment: reviewData.comment,
          timestamp: Date.now()
      };
      DataService.addManagerReview(selectedStaff.id, rev);
      const updated = { ...selectedStaff, reviews: [...selectedStaff.reviews, rev] };
      setSelectedStaff(updated);
      setReviewData({ rating: 5, comment: '' });
  };

  const calculateNetSalary = (s: Staff) => {
      return s.salary + s.bonus + s.monthlyTips - s.deductions;
  };

  const getHoursWorkedToday = (s: Staff) => {
      const today = new Date().setHours(0,0,0,0);
      const todayRecs = s.attendance.filter(r => r.timestamp >= today);
      if (todayRecs.length === 0) return 0;
      
      const firstIn = todayRecs.find(r => r.type === 'IN');
      const lastOut = [...todayRecs].reverse().find(r => r.type === 'OUT');
      
      if (firstIn && lastOut) {
          return ((lastOut.timestamp - firstIn.timestamp) / (1000 * 60 * 60)).toFixed(1);
      }
      if (firstIn) return "Active";
      return 0;
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Human Resources & Staff</h1>
          <button 
            onClick={() => { setFormData({ role: Role.STAFF, salary: 0, bonus: 0, deductions: 0 }); setModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
          >
            + Add Employee
          </button>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left: Staff List */}
          <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-xs text-gray-500 flex justify-between">
                  <span>NAME / ROLE</span>
                  <span>ID</span>
              </div>
              <div className="overflow-y-auto flex-1">
                  {staffList.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { setSelectedStaff(s); setActiveTab('details'); }}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedStaff?.id === s.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''} ${!s.active ? 'opacity-50 bg-gray-100' : ''}`}
                      >
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold text-slate-800">{s.name} { !s.active && '(Inactive)'}</h3>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {s.role}
                                  </span>
                              </div>
                              <div className="text-right">
                                  <div className="font-mono text-xs bg-slate-200 px-1 rounded text-slate-600">{s.id}</div>
                                  <div className="text-[10px] text-slate-400 mt-1">Tips: {s.monthlyTips}</div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Right: Detail View */}
          <div className="w-2/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
              {selectedStaff ? (
                  <>
                    <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold">{selectedStaff.name}</h2>
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-mono">{selectedStaff.id}</span>
                            </div>
                            <p className="text-slate-500 text-sm mt-1">PIN: <span className="font-mono bg-gray-200 px-1 rounded">****</span> (Hidden)</p>
                        </div>
                        <div className="space-x-2">
                            <button onClick={() => setActiveTab('details')} className={`px-3 py-1 rounded text-sm font-bold ${activeTab === 'details' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>Payroll</button>
                            <button onClick={() => setActiveTab('attendance')} className={`px-3 py-1 rounded text-sm font-bold ${activeTab === 'attendance' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>Attendance</button>
                            <button onClick={() => setActiveTab('reviews')} className={`px-3 py-1 rounded text-sm font-bold ${activeTab === 'reviews' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>Performance</button>
                        </div>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto">
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-blue-50 p-6 rounded-xl">
                                    <h3 className="text-blue-800 font-bold mb-4 uppercase text-sm">Estimated Salary (This Month)</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span>Base Salary</span> <span>{selectedStaff.salary}</span></div>
                                        <div className="flex justify-between text-sm text-green-600"><span>Bonus</span> <span>+{selectedStaff.bonus}</span></div>
                                        <div className="flex justify-between text-sm text-green-600"><span>Tips (Month)</span> <span>+{selectedStaff.monthlyTips}</span></div>
                                        <div className="flex justify-between text-sm text-red-500"><span>Deductions</span> <span>-{selectedStaff.deductions}</span></div>
                                        <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-bold text-xl">
                                            <span>Net Pay</span>
                                            <span>{calculateNetSalary(selectedStaff)} ETB</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button 
                                      onClick={() => { setFormData(selectedStaff); setModalOpen(true); }}
                                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg mb-4"
                                      disabled={!selectedStaff.active}
                                    >
                                        Edit Profile / Salary
                                    </button>
                                    
                                    {selectedStaff.active ? (
                                        <button 
                                            onClick={handleDeactivateClick}
                                            className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold py-3 rounded-lg"
                                        >
                                            Deactivate Account
                                        </button>
                                    ) : (
                                        <div className="text-center p-3 bg-gray-100 rounded text-gray-500 font-bold border border-gray-200">
                                            Account Deactivated
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-400 mt-4">
                                        Last updated: {new Date().toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold">Activity Log</h3>
                                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">Hours Today: <b>{getHoursWorkedToday(selectedStaff)}</b></span>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-500 bg-gray-50">
                                        <tr><th className="p-2">Type</th><th className="p-2">Time</th><th className="p-2">Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {[...selectedStaff.attendance].reverse().slice(0, 10).map(r => (
                                            <tr key={r.id} className="border-b">
                                                <td className={`p-2 font-bold ${r.type === 'IN' ? 'text-green-600' : 'text-red-500'}`}>{r.type === 'IN' ? 'CLOCK IN' : 'CLOCK OUT'}</td>
                                                <td className="p-2">{new Date(r.timestamp).toLocaleTimeString()}</td>
                                                <td className="p-2 text-gray-500">{new Date(r.timestamp).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div>
                                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-sm mb-2">Add Manager Review</h4>
                                    <textarea 
                                        className="w-full p-2 border rounded mb-2 text-sm" 
                                        placeholder="Note on performance..."
                                        value={reviewData.comment}
                                        onChange={e => setReviewData({...reviewData, comment: e.target.value})}
                                    />
                                    <div className="flex justify-between items-center">
                                        <select 
                                            className="border p-1 rounded"
                                            value={reviewData.rating}
                                            onChange={e => setReviewData({...reviewData, rating: Number(e.target.value)})}
                                        >
                                            <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                                            <option value="4">⭐⭐⭐⭐ Good</option>
                                            <option value="3">⭐⭐⭐ Average</option>
                                            <option value="2">⭐⭐ Poor</option>
                                            <option value="1">⭐ Critical</option>
                                        </select>
                                        <button onClick={handleAddReview} className="bg-slate-800 text-white px-4 py-1 rounded text-sm">Submit</button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {selectedStaff.reviews.length === 0 && <p className="text-gray-400 text-center">No reviews yet.</p>}
                                    {[...selectedStaff.reviews].reverse().map(r => (
                                        <div key={r.id} className="border border-gray-200 p-4 rounded-lg">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-yellow-500">{'★'.repeat(r.rating)}</span>
                                                <span className="text-xs text-gray-400">{new Date(r.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{r.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  </>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                      Select a staff member to view details
                  </div>
              )}
          </div>
      </div>

      {/* Edit Modal */}
      {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-[500px] shadow-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">{formData.id ? 'Edit Staff' : 'Add New Staff'}</h2>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase">Name</label>
                          <input 
                            className="w-full border p-2 rounded" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">PIN Code</label>
                            <input 
                                className="w-full border p-2 rounded font-mono" 
                                value={formData.pin || ''} 
                                maxLength={6}
                                onChange={e => setFormData({...formData, pin: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Role</label>
                            <select 
                                className="w-full border p-2 rounded"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                            >
                                {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                      </div>
                      {/* ID Display (ReadOnly) */}
                      {formData.id && (
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase">Employee ID</label>
                              <input className="w-full border p-2 rounded bg-gray-100 font-mono" value={formData.id} disabled />
                          </div>
                      )}

                      <hr className="my-2"/>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Base Salary</label>
                            <input type="number" className="w-full border p-2 rounded" value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})}/>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Bonus</label>
                            <input type="number" className="w-full border p-2 rounded" value={formData.bonus} onChange={e => setFormData({...formData, bonus: Number(e.target.value)})}/>
                          </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Deductions</label>
                        <input type="number" className="w-full border p-2 rounded" value={formData.deductions} onChange={e => setFormData({...formData, deductions: Number(e.target.value)})}/>
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                      <button onClick={handleSaveStaff} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Save Changes</button>
                  </div>
              </div>
          </div>
      )}

      {/* Reassign Modal */}
      {reassignModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-[400px] shadow-2xl">
                  <h3 className="text-red-600 font-bold text-xl mb-2">Action Required</h3>
                  <p className="text-sm text-gray-600 mb-4">
                      This staff member has open orders or active tables. You must reassign them to another waiter before deactivating.
                  </p>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Reassign to:</label>
                  <select 
                      className="w-full p-2 border rounded mb-6"
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                  >
                      <option value="">Select Staff Member</option>
                      {staffList.filter(s => s.active && s.id !== pendingDeactivateId && s.role !== Role.KITCHEN).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setReassignModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                      <button 
                        onClick={handleConfirmReassign}
                        disabled={!newAssigneeId}
                        className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 disabled:opacity-50"
                      >
                          Reassign & Deactivate
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StaffManagement;
