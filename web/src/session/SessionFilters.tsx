import type { ProjectSummary } from './api';

interface Props {
  searchTerm: string;
  projectFilter: string;
  projects: ProjectSummary[];
  onSearchChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  isSearching: boolean;
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
}

export function SessionFilters({
  searchTerm,
  projectFilter,
  projects,
  onSearchChange,
  onProjectChange,
  isSearching,
  showDeleted,
  onShowDeletedChange,
}: Props) {
  return (
    <div className="session-filters">
      <input
        type="text"
        className="session-filters__search"
        placeholder="Search sessions..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="session-filters__project"
        value={projectFilter}
        onChange={(e) => onProjectChange(e.target.value)}
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.dir} value={p.dir}>
            {p.name} ({p.sessionCount})
          </option>
        ))}
      </select>
      <label className="session-filters__toggle">
        <input
          type="checkbox"
          checked={showDeleted}
          onChange={(e) => onShowDeletedChange(e.target.checked)}
        />
        Show hidden sessions
      </label>
      {isSearching && <div className="session-filters__loading">Searching...</div>}
    </div>
  );
}
