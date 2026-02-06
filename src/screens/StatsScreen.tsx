import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';

export default function StatsScreen() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-teal-900 mb-6">Statistics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
              <CardTitle className="text-teal-900">Total Patients</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-teal-600">0</div>
              <p className="text-sm text-gray-600 mt-2">Registered patients</p>
            </CardContent>
          </Card>
          <Card className="border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
              <CardTitle className="text-teal-900">Today's Visits</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-teal-600">0</div>
              <p className="text-sm text-gray-600 mt-2">Visits today</p>
            </CardContent>
          </Card>
          <Card className="border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
              <CardTitle className="text-teal-900">Active Visits</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-teal-600">0</div>
              <p className="text-sm text-gray-600 mt-2">In progress</p>
            </CardContent>
          </Card>
          <Card className="border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
              <CardTitle className="text-teal-900">Completed</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-teal-600">0</div>
              <p className="text-sm text-gray-600 mt-2">This month</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
