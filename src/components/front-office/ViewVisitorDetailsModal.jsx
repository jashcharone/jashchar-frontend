import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

const ViewVisitorDetailsModal = ({ isOpen, onClose, visitor }) => {
  if (!visitor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Visitor Details</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 text-sm py-4">
          <div><span className="font-semibold">Visitor Name:</span> {visitor.visitor_name}</div>
          <div><span className="font-semibold">Phone:</span> {visitor.phone || '-'}</div>
          <div><span className="font-semibold">Purpose:</span> {visitor.purpose?.purpose}</div>
          <div><span className="font-semibold">Meeting With:</span> <span className="capitalize">{visitor.meeting_with}</span></div>
          <div><span className="font-semibold">Date:</span> {format(new Date(visitor.date), 'dd-MMM-yyyy')}</div>
          <div><span className="font-semibold">In Time:</span> {visitor.in_time}</div>
          <div><span className="font-semibold">Out Time:</span> {visitor.out_time || '-'}</div>
          <div><span className="font-semibold">No. Of Person:</span> {visitor.no_of_person}</div>
          <div><span className="font-semibold">ID Card:</span> {visitor.id_card || '-'}</div>
          <div className="col-span-2"><span className="font-semibold">Note:</span> {visitor.note || '-'}</div>
          {visitor.document_url && (
            <div className="col-span-2">
              <span className="font-semibold">Document:</span> <a href={visitor.document_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Document</a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewVisitorDetailsModal;
