import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { InspectorPage } from '../pages/InspectorPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/inspector" element={<InspectorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
