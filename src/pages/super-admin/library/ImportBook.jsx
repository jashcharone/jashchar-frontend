import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, Upload, FileText } from 'lucide-react';

const ImportBook = () => {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [importedData, setImportedData] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a CSV file to import", variant: "destructive" });
      return;
    }

    // Simulate CSV parsing
    // In a real implementation, you'd parse the CSV file here
    const dummyData = [
      { title: 'Physics Vol 1', number: 'PHY001', isbn: '978-3-16-148410-0', publisher: 'Pearson', author: 'H.C. Verma', qty: 10 },
      { title: 'Chemistry Part 1', number: 'CHM001', isbn: '978-0-19-855922-1', publisher: 'NCERT', author: 'NCERT', qty: 20 },
    ];

    setImportedData(dummyData);
    toast({ title: "Success", description: "File processed successfully. Review data below." });
  };

  const handleDownloadSample = () => {
    // Create dummy CSV content
    const csvContent = "data:text/csv;charset=utf-8,Book Title,Book Number,ISBN Number,Publisher,Author,Subject,Rack Number,Qty,Book Price,Post Date,Description\nSample Book,BK001,1234567890,Sample Publisher,John Doe,General,R-01,10,100,2023-01-01,Sample Description";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_book_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Import Book</h1>
          <Button variant="outline" onClick={handleDownloadSample}>
            <Download className="mr-2 h-4 w-4" /> Download Sample Import File
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-sm text-blue-800">
            <p className="font-semibold mb-2">Instructions:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Your CSV data should be in the format of the sample file.</li>
              <li>The first line of your CSV file should be the column headers.</li>
              <li>Make sure that your file is UTF-8 encoded to avoid unnecessary encoding problems.</li>
              <li>If the column you are trying to import is date make sure that is formatted in format Y-m-d (2023-06-06).</li>
            </ol>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-2" />
              <span className="text-lg font-medium text-gray-900">Drop CSV file here or click to upload</span>
              <span className="text-sm text-gray-500 mt-1">{file ? file.name : 'No file selected'}</span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleImport} disabled={!file}>Import Book</Button>
          </div>
        </div>

        {importedData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Imported Data Preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Book Title</th>
                    <th className="px-6 py-3">Book Number</th>
                    <th className="px-6 py-3">ISBN</th>
                    <th className="px-6 py-3">Publisher</th>
                    <th className="px-6 py-3">Author</th>
                    <th className="px-6 py-3">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {importedData.map((row, index) => (
                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.title}</td>
                      <td className="px-6 py-4">{row.number}</td>
                      <td className="px-6 py-4">{row.isbn}</td>
                      <td className="px-6 py-4">{row.publisher}</td>
                      <td className="px-6 py-4">{row.author}</td>
                      <td className="px-6 py-4">{row.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
               <Button onClick={() => toast({ title: "Simulated", description: "Data would be saved to database." })}>Save Imported Data</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ImportBook;
