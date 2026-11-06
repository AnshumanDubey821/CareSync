import { useContext } from 'react';
import { DoctorSearchContext } from '../context/DoctorSearchContext';

export const useDoctorSearch = () => {
  const context = useContext(DoctorSearchContext);
  if (!context) {
    throw new Error('useDoctorSearch must be used within a DoctorSearchProvider');
  }
  return context;
};
