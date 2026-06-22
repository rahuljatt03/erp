import PhoneInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import CountrySelect from './CountrySelect';

/**
 * Phone number input with a country-code selector and built-in formatting,
 * matching the Omrive pattern (react-phone-number-input). The value is held in
 * E.164 form (e.g. "+919876543210"); we emit '' instead of `undefined` when the
 * field is cleared so callers keep storing a plain string. Pair with
 * `phoneError` from shared/utils/phone for validation.
 *
 * Bundled SVG flags are used (no external CDN) so the picker works offline.
 */
export default function PhoneField({
  id,
  value,
  onChange,
  error = false,
  disabled = false,
  placeholder = 'Enter phone number',
  defaultCountry = 'IN',
}) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry={defaultCountry}
      flags={flags}
      countrySelectComponent={CountrySelect}
      placeholder={placeholder}
      value={value || undefined}
      onChange={(next) => onChange(next || '')}
      disabled={disabled}
      className={`phone-input ${error ? 'has-error' : ''}`.trim()}
    />
  );
}
