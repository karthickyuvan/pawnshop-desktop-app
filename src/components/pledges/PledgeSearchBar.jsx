export default function PledgeSearchBar({ search, setSearch }) {
  return (
    <div className="search-container">
      <div className="search-wrapper">
        {/* Search Icon */}
        <span className="search-icon">🔍</span> 
        <input
          type="text"
          className="search-input"
          placeholder="Search by pledge number, customer name, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}