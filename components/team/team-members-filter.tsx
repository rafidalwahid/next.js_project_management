'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/hooks/use-data';
import { cn } from '@/lib/utils';

export interface TeamMembersFilters {
  search: string;
  projectId: string | null;
  sortBy: 'name' | 'role' | 'project';
  sortOrder: 'asc' | 'desc';
}

interface TeamMembersFilterProps {
  filters: TeamMembersFilters;
  onChange: (filters: TeamMembersFilters) => void;
  className?: string;
}

export function TeamMembersFilter({ filters, onChange, className }: TeamMembersFilterProps) {
  const [search, setSearch] = useState(filters.search);
  const { projects, isLoading: isLoadingProjects } = useProjects(1, 100);

  // Update search when filters change
  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Apply search filter when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== filters.search) {
        onChange({ ...filters, search });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filters, onChange]);

  // Handle project filter change
  const handleProjectChange = (value: string) => {
    onChange({
      ...filters,
      projectId: value === 'all' ? null : value,
    });
  };

  // Handle sort change
  const handleSortByChange = (value: string) => {
    onChange({
      ...filters,
      sortBy: value as 'name' | 'role' | 'project',
    });
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    onChange({
      ...filters,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onChange({
      search: '',
      projectId: null,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    setSearch('');
  };

  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.projectId;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search team members..."
            className="pl-8"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex gap-2">
          <Select value={filters.projectId || 'all'} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
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

          <Select value={filters.sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            title={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="outline" className="gap-1 pl-2">
                Search: {filters.search}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => onChange({ ...filters, search: '' })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove search filter</span>
                </Button>
              </Badge>
            )}
            {filters.projectId && (
              <Badge variant="outline" className="gap-1 pl-2">
                Project: {projects?.find(p => p.id === filters.projectId)?.title || 'Unknown'}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => onChange({ ...filters, projectId: null })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove project filter</span>
                </Button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
