import { useEffect, useState } from 'react';
import LoadingBar from 'react-top-loading-bar';

export default function RouteProgressBar() {
  const [progress, setProgress] = useState(0);

  // In this app, we simulate "routing" by changing activeTripId
  // but we can also use this component to show progress during data fetching/auth checks
  return (
    <LoadingBar
      color="#FF6B35"
      progress={progress}
      onLoaderFinished={() => setProgress(0)}
      height={3}
      shadow={true}
    />
  );
}

// Helper hook to trigger progress
export function useLoadingBar() {
  const [progress, setProgress] = useState(0);

  const start = () => setProgress(30);
  const finish = () => setProgress(100);

  return { progress, start, finish };
}
