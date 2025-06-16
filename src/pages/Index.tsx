
import SmartPomodoro from '@/components/SmartPomodoro';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Smart Pomodoro 2.0 - Anti-Procrastination Timer</title>
        <meta
          name="description"
          content="Boost productivity with Smart Pomodoro 2.0 - featuring anti-procrastination hacks, task management, habit tracking, and gamification."
        />
      </Helmet>
      <SmartPomodoro />
    </>
  );
};

export default Index;
