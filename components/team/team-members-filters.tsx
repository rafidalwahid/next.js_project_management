'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project, TeamMembersFilters } from './team-types';

interface TeamMembersFiltersProps {
  filters: TeamMembersFilters;
  projects: Project[] | undefined;
  onFiltersChange: (filters: TeamMembersFilters) => void;
  className?: string;
}

/**
 * A memoized component for filtering team members
 * Handles search, project filtering, and sorting
 */
export const TeamMembersFilters = memo(function TeamMembersFilters({
  filters,
  projects,
  onFiltersChange,
  className,
}: TeamMembersFiltersProps) {
  // Local state for search input with debounce
  const [searchInput, setSearchInput] = useState(filters.search);

  // Update search when filters change externally
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Apply search filter when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // Handle project filter change
  const handleProjectChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        projectId: value === 'all' ? null : value,
      });
    },
    [filters, onFiltersChange]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        sortBy: value as 'name' | 'role' | 'project',
      });
    },
    [filters, onFiltersChange]
  );

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className || ''}`}>
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search team members..."
          className="pl-9 bg-background border-muted"
          value={searchInput}
          onChange={handleSearchChange}
          aria-label="Search team members"
        />
      </div>

      <div className="flex gap-2">
        <Select value={filters.projectId || 'all'} onValueChange={handleProjectChange}>
          <SelectTrigger
            className="w-[180px] bg-background border-muted"
            aria-label="Filter by project"
          >
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px] bg-background border-muted" aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="role">Sort by Role</SelectItem>
            <SelectItem value="project">Sort by Project</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});
