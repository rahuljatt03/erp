import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, PhoneIcon } from './icons';

/**
 * Searchable country picker for <PhoneField>. Ported from Omrive's
 * CustomCountrySelect and restyled to the ERP design system. It is rendered by
 * react-phone-number-input as the `countrySelectComponent`, so the library hands
 * it `value` (ISO country code), `options` ([{ value, label }]), `onChange`, and
 * `iconComponent` (the flag) — this component renders the flag + dropdown itself.
 */
export default function CountrySelect({
  value,
  onChange,
  options,
  iconComponent: Flag,
  disabled,
  readOnly,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  // Close the menu when clicking anywhere outside it.
  useEffect(() => {
    function onDocMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // Focus the search box as soon as the menu opens.
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const matches = options.filter(
    (option) =>
      option.value && (option.label || '').toLowerCase().includes(search.toLowerCase()),
  );
  const selected = options.find((option) => option.value === value);

  return (
    <div className="phone-country" ref={rootRef}>
      <button
        type="button"
        className="phone-country__trigger"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled || readOnly}
        aria-label="Select country"
      >
        {value && Flag ? (
          <Flag country={value} label={selected?.label} />
        ) : (
          <PhoneIcon size={15} />
        )}
        <ChevronDownIcon size={13} className="phone-country__chevron" />
      </button>

      {open && (
        <div className="phone-country__menu">
          <div className="phone-country__search">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="phone-country__list">
            {matches.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`phone-country__option ${
                  option.value === value ? 'is-selected' : ''
                }`.trim()}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setSearch('');
                }}
              >
                {Flag && <Flag country={option.value} label={option.label} />}
                <span className="phone-country__option-label">{option.label}</span>
              </button>
            ))}
            {matches.length === 0 && (
              <div className="phone-country__empty">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
