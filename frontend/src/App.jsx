import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import DashboardLayout from "./layout/DashboardLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Documents = lazy(() => import("./pages/Documents"));
const DocumentEditor = lazy(() => import("./pages/DocumentEditor"));
const Meetings = lazy(() => import("./pages/Meetings"));
const VideoMeet = lazy(() => import("./pages/VideoMeet"));
const Whiteboard = lazy(() => import("./pages/Whiteboard"));
const TaskBoard = lazy(() => import("./pages/TaskBoard"));
const Chat = lazy(() => import("./pages/Chat"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0B1220]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <LandingPage />
            </Suspense>
          }
        />

        {/* Password Reset Routes */}
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ResetPassword />
            </Suspense>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="documents"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Documents />
              </Suspense>
            }
          />
          <Route
            path="document/:id"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DocumentEditor />
              </Suspense>
            }
          />
          <Route
            path="meetings"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Meetings />
              </Suspense>
            }
          />
          <Route
            path="meet/:id"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <VideoMeet />
              </Suspense>
            }
          />
          <Route
            path="whiteboard"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Whiteboard />
              </Suspense>
            }
          />
          <Route
            path="tasks"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <TaskBoard />
              </Suspense>
            }
          />
          <Route
            path="chat"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Chat />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
