'use client';

import { useState, useRef } from 'react';
import { Camera, Check, X, Mail, Calendar, Edit2 } from 'lucide-react';
import { UserProfile } from '@/hooks/use-user-profile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface UserProfileHeaderProps {
  user: UserProfile;
  canEdit: boolean;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
  stats?: {
    projectCount: number;
    taskCount: number;
    teamCount: number;
    completionRate: string;
  };
}

export function UserProfileHeader({
  user,
  canEdit,
  onUpdateProfile,
  onUploadImage,
  stats = {
    projectCount: 0,
    taskCount: 0,
    teamCount: 0,
    completionRate: '0%',
  },
}: UserProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserInitials = () => {
    if (!user.name) return 'U';

    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return nameParts[0].substring(0, 2).toUpperCase();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setName(user.name || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    await onUpdateProfile({ name });
    setIsEditing(false);
  };

  const handleImageClick = () => {
    if (canEdit && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadImage(file);
    } finally {
      setIsUploading(false);
      // Clear the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column - Profile Card */}
      <div className="md:col-span-1 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        {/* Profile Header */}
        <div className="relative h-24 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500">
          {/* Overlay pattern for visual interest */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(circle,transparent_20%,#fff_20%,#fff_30%,transparent_30%,transparent_70%,#fff_70%,#fff_80%,transparent_80%)]"
            style={{ backgroundSize: '20px 20px' }}
          ></div>
        </div>

        {/* Profile Content */}
        <div className="relative px-6 pb-6 flex flex-col items-center text-center">
          {/* Avatar Section */}
          <div className="-mt-12 mb-4">
            <div className="relative">
              <Avatar
                className="h-24 w-24 border-4 border-background ring-1 ring-black/10 cursor-pointer shadow-md"
                onClick={handleImageClick}
              >
                {user.image ? <AvatarImage src={user.image} alt={user.name || 'User'} /> : null}
                <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-600 text-white text-3xl font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {canEdit && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <div className="absolute bottom-1 right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-xs ring-2 ring-background hover:bg-primary/90 transition-colors">
                    {isUploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="w-full">
            {isEditing ? (
              <div className="flex items-center gap-2 mb-3 justify-center">
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-9 w-full max-w-[250px]"
                  placeholder="Enter your name"
                />
                <Button size="sm" variant="default" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleEditToggle}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3 justify-center">
                <h2 className="text-xl font-bold">{user.name || 'Unnamed User'}</h2>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleEditToggle}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            <div className="text-sm text-muted-foreground mb-1">
              {user.jobTitle || 'Project Manager'}
            </div>

            <Badge variant="secondary" className="capitalize px-2 py-1 text-xs mb-4">
              {user.role}
            </Badge>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-left border-t pt-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Member since {formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {canEdit && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Stats and Additional Info */}
      <div className="md:col-span-2 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-bold text-primary">{stats?.projectCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-bold text-primary">{stats?.taskCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-bold text-primary">{stats?.teamCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Teams</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-bold text-primary">{stats?.completionRate ?? '0%'}</div>
            <div className="text-sm text-muted-foreground">Completion</div>
          </div>
        </div>

        {/* About Me Section */}
        <div className="rounded-xl border bg-card p-6 shadow-xs">
          <h3 className="text-lg font-semibold mb-4">About Me</h3>
          <p className="text-muted-foreground">
            {user.bio ||
              'No bio information available. Add a description about yourself, your skills, and experience.'}
          </p>

          {canEdit && !user.bio && (
            <Button variant="outline" size="sm" className="mt-4">
              <Edit2 className="h-4 w-4 mr-2" /> Add Bio
            </Button>
          )}
        </div>

        {/* Skills Section */}
        <div className="rounded-xl border bg-card p-6 shadow-xs">
          <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>
          <div className="flex flex-wrap gap-2">
            <Badge>Project Management</Badge>
            <Badge>UI/UX Design</Badge>
            <Badge>React</Badge>
            <Badge>TypeScript</Badge>
            <Badge>Next.js</Badge>
          </div>

          {canEdit && (
            <Button variant="outline" size="sm" className="mt-4">
              <Edit2 className="h-4 w-4 mr-2" /> Edit Skills
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
