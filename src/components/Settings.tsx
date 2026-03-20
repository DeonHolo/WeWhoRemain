import { useGameStore } from '../store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw } from 'lucide-react';

export function Settings() {
  const resetGame = useGameStore((state) => state.resetGame);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset your progress? This cannot be undone.")) {
      resetGame();
      window.location.reload();
    }
  };

  return (
    <Card className="bg-card/40 backdrop-blur-md border-border">
      <CardHeader>
        <CardTitle className="text-lg text-white">Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleReset}
          variant="destructive"
          className="w-full flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Reset Progress
        </Button>
      </CardContent>
    </Card>
  );
}
