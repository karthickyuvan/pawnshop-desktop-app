// export default function PledgeSearchBar({ search, setSearch }) {
//   return (
//     <div className="search-container">
//       <div className="search-wrapper">
//         {/* Search Icon */}
//         <span className="search-icon">🔍</span> 
//         <input
//           type="text"
//           className="search-input"
//           placeholder="Search by pledge number, customer name, or ID..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>
//     </div>
//   );
// }




export default function PledgeSearchBar({ search, setSearch }) {
  // Check if there is any text in the search bar
  const hasValue = search && search.length > 0;

  return (
    <div className="search-container">
      {/* Add the conditional class 'hide-icon' when text is present */}
      <div className={`search-wrapper ${hasValue ? 'hide-icon' : ''}`}>
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