import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './auth/pages/LandingPage'
import { LoginPage } from './auth/pages/LoginPage'
import { SignUpPage } from './auth/pages/SignUpPage'
import { CreateProfilePage } from './auth/pages/CreateProfilePage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { SocialPage } from './pages/SocialPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { CreatePostPage } from './pages/CreatePostPage'
import { ComposePostPage } from './pages/ComposePostPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { AddFriendsPage } from './pages/AddFriendsPage'
import { FriendsPage } from './pages/FriendsPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { ScrollToTop } from './components/ScrollToTop'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/create-profile" element={<CreateProfilePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="/add-friends" element={<AddFriendsPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/user/:userId" element={<UserProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/compose-post" element={<ComposePostPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
