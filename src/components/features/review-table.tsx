'use client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface ExtractedTeacher {
  name: string;
  email: string;
  subjects: string;
  weekly_hours: number;
}

export function ReviewTable({ data, setData }: { data: ExtractedTeacher[], setData: any }) {
  const updateField = (index: number, field: keyof ExtractedTeacher, value: string | number) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <Table>
        <TableHeader className="bg-[#FFFDF5]">
          <TableRow>
            <TableHead className="text-[#2D3436]">Name</TableHead>
            <TableHead className="text-[#2D3436]">Email</TableHead>
            <TableHead className="text-[#2D3436]">Weekly Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((teacher, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Input 
                  value={teacher.name} 
                  onChange={(e) => updateField(idx, 'name', e.target.value)}
                  className="border-none shadow-none focus-visible:ring-1 focus-visible:ring-[#4834D4]"
                />
              </TableCell>
              <TableCell>
                <Input 
                  value={teacher.email} 
                  onChange={(e) => updateField(idx, 'email', e.target.value)}
                  className="border-none shadow-none"
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number"
                  value={teacher.weekly_hours} 
                  onChange={(e) => updateField(idx, 'weekly_hours', parseInt(e.target.value))}
                  className="border-none shadow-none w-20"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}