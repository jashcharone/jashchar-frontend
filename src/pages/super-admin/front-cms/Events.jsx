import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2, Calendar, Search } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import DashboardLayout from '@/components/DashboardLayout';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

const Events = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMasterAdmin = location.pathname.startsWith('/master-admin');
  const basePath = isMasterAdmin ? '/master-admin/front-cms' : '/super-admin/front-cms';
  
  // Data States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getEvents();
      if (response.success) {
        setEvents(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading events' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const response = await frontCmsService.deleteEvent(id);
      if (response.success) {
        toast({ title: 'Event deleted successfully' });
        loadEvents();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <MasterAdminSchoolHeader />
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Event List</h1>
          <PermissionButton 
            moduleSlug="front_cms.events" 
            action="add"
            onClick={() => navigate(`${basePath}/events/add`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </PermissionButton>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Events</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {event.start_date ? format(new Date(event.start_date), 'dd-MMM-yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>{event.location || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <PermissionButton moduleSlug="front_cms.events" action="edit">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/events/edit/${event.id}`)} title="Edit Event">
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </PermissionButton>
                          <PermissionButton moduleSlug="front_cms.events" action="delete">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} title="Delete Event">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </PermissionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Events;
