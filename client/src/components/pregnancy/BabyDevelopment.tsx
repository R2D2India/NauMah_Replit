import { BABY_SIZE_COMPARISONS, DEVELOPMENT_MILESTONES } from "@/lib/constants";

interface BabyDevelopmentProps {
  currentWeek: number;
}

const BabyDevelopment = ({ currentWeek }: BabyDevelopmentProps) => {
  // Get baby size for current week
  const babySize = BABY_SIZE_COMPARISONS.find(item => item.week === currentWeek) || 
                  BABY_SIZE_COMPARISONS[0]; // Default to first week if not found
  
  // Get development milestones for current week
  const milestones = DEVELOPMENT_MILESTONES[currentWeek as keyof typeof DEVELOPMENT_MILESTONES] ||
                    {
                      description: "Information not available for this week.",
                      keyDevelopments: ["Information not available"],
                      funFact: ""
                    };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl p-6 custom-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/5 mb-6 md:mb-0 flex justify-center">
            <div className="relative">
              <div className="rounded-lg shadow-md flex items-center justify-center bg-neutral-light h-[300px] w-[300px] text-center">
                <div className="flex flex-col items-center">
                  <span className="text-8xl mb-4" aria-hidden="true">{babySize.image}</span>
                  <h3 className="text-xl font-montserrat font-medium">Week {currentWeek}</h3>
                </div>
              </div>
              <div className="absolute bottom-3 right-3 bg-white rounded-full p-2 shadow-md">
                <span className="text-primary font-montserrat font-medium">Size: {babySize.size}</span>
              </div>
            </div>
          </div>
          <div className="md:w-3/5 md:pl-6">
            <h2 className="text-2xl font-montserrat font-bold text-primary mb-3">Your Baby This Week</h2>
            <div className="space-y-4">
              <p>{milestones.description}</p>
              
              <div className="bg-neutral-light rounded-lg p-4">
                <h3 className="font-montserrat font-medium text-lg mb-2">Key Developments</h3>
                <ul className="space-y-2">
                  {milestones.keyDevelopments.map((development, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-circle-check text-primary mt-1 mr-2"></i>
                      <span>{development}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {milestones.funFact && (
                <p className="text-neutral-dark italic">{milestones.funFact}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BabyDevelopment;
