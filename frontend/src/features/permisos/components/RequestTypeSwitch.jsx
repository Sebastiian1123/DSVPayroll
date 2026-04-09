const RequestTypeSwitch = ({ options, selectedType, onChange }) => (
  <div className="permisos-type-switch">
    {Object.values(options).map((option) => (
      <button
        key={option.key}
        type="button"
        className={`permisos-type-switch__btn ${selectedType === option.key ? 'is-active' : ''}`}
        onClick={() => onChange(option.key)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default RequestTypeSwitch;


