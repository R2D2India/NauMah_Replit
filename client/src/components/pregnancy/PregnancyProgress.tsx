import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  calculateDueDate, 
  calculateCompletion, 
  getTrimeasterLabel
} from "@/lib/constants";

interface PregnancyProgressProps {
  currentWeek: number;
  isLocalData?: boolean;
}

const PregnancyProgress = ({ currentWeek, isLocalData }: PregnancyProgressProps) => {
  const { t } = useTranslation();

  // Calculate pregnancy metrics
  const dueDate = calculateDueDate(currentWeek);
  const completionPercentage = calculateCompletion(currentWeek);
  
  // Use the raw trimester value (first, second, third) to get translated text
  const rawTrimester = currentWeek <= 13 ? "first" : currentWeek <= 26 ? "second" : "third";
  const trimester = t(`pregnancy.trimester.${rawTrimester}`);
  
  const weeksLeft = 40 - currentWeek;
  
  // Calculate the visual position for the timeline marker (in percentage)
  const progressPercentage = `${Math.min(Math.max((currentWeek / 40) * 100, 0), 100)}%`;

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl p-6 shadow-md relative overflow-hidden border border-primary/10">
        {/* Enhanced decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 opacity-5 rotate-45">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
        </div>
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center">
              <h2 className="text-xl md:text-2xl font-montserrat font-bold text-primary flex items-center">
                <span className="bg-primary/10 p-1 md:p-2 rounded-full mr-2 md:mr-3 hidden md:flex">
                  <i className="fas fa-heartbeat text-primary"></i>
                </span>
                <span className="bg-primary/10 p-1 rounded-full mr-2 flex md:hidden">
                  <i className="fas fa-heartbeat text-primary text-sm"></i>
                </span>
                {t('pregnancy.journey')}
              </h2>
              <span className="ml-2 md:ml-3 bg-primary/10 text-primary text-xs md:text-sm py-1 px-2 md:px-3 rounded-full font-semibold">{trimester}</span>
            </div>
            <p className="text-neutral-dark text-sm md:text-base mt-2 ml-0 md:ml-11">{t('pregnancy.currentlyInWeek', { week: currentWeek })}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center bg-white px-4 py-2 rounded-lg border border-primary/20 shadow-sm">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" fill="currentColor"/>
            </svg>
            <span className="font-montserrat font-medium ml-2">{t('pregnancy.dueDate')}:</span>
            <span className="font-montserrat text-primary font-bold ml-2">{dueDate}</span>
          </div>
        </div>
        
        <div className="relative pt-1 mb-6">
          <div className="h-4 rounded-full overflow-hidden bg-gray-100">
            <div 
              className="h-full rounded-full"
              style={{
                width: progressPercentage,
                background: 'linear-gradient(to right, #8C6BAE, #9B7FC0)'
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-dark">
            <span className="font-medium">Week 1</span>
            <span className="font-medium">Week 13</span>
            <span className="font-medium">Week 27</span>
            <span className="font-medium">Week 40</span>
          </div>
          <div 
            className="absolute -top-1" 
            style={{ left: progressPercentage }}
          >
            <div className="h-6 w-6 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">{currentWeek}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-neutral-light rounded-lg p-4 shadow-sm transform transition-transform hover:scale-105 hover:shadow-md">
            <div className="text-sm text-neutral-dark font-medium">{t('pregnancy.currentWeek')}</div>
            <div className="text-xl font-montserrat font-bold text-primary-dark">{currentWeek}</div>
          </div>
          <div className="bg-neutral-light rounded-lg p-4 shadow-sm transform transition-transform hover:scale-105 hover:shadow-md">
            <div className="text-sm text-neutral-dark font-medium">{t('pregnancy.trimesterLabel')}</div>
            <div className="text-xl font-montserrat font-bold text-primary-dark">
              {t(`pregnancy.trimester.${rawTrimester}`).split(' ')[0]}
            </div>
          </div>
          <div className="bg-neutral-light rounded-lg p-4 shadow-sm transform transition-transform hover:scale-105 hover:shadow-md">
            <div className="text-sm text-neutral-dark font-medium">{t('pregnancy.weeksLeft')}</div>
            <div className="text-xl font-montserrat font-bold text-primary-dark">{weeksLeft}</div>
          </div>
          <div className="bg-neutral-light rounded-lg p-4 shadow-sm transform transition-transform hover:scale-105 hover:shadow-md">
            <div className="text-sm text-neutral-dark font-medium">{t('pregnancy.completed')}</div>
            <div className="text-xl font-montserrat font-bold text-primary-dark">{completionPercentage}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PregnancyProgress;
