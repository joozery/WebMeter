import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { 
  Printer, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Mail 
} from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'pdf' | 'csv' | 'image') => void;
  onSendReport: (type: 'email' | 'line') => void;
  isLoaded: boolean;
  hasData: boolean;
  isLoading: boolean;
  isSending: boolean;
  emailGroups: { id: number; name: string }[];
  lineGroups: { id: number; name: string }[];
  emailList: any[];
  lineList: any[];
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onSendReport,
  isLoaded,
  hasData,
  isLoading,
  isSending,
  emailGroups,
  lineGroups,
  emailList,
  lineList
}) => {
  const [selectedExportType, setSelectedExportType] = useState<'pdf' | 'csv' | 'image' | null>(null);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [selectedEmailGroup, setSelectedEmailGroup] = useState<number | null>(null);
  const [selectedLineGroup, setSelectedLineGroup] = useState<number | null>(null);
  const [selectedEmailList, setSelectedEmailList] = useState<number | null>(null);
  const [selectedLineList, setSelectedLineList] = useState<number | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedExportType(null);
      setShowSendOptions(false);
      setSelectedEmailGroup(null);
      setSelectedLineGroup(null);
      setSelectedEmailList(null);
      setSelectedLineList(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setSelectedExportType(null);
    setShowSendOptions(false);
    setSelectedEmailGroup(null);
    setSelectedLineGroup(null);
    setSelectedEmailList(null);
    setSelectedLineList(null);
    onClose();
  };

  const handleExport = (type: 'pdf' | 'csv' | 'image') => {
    onExport(type);
    handleClose();
  };

  const handleSend = () => {
    if (selectedEmailGroup || selectedEmailList) {
      onSendReport('email');
    } else if (selectedLineGroup || selectedLineList) {
      onSendReport('line');
    } else {
      alert('กรุณาเลือก Email Group/List หรือ Line Group/List');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm">
      <div className="bg-white rounded shadow-lg p-6 min-w-[400px] max-w-lg flex flex-col">
        {!selectedExportType ? (
          // Step 1: Select Export Type
          <>
            <h2 className="text-lg font-semibold mb-4 text-center">Select Export Type</h2>
            <div className="space-y-3">
              <Button 
                className="w-full h-10 text-sm rounded-none" 
                onClick={() => setSelectedExportType('pdf')}
                disabled={!isLoaded || !hasData || isLoading}
              >
                <Printer className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button 
                className="w-full h-10 text-sm rounded-none" 
                onClick={() => setSelectedExportType('csv')}
                disabled={!isLoaded || !hasData || isLoading}
              >
                <FileText className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button 
                className="w-full h-10 text-sm rounded-none" 
                onClick={() => setSelectedExportType('image')}
                disabled={!isLoaded || !hasData || isLoading}
              >
                <ImageIcon className="w-4 h-4 mr-2" /> Image
              </Button>
            </div>
          </>
        ) : !showSendOptions ? (
          // Step 2: Select Action (Download or Send)
          <>
            <h2 className="text-lg font-semibold mb-4 text-center">
              Export {selectedExportType?.toUpperCase()}
            </h2>
            <div className="space-y-3">
              <Button 
                className="w-full h-10 text-sm rounded-none" 
                onClick={() => handleExport(selectedExportType!)}
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
              <Button 
                className="w-full h-10 text-sm rounded-none" 
                onClick={() => setShowSendOptions(true)}
              >
                <Mail className="w-4 h-4 mr-2" /> Send to Others
              </Button>
            </div>
          </>
        ) : (
          // Step 3: Select Recipients (4 groups like Email/Line page)
          <>
            <h2 className="text-lg font-semibold mb-4 text-center">Select Recipients</h2>
            <div className="space-y-4">
              {/* Email Groups */}
              <div>
                <h3 className="text-sm font-medium mb-2 text-gray-700">Email Groups</h3>
                <Select value={selectedEmailGroup?.toString() || ''} onValueChange={(value) => setSelectedEmailGroup(value ? parseInt(value) : null)}>
                  <SelectTrigger className="h-8 text-xs rounded-none">
                    <SelectValue placeholder="Select Email Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email List */}
              <div>
                <h3 className="text-sm font-medium mb-2 text-gray-700">Email List</h3>
                <Select value={selectedEmailList?.toString() || ''} onValueChange={(value) => setSelectedEmailList(value ? parseInt(value) : null)}>
                  <SelectTrigger className="h-8 text-xs rounded-none">
                    <SelectValue placeholder="Select Email List" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailList.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.displayName || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Line Groups */}
              <div>
                <h3 className="text-sm font-medium mb-2 text-gray-700">Line Groups</h3>
                <Select value={selectedLineGroup?.toString() || ''} onValueChange={(value) => setSelectedLineGroup(value ? parseInt(value) : null)}>
                  <SelectTrigger className="h-8 text-xs rounded-none">
                    <SelectValue placeholder="Select Line Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {lineGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Line List */}
              <div>
                <h3 className="text-sm font-medium mb-2 text-gray-700">Line List</h3>
                <Select value={selectedLineList?.toString() || ''} onValueChange={(value) => setSelectedLineList(value ? parseInt(value) : null)}>
                  <SelectTrigger className="h-8 text-xs rounded-none">
                    <SelectValue placeholder="Select Line List" />
                  </SelectTrigger>
                  <SelectContent>
                    {lineList.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.displayName || user.lineId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Send Button */}
              <Button 
                className="w-full h-10 text-sm rounded-none" 
                onClick={handleSend}
                disabled={!isLoaded || !hasData || isSending || (!selectedEmailGroup && !selectedEmailList && !selectedLineGroup && !selectedLineList)}
              >
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </>
        )}

        <Button variant="outline" className="w-full mt-4 rounded-none" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
