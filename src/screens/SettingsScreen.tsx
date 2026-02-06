import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Input, Button } from '../components/ui';
import { useClinic } from '../hooks/useClinic';
import { authService } from '../services/authService';
import { toast } from '../utils/toast';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { clinic, loading } = useClinic();
  const clinicName = clinic?.name || 'Clinic OPD Management';
  const clinicAddress = clinic?.address || '';
  const clinicPhone = clinic?.phone || '';
  const clinicEmail = clinic?.email || '';

  const handleLogout = () => {
    authService.logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-teal-900 mb-6">Settings</h1>
        <Card className="border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
            <CardTitle className="text-teal-900">Clinic Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {loading ? (
              <div className="text-sm text-gray-600">
                Loading clinic data...
              </div>
            ) : (
              <>
                <Input
                  label="Clinic Name"
                  value={clinicName}
                  disabled
                  className="bg-gray-50"
                />
                {clinicAddress && (
                  <Input
                    label="Address"
                    value={clinicAddress}
                    disabled
                    className="bg-gray-50"
                  />
                )}
                {clinicPhone && (
                  <Input
                    label="Phone"
                    value={clinicPhone}
                    disabled
                    className="bg-gray-50"
                  />
                )}
                {clinicEmail && (
                  <Input
                    label="Email"
                    value={clinicEmail}
                    disabled
                    className="bg-gray-50"
                  />
                )}
                <p className="text-sm text-gray-600">
                  Clinic information is loaded from the API.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="border-teal-200 mt-6">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
            <CardTitle className="text-teal-900">Account</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full md:w-auto text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
