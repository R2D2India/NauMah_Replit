
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Journal() {
  const [entries, setEntries] = useState([
    {
      date: "2024-03-19",
      title: "First Baby Kick!",
      content: "Today I felt the baby kick for the first time..."
    }
  ]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pregnancy Journal</h1>
        <Button>New Entry</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New Journal Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Entry Title"
              className="w-full p-2 border rounded-md"
            />
            <Textarea
              placeholder="Write your thoughts..."
              className="min-h-[200px]"
            />
            <div className="flex justify-end">
              <Button type="submit">Save Entry</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{entry.title}</CardTitle>
                <span className="text-sm text-gray-500">{entry.date}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{entry.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
