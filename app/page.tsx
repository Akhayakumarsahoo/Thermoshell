'use client';

import React from 'react';
import { ShelterProvider, useShelter } from '@/context/ShelterContext';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Step1Climate } from '@/components/Step1Climate';
import { Step2Design } from '@/components/Step2Design';
import { Step3Materials } from '@/components/Step3Materials';
import { Step4Results } from '@/components/Step4Results';
import { Step5Optimize } from '@/components/Step5Optimize';
import { Step6Report } from '@/components/Step6Report';

function WorkspaceContent() {
  const { currentStep } = useShelter();

  switch (currentStep) {
    case 1:
      return <Step1Climate />;
    case 2:
      return <Step2Design />;
    case 3:
      return <Step3Materials />;
    case 4:
      return <Step4Results />;
    case 5:
      return <Step5Optimize />;
    case 6:
      return <Step6Report />;
    default:
      return <Step1Climate />;
  }
}

export default function Home() {
  return (
    <ShelterProvider>
      <Header />
      <div className="app-layout">
        <Sidebar />
        <main className="workspace-main" id="step-workspace">
          <WorkspaceContent />
        </main>
      </div>
    </ShelterProvider>
  );
}
