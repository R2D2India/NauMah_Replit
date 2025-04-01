import { useQuery } from "@tanstack/react-query";
import { 
  calculateDueDate, 
  calculateCompletion, 
  getTrimeasterLabel
} from "@/lib/constants";

interface PregnancyProgressProps {
  currentWeek: number;
}

const PregnancyProgress = ({ currentWeek }: PregnancyProgressProps) => {
  // Calculate pregnancy metrics
  const dueDate = calculateDueDate(currentWeek);
  const completionPercentage = calculateCompletion(currentWeek);
  const trimester = getTrimeasterLabel(currentWeek);
  const weeksLeft = 40 - currentWeek;
  
  // Calculate the visual position for the timeline marker (in percentage)
  const progressPercentage = `${Math.min(Math.max((currentWeek / 40) * 100, 0), 100)}%`;

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl p-6 custom-shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-montserrat font-bold text-primary">Your Pregnancy Journey</h2>
            <p className="text-neutral-dark">Week {currentWeek} | {trimester}</p>
          </div>
          <div className="mt-2 md:mt-0 flex items-center space-x-2">
            <span className="font-montserrat font-medium">Due Date:</span>
            <span className="font-montserrat text-primary-dark">{dueDate}</span>
          </div>
        </div>
        
        <div className="relative pt-1 mb-6">
          <div 
            className="h-4 rounded-full"
            style={{
              background: `linear-gradient(to right, #8C6BAE 0%, #8C6BAE ${progressPercentage}, #E9ECEF ${progressPercentage}, #E9ECEF 100%)`
            }}
          ></div>
          <div className="flex justify-between mt-2 text-xs text-neutral-dark">
            <span>Week 1</span>
            <span>Week 13</span>
            <span>Week 27</span>
            <span>Week 40</span>
          </div>
          <div 
            className="absolute -top-1" 
            style={{ left: progressPercentage }}
          >
            <div className="h-6 w-6 rounded-full bg-primary border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">{currentWeek}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-neutral-light rounded-lg p-3">
            <div className="text-sm text-neutral-dark">Current Week</div>
            <div className="text-xl font-montserrat font-bold text-primary-dark">{currentWeek}</div>
          </div>
          <div className="bg-neutral-light rounded-lg p-3">
            <div className="text-sm text-neutral-dark">Trimester</div>
            <div className="text-xl font-montserrat font-bold text-primary-dark">
              {currentWeek <= 13 ? "1st" : currentWeek <= 26 ? "2nd" : "3rd"}
            </div>
          </div>
          <div className="bg-neutral-light rounded-lg p-3">
            <div className="text-sm text-neutral-dark">Weeks Left</div>
            <div className="text-xl font-montserrat font-bold text-primary-dark">{weeksLeft}</div>
          </div>
          <div className="bg-neutral-light rounded-lg p-3">
            <div className="text-sm text-neutral-dark">Completed</div>
            <div className="text-xl font-montserrat font-bold text-primary-dark">{completionPercentage}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PregnancyProgress;
