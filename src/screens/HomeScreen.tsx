import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const CLINIC_NAME = import.meta.env.VITE_CLINIC_NAME || 'Clinic OPD Management';

export default function HomeScreen() {
  const navigate = useNavigate();

  const handleStartOPD = () => {
    navigate('/patient-search');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-6">
      <div className="text-center space-y-8 px-4 max-w-2xl">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Welcome to {CLINIC_NAME}
          </h1>
          <p className="text-lg text-gray-600">
            Manage your outpatient department efficiently
          </p>
        </div>
        <Button
          onClick={handleStartOPD}
          size="lg"
          className="text-lg px-8 py-6 shadow-lg"
          autoFocus
        >
          Start OPD
        </Button>
      </div>
    </div>
  );
}
