import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Edit, Plus, Trash2, Trophy, GraduationCap, Users, MapPin, UserCheck, BookOpen, School, Award, Star, Heart, Target, Briefcase, Globe } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

// Available icons for achievements
const ICON_OPTIONS = [
  { value: 'GraduationCap', label: 'Graduation Cap', icon: GraduationCap },
  { value: 'UserCheck', label: 'Certified / Verified', icon: UserCheck },
  { value: 'MapPin', label: 'Location / Campus', icon: MapPin },
  { value: 'Users', label: 'People / Students', icon: Users },
  { value: 'Trophy', label: 'Trophy', icon: Trophy },
  { value: 'BookOpen', label: 'Book', icon: BookOpen },
  { value: 'School', label: 'School', icon: School },
  { value: 'Award', label: 'Award', icon: Award },
  { value: 'Star', label: 'Star', icon: Star },
  { value: 'Heart', label: 'Heart', icon: Heart },
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'Briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'Globe', label: 'Globe', icon: Globe },
];

const getIconComponent = (iconName, className = "h-6 w-6") => {
  const found = ICON_OPTIONS.find(i => i.value === iconName);
  if (found) {
    const IconComp = found.icon;
    return <IconComp className={className} />;
  }
  return <Trophy className={className} />;
};

const AchievementsTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branchId) loadAchievements();
  }, [branchId]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getAchievements(branchId);
      setAchievements(data || []);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load achievements' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingItem.label || !editingItem.count_value) {
      toast({ variant: 'destructive', title: 'Error', description: 'Label and Count are required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        branch_id: branchId,
        ...editingItem,
        sort_order: editingItem.sort_order || achievements.length + 1
      };

      await cmsEditorService.upsertAchievement(payload);
      toast({ title: 'Success', description: 'Achievement saved successfully' });
      setEditingItem(null);
      loadAchievements();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save achievement' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;
    try {
      await cmsEditorService.deleteAchievement(id);
      toast({ title: 'Achievement deleted' });
      loadAchievements();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting achievement' });
    }
  };

  const openNewItem = () => {
    setEditingItem({
      icon_name: 'Trophy',
      count_value: '',
      label: '',
      sort_order: achievements.length + 1
    });
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">Achievements & Stats</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Homepage "Achievements & Recognitions" section ನಲ್ಲಿ ತೋರಿಸುವ stats manage ಮಾಡಿ
          </p>
        </div>
        <Button onClick={openNewItem}>
          <Plus className="h-4 w-4 mr-2" /> Add Achievement
        </Button>
      </div>

      {/* Info banner */}
      {achievements.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-amber-800 dark:text-amber-300 text-sm">
            <strong>ಗಮನಿಸಿ:</strong> ಯಾವ achievement ಸೇರಿಸಿಲ್ಲ. Default values (448 Graduates, 224 Teachers, etc.) ತೋರಿಸ್ತಿದೆ. 
            ನಿಮ್ಮ ಶಾಲೆಯ ನಿಜವಾದ stats ಸೇರಿಸಿ.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map(item => (
          <div key={item.id} className="flex items-center justify-between p-5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-full">
                {getIconComponent(item.icon_name, "h-7 w-7 text-orange-600 dark:text-orange-400")}
              </div>
              <div>
                <h4 className="text-2xl font-bold dark:text-white">{item.count_value}</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">#{item.sort_order}</span>
              <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit Achievement' : 'Add New Achievement'}</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Icon</Label>
                <Select 
                  value={editingItem.icon_name} 
                  onValueChange={(val) => setEditingItem({...editingItem, icon_name: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Count / Number <span className="text-red-500">*</span></Label>
                <Input 
                  value={editingItem.count_value || ''} 
                  onChange={e => setEditingItem({...editingItem, count_value: e.target.value})} 
                  placeholder="e.g. 500"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Numbers, text (e.g. "500+", "10K") ಹಾಕಬಹುದು</p>
              </div>

              <div>
                <Label>Label <span className="text-red-500">*</span></Label>
                <Input 
                  value={editingItem.label || ''} 
                  onChange={e => setEditingItem({...editingItem, label: e.target.value})} 
                  placeholder="e.g. GRADUATES"
                  required
                />
              </div>

              <div>
                <Label>Sort Order</Label>
                <Input 
                  type="number"
                  value={editingItem.sort_order || ''} 
                  onChange={e => setEditingItem({...editingItem, sort_order: parseInt(e.target.value) || 1})} 
                  placeholder="1"
                  min="1"
                />
              </div>

              {/* Preview */}
              <div className="bg-slate-800 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-2 p-2 bg-slate-700 rounded-full">
                    {getIconComponent(editingItem.icon_name, "h-8 w-8 text-orange-500")}
                  </div>
                  <h3 className="text-3xl font-bold text-white">{editingItem.count_value || '0'}</h3>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{editingItem.label || 'LABEL'}</span>
                  <div className="w-10 h-1 mt-2 rounded-full bg-orange-500"></div>
                </div>
                <p className="text-xs text-gray-500 mt-3">Preview</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AchievementsTab;
